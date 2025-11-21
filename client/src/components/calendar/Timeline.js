import s from "./Timeline.module.css";
import React, { useState, useEffect } from "react";
import { addDays, startOfToday, isSameDay, format } from "date-fns";
import api from "./../../api/axios";

export default function Timeline({}) {
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return(
        <div className={s.dayView}>
            <div className={s.allDaySection}>
                <span className={s.allDayLabel}>All Day</span>
                {/* all-day events here */}
            </div>

            <div className={s.timelineSection}>
                {hours.map((h) => (
                    <div key={h} className={s.hourRow}>
                        <span className={s.timeLabel}><p>{`${h % 12 === 0 ? 12 : h % 12}`}</p>{`${h < 12 ? "AM" : "PM"}`}</span>
                        <div className={s.hourLine}></div>
                    </div>
                ))}
            </div>
        </div>

    );
}