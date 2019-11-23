let page = document.querySelector(".radio-btn-additional-info");
const options = ["Control", "Shift", "Alt"];

function removeSelectedOptionClass() {
    $(".radio-btn-gp").removeClass("selected");
}

function constructOptions(options) {
    let selectEl = document.createElement("select");
    selectEl.id = "keyup-options";
    selectEl.defaultValue = options[0];

    chrome.storage.sync.get(["triggerKey"], result => {
        if (result.triggerKey !== "None") {
            $(".radio-btn-gp[data-value='keyup']").addClass("selected");
            selectEl.value = result.triggerKey;
        } else {
            $(".radio-btn-gp[data-value='auto']").addClass("selected");
        }
    });

    for (let option of options) {
        let optionEl = document.createElement("option");

        optionEl.value = option;
        optionEl.innerHTML = option;

        selectEl.appendChild(optionEl);
    }

    page.appendChild(selectEl);
}

function saveOptions() {
    const triggerType = $(".radio-btn-gp.selected").attr("data-value");

    if (triggerType === "auto") {
        chrome.storage.sync.set({ triggerKey: "None" });
    } else if (triggerType === "keyup") {
        chrome.storage.sync.set({ triggerKey: $("#keyup-options").val() });
    }
}

function resetOptions() {
    removeSelectedOptionClass();
    $(".radio-btn-gp[data-value='auto']").addClass("selected");
    $("#keyup-options").val(options[0]);
    chrome.storage.sync.set({ triggerKey: "None" });
}

$(document).ready(function() {
    $(".radio-btn-gp").click(function() {
        removeSelectedOptionClass();
        $(this).addClass("selected");
    });

    $("#save-btn").click(saveOptions);
    $("#reset-btn").click(resetOptions);

    constructOptions(options);
});
