const playIconUrl = chrome.extension.getURL("images/play.png");

function playAudio(url) {
    let audio = new Audio(url);
    audio.play();
}

function createPronunciationTitle(title) {
    let pronunciationTitleEl = document.createElement("p");
    pronunciationTitleEl.innerHTML = title;

    return pronunciationTitleEl;
}

function createPronunciationTable(pronunciations) {
    let pronunciationTableEl = document.createElement("table");
    let groupedResult = new Array(pronunciations.length > 3 ? 3 : pronunciations.length); // Rearrange the result to a 3 x N Array

    pronunciations.forEach((pronunciation, index) => {
        if (!groupedResult[index % 3]) {
            groupedResult[index % 3] = [];
        }
        groupedResult[index % 3].push(pronunciation);
    });

    groupedResult.forEach(pronunciations => {
        let pronunciationRowEl = document.createElement("tr");
        pronunciations.forEach(pronunciation => {
            let pronunciationEl = document.createElement("td");

            let playBtn = document.createElement("img");
            playBtn.src = playIconUrl;
            playBtn.onclick = e => playAudio(pronunciation.audioUrl);

            let textEl = document.createElement("span");
            textEl.innerHTML = `${pronunciation.pronunciation}`;

            pronunciationEl.className = "cp-popover-content-pronunciation";
            pronunciationEl.appendChild(textEl);
            pronunciationEl.appendChild(playBtn);

            pronunciationRowEl.appendChild(pronunciationEl);
        });
        pronunciationTableEl.appendChild(pronunciationRowEl);
    });

    return pronunciationTableEl;
}

function createPronunciationCreditLink(word) {
    let creditLinkWrapperEl = document.createElement("div");
    creditLinkWrapperEl.id = "cp-popover-credit";

    let creditLinkEl = document.createElement("a");
    creditLinkEl.href = `https://humanum.arts.cuhk.edu.hk/Lexis/lexi-mf/search.php?word=${word}`;
    creditLinkEl.target = "_blank";
    creditLinkEl.innerHTML = "查看更多";

    creditLinkWrapperEl.appendChild(creditLinkEl);

    return creditLinkWrapperEl;
}

function createPronunciationMessage(message) {
    let pronunciationMsgEl = document.createElement("div");
    pronunciationMsgEl.id = "cp-popover-content-pronunciation-message";
    pronunciationMsgEl.innerHTML = message;

    return pronunciationMsgEl;
}

function renderPronunciations(inputString) {
    $(".word").remove();

    let re = /^[\u4E00-\u9FA5]+$/;

    fetch(chrome.extension.getURL("/popover.html"))
        .then(res => res.text())
        .then(text => {
            [...inputString].forEach(word => {
                if (re.test(word)) {
                    let popoverHost = document.createElement("div");
                    popoverHost.className = "word";

                    let shardow = popoverHost.createShadowRoot();

                    let parser = new DOMParser();
                    let doc = parser.parseFromString(text, "text/html");

                    let popoverWrapper = doc.querySelector("#cp-popover-wrapper");
                    let popover = doc.querySelector("#cp-popover");

                    let content = popover.querySelector("#cp-popover-content");

                    let title = content.querySelector("#cp-popover-content-title");
                    let pronunciationList = content.querySelector("#cp-popover-content-pronunciation-list");

                    shardow.appendChild(popoverWrapper);

                    title.innerHTML = word;
                    popover.querySelector("#cp-popover-close-btn").remove();
                    popover.querySelector("#cp-popover-arrow").remove();
                    popover.querySelector("#cp-popover-arrow-outer").remove();

                    $("#result-section").append(popoverHost);

                    chrome.runtime.sendMessage(
                        {
                            type: "getPronunciations",
                            word
                        },
                        function(result) {
                            content.querySelector("#cp-popover-searching-text").remove();

                            if (result.pronunciations.length > 0) {
                                pronunciationList.appendChild(createPronunciationTitle("粵音"));
                                pronunciationList.appendChild(createPronunciationTable(result.pronunciations));

                                content.appendChild(createPronunciationCreditLink(word));
                            } else {
                                pronunciationList.appendChild(createPronunciationMessage("查無此字"));
                            }
                        }
                    );
                }
            });
        });
}

$(document).ready(function() {
    $("#search-btn").click(function() {
        renderPronunciations($("#search-input").val());
    });
    $("#search-input").keypress(function(e) {
        if (e.keyCode === 13) {
            renderPronunciations($("#search-input").val());
        }
    });
});

window.onload = function() {
    chrome.storage.sync.get(["selectedString"], result => {
        if (result !== "") {
            trimmedString = result.selectedString.substring(0, 10);
            $("#search-input").val(trimmedString);
            $("#search-btn").click();
        }
    });
};
