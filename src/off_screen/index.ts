import { Pronunciation } from "../types";

const BASE_URL = "https://humanum.arts.cuhk.edu.hk/Lexis/lexi-mf/";
const SEARCH_URL = `${BASE_URL}search.php?word=`;

async function getPronunciations(word: string): Promise<Pronunciation[]> {
    let pronunciations: Pronunciation[] = [];

    try {
        const res = await fetch(`${SEARCH_URL}${word}`, {
            method: "GET",
            mode: "cors",
        });
        const text = await res.text();
        const parser = new DOMParser();
        const html = parser.parseFromString(text, "text/html");
        const audioPlayerEls = html.querySelectorAll("#char_can_table .char_can_head>a");

        audioPlayerEls.forEach((pronunciationEl: any) => {
            const audioUrl = pronunciationEl.getAttribute("onclick")?.match(/'([^']+)'/)?.[1] ?? "";
            const pronunciation = audioUrl.match(/sound\/([^']+).[mM][pP]3/)?.[1] ?? "";

            if (audioUrl && pronunciation) {
                pronunciations.push({
                    audioUrl: `${BASE_URL}${audioUrl}`,
                    pronunciation,
                });
            }
        });
    } catch (error) {
        console.error("Error fetching pronunciations:", error);
    }

    return pronunciations;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.target !== "offscreen") return false;

    switch (message.type) {
        case "fetchPronunciations":
            getPronunciations(message.word).then(pronunciations => {
                chrome.runtime.sendMessage({ 
                    type: 'offscreenResult', 
                    target: 'background',
                    requestId: message.requestId,
                    pronunciations 
                });
            });
            break;
        default:
            console.warn(`Unexpected message type received: '${message.type}'.`);
            return false;
    }
});