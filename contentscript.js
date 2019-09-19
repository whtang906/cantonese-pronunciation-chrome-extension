function playAudio(url) {
    let audio = new Audio(url);
    audio.play();
};

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
        popover.querySelector('#cp-popover-arrow').className += 'upside-down';
        popover.querySelector('#cp-popover-arrow-outer').className += 'upside-down';
    }

    popover.setAttribute('style', `top: ${y}px; left: ${x}px;`);
    popover.style.visibility = 'visible';
};

function closePopover() {
    let popoverEl = document.getElementById('cp-popover');
    if (popoverEl) {
        popoverEl.remove();
    }
}

window.addEventListener('mouseup', function(e) {
    // Remove existing popover if popover outside is clicked
    let popoverEl = document.getElementById('cp-popover');
    if (popoverEl) {
        if (!popoverEl.contains(e.target)) {
            popoverEl.remove();
        }
    }
});

document.addEventListener('mouseup', function(e) {
    let selectedEl = window.getSelection();
    if (selectedEl.rangeCount) {
        let selectedStringPosition = selectedEl.getRangeAt(0).getBoundingClientRect();
        let selectedString = selectedEl.toString();
        let re = /^[\u4E00-\u9FA5]+$/;
    
        if (selectedString && selectedString.length === 1 && re.test(selectedString)) {
            // TODO - Insert button near the string position
            fetch(chrome.extension.getURL('/popover.html'))
                .then(res => res.text())
                .then(text => {
                    let parser = new DOMParser();
                    let doc = parser.parseFromString(text, 'text/html');
                    let popover = doc.querySelector('#cp-popover');
                    let closeBtn = popover.querySelector('#cp-popover-close-btn');
                    let content = popover.querySelector('#cp-popover-content');
                    let title = content.querySelector('#cp-popover-content-title');
                    let pronunciationList = content.querySelector('#cp-popover-content-pronunciation-list');
                    let creditLink = content.querySelector('#cp-popover-credit>a');

                    closeBtn.onclick = (e) => closePopover();
                    title.innerHTML = selectedString;
                    creditLink.href = `https://humanum.arts.cuhk.edu.hk/Lexis/lexi-mf/search.php?word=${selectedString}`

                    document.body.appendChild(popover);

                    chrome.runtime.sendMessage({
                        type: 'getPronunciations',
                        word: selectedString
                    }, function(result) {
                        result.pronunciations.forEach((pronunciation, index) => {
                            let pronunciationEl = document.createElement('div');

                            pronunciationEl.className = 'cp-popover-content-pronunciation';
                            pronunciationEl.innerHTML = `${index + 1}. ${pronunciation.pronunciation}`;
                            pronunciationEl.onclick = (e) => playAudio(pronunciation.audioUrl);

                            pronunciationList.appendChild(pronunciationEl);
                        })
                        
                        adjustPopoverPosition(selectedStringPosition, popover);
                    });
                })
    
        }
    }
});