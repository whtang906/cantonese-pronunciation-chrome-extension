import React, { useState, useEffect } from "react";
import { createRoot } from 'react-dom/client';
import classNames from "classnames";

import "./style.css";

const options = ['Control', 'Shift', 'Alt'];

const OptionPage = () => {
    const [triggerType, setTriggerType] = useState<string>('auto');
    const [triggerKey, setTriggerKey] = useState<string>('Control');

    useEffect(() => {
        chrome.storage.sync.get(['triggerKey'], (result) => {
            if (result.triggerKey && result.triggerKey !== 'None') {
                setTriggerType('keyup');
                setTriggerKey(result.triggerKey);
            } else {
                setTriggerType('auto');
            }
        });
    }, []);

    const handleSave = () => {
        if (triggerType === 'auto') {
            chrome.storage.sync.set({ triggerKey: 'None' });
        } else if (triggerType === 'keyup') {
            chrome.storage.sync.set({ triggerKey });
        }
    };

    const handleReset = () => {
        setTriggerType('auto');
        setTriggerKey(options[0]);
        chrome.storage.sync.set({ triggerKey: 'None' });
    };

    return (
        <div id="content">
            <div className="logo-wrapper">
                <img id="logo" src="images/icon.png" alt="粵讀" />
            </div>
            <h1>擴充功能選項</h1>
            <div className="options-gp">
                <div id="cp-popup-trigger" className="option-row">
                    <div className="option-name">如何觸發彈出式視窗：</div>
                    <div className="option-value-list">
                        <div className={classNames("radio-btn-gp", { "selected": triggerType === 'auto' })} data-value="auto">
                            <span className="radio-btn" onClick={() => setTriggerType('auto')}></span>
                            <div className="radio-btn-label">選取中文單辭後，立即顯示彈出式視窗</div>
                        </div>
                        <div className={classNames("radio-btn-gp", { "selected": triggerType === 'keyup' })} data-value="keyup">
                            <span className="radio-btn" onClick={() => setTriggerType('keyup')}></span>
                            <div className="radio-btn-label">選取中文單辭後，按下指定鍵才顯示彈出式視窗</div>
                            <div className="radio-btn-additional-info">
                                <span>指定鍵：</span>
                                <select 
                                    id="keyup-options"
                                    value={triggerKey}
                                    onChange={(e) => setTriggerKey(e.target.value)}
                                >
                                    {options.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="btn-gp">
                <button id="save-btn" className="btn" onClick={handleSave}>儲存</button>
                <button id="reset-btn" className="btn" onClick={handleReset}>重設</button>
            </div>
        </div>
    );
};

const root = createRoot(document.getElementById('root') as HTMLElement);

root.render(
    <React.StrictMode>
        <OptionPage />
    </React.StrictMode>
);