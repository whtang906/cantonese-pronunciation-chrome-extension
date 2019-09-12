document.addEventListener("mouseup", function(event) {
    let selectedString = window.getSelection().toString();
    let re = /^[\u4E00-\u9FA5]+$/;

    if (selectedString && selectedString.length === 1 && re.test(selectedString)) {
        console.log(event.clientX, event.clientY);
        // TODO - Insert button near the string position

        chrome.runtime.sendMessage({
            type: 'getPronunciation',
            word: selectedString
        });
    }
});