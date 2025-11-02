import s from "./Button.module.css";
import React, { useState } from "react";

export default function Button({ 
    children,
    onClick,
    type = "button",
    variant = "primary", // "primary", "secondary", "toggle"
    toggled = false,
    selfToggle = false,
    disabled = false,
    className = "",
 }) {
    const [internalToggled, setInternalToggled] = useState(false);

    // Use parent's toggled state if provided, otherwise use internal state
    const isToggled = selfToggle ? internalToggled : toggled;

    const handleClick = (e) => {
        if (selfToggle) {
            setInternalToggled((prev) => !prev);
        }
        if (onClick) onClick(e);
    };

    const toggleClass = isToggled ? s.toggledOn : s.toggledOff;

    return (
        <button
            type={type}
            className={`${s.btn} ${s[variant]} ${variant === "toggle" ? `${s.toggle} ${toggleClass}` : ""} ${className}`}
            onClick={handleClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
};