import React, { useState, useEffect, useRef } from "react";
import { Pronunciation } from "../../types";

import classNames from "classnames";
import "./style.css";
import css from "./style.css?raw";

const playIconUrl = chrome.runtime.getURL("images/play.png");
const bookmarkImageUrl = chrome.runtime.getURL("images/bookmark.png");
const OFFSET = 12;

type Props = {
    id: string;
    isPopover: boolean;
    word: string;
    wordPosition?: DOMRect;
    style?: React.CSSProperties;
    onClose?: () => void;
};

type Size = {
    width: number;
    height: number;
}

type Position = {
    x: number;
    y: number;
}

const PronunciationCard = ({ id, isPopover, word, wordPosition, style, onClose, ...props }: Props) => {
    const ref = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState<Size>({ width: 0, height: 0 });
    const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
    const [isUpsideDown, setIsUpsideDown] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [pronunciations, setPronunciations] = useState<any[]>([]);
    const { top, right, bottom, left } = wordPosition || { top: 0, right: 0, bottom: 0, left: 0 };

    const playAudio = (url: string) => {
        const audio = new Audio(url);
        audio.play();
    };
    
    const fetchPronunciations = async (word: string) => {
        setIsLoading(true);
        const result = await chrome.runtime.sendMessage({ 
            type: 'getPronunciations', 
            target: 'background',
            word, 
            requestId: `${id}-${Date.now()}`
        });
        
        setIsLoading(false);
        if (result.pronunciations.length > 0) {
            setPronunciations(result.pronunciations);
        } else {
            setErrorMessage('查無此字');
        }
    };

    const renderPronunciationTable = (pronunciations: Pronunciation[]) => {
        const groupedPronunciations = new Array(pronunciations.length > 3 ? 3 : pronunciations.length); // Rearrange the result to a 3 x N Array
    
        pronunciations.forEach((pronunciation: Pronunciation, index) => {
            if (!groupedPronunciations[index % 3]) {
                groupedPronunciations[index % 3] = [];
            }
            groupedPronunciations[index % 3].push(pronunciation);
        });

        return (
            <table>
                <tbody>
                    {groupedPronunciations.map((pronunciations: Pronunciation[], rowIndex) => (
                        <tr key={`row-${rowIndex}`}>
                            {pronunciations.map((pronunciation: Pronunciation, colIndex) => (
                                <td key={`col-${rowIndex}-${colIndex}`} className="cp-popover-content-pronunciation">
                                    <span>{pronunciation.pronunciation}</span>
                                    <img src={playIconUrl} onClick={() => playAudio(pronunciation.audioUrl)} />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        )
    };

    useEffect(() => {
        if (ref.current) {
            setSize({ width: ref.current.offsetWidth, height: ref.current.offsetHeight });
        }
    }, [word, ref.current, pronunciations]);

    useEffect(() => {
        setIsUpsideDown(size.height >= (window.scrollY + top - OFFSET));
        setPosition({
            x: window.scrollX + (left + right - size.width) / 2,
            y: isUpsideDown ? (bottom + OFFSET) : (window.scrollY + top - size.height - OFFSET)
        });
    }, [size, wordPosition]);

    useEffect(() => {
        const re = /^[\u4E00-\u9FA5]+$/;
        if (!isLoading && word && word !== '' && re.test(word)) {
            fetchPronunciations(word);
        }
    }, [word]);

    return (
        <div 
            ref={ref}
            id="cp-popover" 
            className={classNames({"popover": isPopover})} 
            style={isPopover ? { top: position.y, left: position.x, ...style } : style}
            {...props} 
        >
            {isPopover && <style>{css}</style>}
            {isPopover && <div id="cp-popover-close-btn" onClick={onClose}>✖</div>}
            <div id="cp-popover-content" className="cp-popover-searching">
                {isPopover && <div id="cp-popover-bookmark" style={{ backgroundImage: `url(${bookmarkImageUrl})` }} ></div>}
                <div id="cp-popover-content-title">{word}</div>
                <div id="cp-popover-content-pronunciation-list">
                    {isLoading && <div id="cp-popover-searching-text">搜尋中……</div>}
                    {errorMessage && <div id="cp-popover-content-pronunciation-message">{errorMessage}</div>}
                    {pronunciations.length > 0 && <p>粵音</p>}
                    {pronunciations.length > 0 && renderPronunciationTable(pronunciations)}
                </div>
                {
                    pronunciations.length > 0 && 
                    <div id="cp-popover-credit">
                        <a href={`https://humanum.arts.cuhk.edu.hk/Lexis/lexi-mf/search.php?word=${word}`} target="_blank">查看更多</a>
                    </div>
                }
            </div>
            {isPopover && <div id="cp-popover-arrow" className={classNames({"upside-down": isUpsideDown})}></div>}
            {isPopover && <div id="cp-popover-arrow-outer" className={classNames({"upside-down": isUpsideDown})}></div>}
        </div>
    );
};

export default PronunciationCard;