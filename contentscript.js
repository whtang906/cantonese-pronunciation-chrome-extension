const DATABASE_URL =
    "https://humanum.arts.cuhk.edu.hk/Lexis/lexi-mf/search.php?word=";

document.addEventListener("mouseup", function() {
    let selectedString = window.getSelection().toString();
    if (selectedString) {
        fetch(`${DATABASE_URL}${selectedString}`, {
            method: "GET",
            mode: "cors"
        })
            .then(res => res.text())
            .then(text => {
                let parser = new DOMParser();
                let html = parser.parseFromString(text, "text/html");
                console.log(html.querySelector('#char_can_table .char_can_head>a').getAttribute('onclick').match(/'([^']+)'/)[1])
            });
    }
});
