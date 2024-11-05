import React, { useState, useEffect } from "react";
import { createRoot } from 'react-dom/client';
import PronunciationCard from "../common/PronunciationCard";

import "./style.css";

const Popup = () => {
    const re = /^[\u4E00-\u9FA5]+$/;
    const [searchInput, setSearchInput] = useState<string>('');
    const [words, setWords] = useState<string[]>([]);

    const handleSearch = () => {
        if (searchInput.trim() !== '') {
            setWords(searchInput.split(''));
          }
    };

    useEffect(() => {
        chrome.storage.sync.get(["selectedString"], (result: any) => {
            if (result && result !== "") {
                const trimmedString = result.selectedString.substring(0, 10);
                setSearchInput(trimmedString);
                if (trimmedString.trim() !== '') {
                    setWords(trimmedString.split(''));
                }
            }
        });
    }, []);

    return (
        <div id="content">
            <div id="option"><a id="option-page" href={chrome.runtime.getURL("/options.html")} target="_blank">插件設定</a></div>
            <div id="search-section">
                <input 
                    id="search-input" 
                    type="text" 
                    maxLength={10} 
                    value={searchInput} 
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <div id="search-btn" className="btn" onClick={handleSearch}>搜索</div>
            </div>
            <div id="result-section">
                {words.map((word, index) => {
                    if (re.test(word))  return <PronunciationCard key={`${word}-${index}`} id={`${word}-${index}`} word={word} isPopover={false} />;
                })}
            </div>
            <div id="credit">資料來源：<a href="https://humanum.arts.cuhk.edu.hk/Lexis/lexi-mf/" target="_blank">漢語多功能字庫</a></div>
        </div>
    );
};

const root = createRoot(document.getElementById('root') as HTMLElement);

root.render(
    <React.StrictMode>
        <Popup />
    </React.StrictMode>
);