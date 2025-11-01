import s from "./DropdownChecklist.module.css";
import { useState, useRef, useEffect } from "react";

export default function DropdownChecklist({ options, selectedOptions, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState(selectedOptions || []);
    const dropdownRef = useRef(null);
    
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };

        if(isOpen) {
            document.addEventListener("click", handleClickOutside);
        } 
        
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, [isOpen]);

    useEffect(() => {
        setSelected(selectedOptions || []);
    }, [selectedOptions]);

    const toggleOption = (option) => {
        setSelected(prev => {
            const newSelected = prev.includes(option)
            ? prev.filter(item => item !== option)
            : [...prev, option];
        
            onChange?.(newSelected);
            return newSelected;
        });
    };

    const getDisplayText = () => {
        if(selected.length === 0) return "Select options";

        const orderedSelected = [...selected].sort((a, b) => options.indexOf(a) - options.indexOf(b));
        if(orderedSelected.length === 1) return orderedSelected[0];
        if(orderedSelected.length <= 3) return orderedSelected.join(", ");
        return `${orderedSelected.length} options selected`;
    };

    return (
        <div ref={dropdownRef} className={s.dropdownChecklist}>
            <button onClick={() => setIsOpen(!isOpen)} className={s.button} type="button">
                <span>{getDisplayText()}</span>
                <span className={`${s.arrow} ${isOpen ? s.open : ""}`}>▼</span>
            </button>
            {isOpen && (
                <div className={s.optionsContainer}>
                    {options.map((option) => (
                        <label key={option} className={s.option}>
                            <input type="checkbox" className={s.checkbox} checked={selected.includes(option)} onChange={() => toggleOption(option)}/>
                            {option}
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}