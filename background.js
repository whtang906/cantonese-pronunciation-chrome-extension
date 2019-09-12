const BASE_URL = 'https://humanum.arts.cuhk.edu.hk/Lexis/lexi-mf/';
const SEARCH_URL = `${BASE_URL}search.php?word=`;

function getPronunciation(word) {
        fetch(`${SEARCH_URL}${word}`, {
            method: "GET",
            mode: "cors"
        })
            .then(res => res.text())
            .then(text => {
                let parser = new DOMParser();
                let html = parser.parseFromString(text, "text/html");
                let audioPlayerEl = html.querySelector('#char_can_table .char_can_head>a');
                if (audioPlayerEl) {
                    const audioUrl = audioPlayerEl.getAttribute('onclick').match(/'([^']+)'/)[1];
                    console.log(`${BASE_URL}${audioUrl}`);
                    let audio = new Audio(`${BASE_URL}${audioUrl}`);
                    audio.play();
                }
            });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log(request)
    switch(request.type) {
        case 'getPronunciation':
            getPronunciation(request.word);
            break;
        default:
    }
})

chrome.runtime.onInstalled.addListener(function() {
});
