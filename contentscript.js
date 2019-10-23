const playIconUrl = chrome.extension.getURL("images/play.png");
let triggerMethod;

chrome.storage.sync.get(["triggerKey"], result => {
    triggerMethod = result.triggerKey || "None";
});

chrome.storage.onChanged.addListener((changes, namepsace) => {
    triggerMethod = changes.triggerKey.newValue;
});

function playAudio(url) {
    let audio = new Audio(url);
    audio.play();
}

function adjustPopoverPosition(selectedStringPosition, popover) {
    const OFFSET = 12;
    const popoverHeight = popover.offsetHeight;
    const popoverWidth = popover.offsetWidth;
    const { top: stringTop, right: stringRight, bottom: stringBottom, left: stringLeft } = selectedStringPosition;

    let x, y;
    x = window.scrollX + (stringLeft + stringRight - popoverWidth) / 2;

    if (popoverHeight < window.scrollY + stringTop - OFFSET) {
        y = window.scrollY + stringTop - popoverHeight - OFFSET;
    } else {
        y = stringBottom + OFFSET;
        popover.querySelector("#cp-popover-arrow").className += "upside-down";
        popover.querySelector("#cp-popover-arrow-outer").className += "upside-down";
    }

    popover.setAttribute("style", `top: ${y}px; left: ${x}px;`);
    popover.style.visibility = "visible";
}

function closePopover() {
    let popoverEl = document.getElementById("cp-popover-host");
    if (popoverEl) {
        popoverEl.remove();
    }
}

function isBelongsInputEl(el) {
    const nodes = el.anchorNode.childNodes;
    let result = false;

    if (nodes.length !== 0) {
        nodes.forEach(node => {
            if (node.tagName === "INPUT" || node.tagName === "TEXTAREA") {
                result = true;
            }
        });
    }

    return result;
}

function main() {
    let selectedEl = window.getSelection();
    let popoverEl = document.getElementById("cp-popover-host");

    if (!popoverEl) {
        if (selectedEl.rangeCount && !isBelongsInputEl(selectedEl)) {
            let selectedStringPosition = selectedEl.getRangeAt(0).getBoundingClientRect();
            let selectedString = selectedEl.toString();
            let re = /^[\u4E00-\u9FA5]+$/;

            if (selectedString && selectedString.length === 1 && re.test(selectedString)) {
                fetch(chrome.extension.getURL("/popover.html"))
                    .then(res => res.text())
                    .then(text => {
                        let popoverHost = document.createElement('div');
                        popoverHost.id = "cp-popover-host";
                        let shardow = popoverHost.createShadowRoot();

                        let parser = new DOMParser();
                        let doc = parser.parseFromString(text, "text/html");

                        let popoverWrapper = doc.querySelector("#cp-popover-wrapper");
                        let popover = doc.querySelector("#cp-popover");

                        let closeBtn = popover.querySelector("#cp-popover-close-btn");
                        let content = popover.querySelector("#cp-popover-content");

                        let title = content.querySelector("#cp-popover-content-title");
                        let pronunciationList = content.querySelector("#cp-popover-content-pronunciation-list");
                        let creditLink = content.querySelector("#cp-popover-credit>a");

                        closeBtn.onclick = e => closePopover();
                        title.innerHTML = selectedString;
                        creditLink.href = `https://humanum.arts.cuhk.edu.hk/Lexis/lexi-mf/search.php?word=${selectedString}`;

                        shardow.appendChild(popoverWrapper);
                        document.body.appendChild(popoverHost);

                        chrome.runtime.sendMessage(
                            {
                                type: "getPronunciations",
                                word: selectedString
                            },
                            function(result) {
                                if (result.pronunciations.length > 0) {
                                    let pronunciationTitleEl = document.createElement("p");
                                    pronunciationTitleEl.innerHTML = "粵音";

                                    let pronunciationTableEl = document.createElement("table");
                                    let groupedResult = new Array(result.pronunciations.length > 3 ? 3 : result.pronunciations.length);

                                    result.pronunciations.forEach((pronunciation, index) => {
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
                                    pronunciationList.appendChild(pronunciationTitleEl);
                                    pronunciationList.appendChild(pronunciationTableEl);
                                } else {
                                    let pronunciationMsgEl = document.createElement("div");
                                    pronunciationMsgEl.id = "cp-popover-content-pronunciation-message";
                                    pronunciationMsgEl.innerHTML = "查無此字";

                                    pronunciationList.appendChild(pronunciationMsgEl);

                                    creditLink.remove();
                                }
                                adjustPopoverPosition(selectedStringPosition, popover);
                            }
                        );
                    });
            }
        }
    }
}

window.addEventListener("mousedown", function(e) {
    // Remove existing popover if popover outside is clicked
    let popoverEl = document.getElementById("cp-popover-host");
    
    if (popoverEl) {
        if (!popoverEl.contains(e.target)) {
            popoverEl.remove();
        }
    }
});

document.addEventListener("mouseup", function(e) {
    if (triggerMethod === "None") {
        main();
    }
});

document.addEventListener("keyup", function(e) {
    console.log(e.key, triggerMethod)
    if (triggerMethod !== "None" && e.key === triggerMethod) {
        main();
    }
});
