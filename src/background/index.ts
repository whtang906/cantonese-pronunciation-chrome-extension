let creating: Promise<void> | null = null; // A global promise to avoid concurrency issues
const pendingResponses: { [key: string]: (resposne?: any) => void } = {};

async function setupOffscreenDocument(path: string) {
    // Check all windows controlled by the service worker to see if one
    // of them is the offscreen document with the given path
    const offscreenUrl = chrome.runtime.getURL(path);
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
        documentUrls: [offscreenUrl],
    });

    if (existingContexts.length > 0) {
        return;
    }

    // create offscreen document
    if (creating) {
        await creating;
    } else {
        creating = chrome.offscreen.createDocument({
            url: path,
            reasons: [chrome.offscreen.Reason.DOM_SCRAPING],
            justification: "extract information from the page",
        });
        await creating;
        creating = null;
    }
}

// async/await is not supported in chrome.runtime.onMessage.addListener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.target !== "background") return false;

    switch (message.type) {
        case "getPronunciations":
            pendingResponses[message.requestId] = sendResponse;

            setupOffscreenDocument("/off_screen.html").then(() => {
                chrome.runtime.sendMessage({ 
                    type: 'fetchPronunciations', 
                    target: 'offscreen',
                    requestId: message.requestId,
                    word: message.word 
                });
            }).catch(error => {
                sendResponse({ error: 'Failed to setup offscreen document', pronunciations: [] });
            });
            
            return true;
        case "offscreenResult":
            if (pendingResponses[message.requestId]) {
                pendingResponses[message.requestId]({ pronunciations: message.pronunciations });
                delete pendingResponses[message.requestId];
            }
            break;
        default:
            console.warn(`Unexpected message type received: '${message.type}'.`);
    }
});

chrome.runtime.onInstalled.addListener(function () {});
