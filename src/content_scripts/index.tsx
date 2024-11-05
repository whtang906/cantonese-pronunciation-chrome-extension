import React from 'react';
import { createRoot } from 'react-dom/client';
import PronunciationCard from '../common/PronunciationCard';

function isBelongsInputEl(el: Selection) {
    const nodes = el.anchorNode?.childNodes || [];
    let result = false;

    if (nodes.length !== 0) {
        nodes.forEach((node: Node) => {
            if (node.nodeName === "INPUT" || node.nodeName === "TEXTAREA") {
                result = true;
            }
        });
    }

    return result;
}

function getSelectedStringPosition(selectedEl: Selection) {
    return selectedEl.getRangeAt(0)?.getBoundingClientRect();
}

function cleanup() {
    const popoverHost = document.getElementById("cp-popover-host");
    if (popoverHost) {
        popoverHost.remove();
    }
}

function renderPronunciations() {
    try {
        let selectedEl = window.getSelection();
        let popoverHost = document.getElementById("cp-popover-host") as HTMLDivElement;

        if (selectedEl && !popoverHost) {
            if (selectedEl.rangeCount && !isBelongsInputEl(selectedEl)) {
                let selectedString = selectedEl.toString();
                let re = /^[\u4E00-\u9FA5]+$/;

                if (selectedString && selectedString.length === 1 && re.test(selectedString)) {
                    popoverHost = document.createElement("div") as HTMLDivElement;
                    popoverHost.id = "cp-popover-host";

                    const shadowRoot = popoverHost.attachShadow({mode: 'open'}) as ShadowRoot;
                    document.body.appendChild(popoverHost);

                    const root = createRoot(shadowRoot);
                    root.render(
                        <React.StrictMode>
                            <PronunciationCard 
                                id={`${selectedString}-popover`}
                                isPopover={true}
                                word={selectedString}
                                wordPosition={getSelectedStringPosition(selectedEl)}
                                onClose={() => {
                                    if (popoverHost) {
                                        root.unmount();
                                        document.body.removeChild(popoverHost);
                                    }
                                }}
                            />
                        </React.StrictMode>
                    );
                }
            }
        }
    } catch (error) {
        if (error instanceof Error && !error.message.includes('Extension context invalidated')) {
            console.error('Render error:', error);
        }
        cleanup();
    }
}

function getTriggerKey(): Promise<string> {
    return new Promise((resolve) => {
        if (!chrome?.storage?.sync?.get) {
            resolve("None");
            return;
        }

        chrome.storage.sync.get(["triggerKey"])
            .then(result => resolve(result.triggerKey || "None"))
            .catch(() => resolve("None"));
    });
}

window.addEventListener("mousedown", (e) => {
    try {
        const popoverEl = document.getElementById("cp-popover-host") as HTMLDivElement;
        if (popoverEl && !popoverEl.contains(e.target as Node)) {
            popoverEl.remove();
        }
    } catch (error) {
        if (error instanceof Error && !error.message.includes('Extension context invalidated')) {
            console.error('Mousedown error:', error);
        }
        cleanup();
    }
});

document.addEventListener("mouseup", () => {
    getTriggerKey().then(triggerKey => {
        let selectedEl = window.getSelection();
        if (chrome?.storage?.sync?.set) {
            if (selectedEl?.rangeCount && !selectedEl?.isCollapsed) {
                chrome.storage.sync.set({ selectedString: selectedEl?.toString() })
                    .catch(() => {});
            } else {
                chrome.storage.sync.set({ selectedString: "" })
                    .catch(() => {});
            }
        }
    
        if (triggerKey === "None") {
            renderPronunciations();
        }
    });
});

document.addEventListener("keyup", (e) => {
    getTriggerKey().then(triggerKey => {
        if (triggerKey !== "None" && e.key === triggerKey) {
            renderPronunciations();
        }
    });
});
