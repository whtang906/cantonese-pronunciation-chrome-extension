const BASE_URL = "https://humanum.arts.cuhk.edu.hk/Lexis/lexi-mf/";
const SEARCH_URL = `${BASE_URL}search.php?word=`;

function getPronunciations(word) {
    let pronunciations = [];
    return fetch(`${SEARCH_URL}${word}`, {
        method: "GET",
        mode: "cors"
    })
        .then(res => res.text())
        .then(text => {
            let parser = new DOMParser();
            let html = parser.parseFromString(text, "text/html");
            let audioPlayerEl = html.querySelectorAll("#char_can_table .char_can_head>a");

            if (audioPlayerEl) {
                audioPlayerEl.forEach(pronunciationEl => {
                    const audioUrl = pronunciationEl.getAttribute("onclick").match(/'([^']+)'/)[1];
                    const pronunciation = audioUrl.match(/sound\/([^']+).[mM][pP]3/)[1];

                    pronunciations.push({
                        pronunciation,
                        audioUrl: `${BASE_URL}${audioUrl}`
                    });
                });
            }
            return pronunciations;
        });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch (request.type) {
        case "getPronunciations":
            getPronunciations(request.word)
                .then(result => sendResponse({ pronunciations: result }))
            break;
        default:
    }

    return true;
});

chrome.runtime.onInstalled.addListener(function() {});
