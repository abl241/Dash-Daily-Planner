import s from "./Timeline.module.css";
import React, { useState, useEffect } from "react";
import { parseISO } from "date-fns";

import EventBlock from "./EventBlock";

export default function Timeline({ events }) {
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Helper: detect all-day events
    function isAllDay(event) {
        // RULE: event lasts 24h or explicitly all-day
        const start = parseISO(event.start_time);
        const end = parseISO(event.end_time);
        return end - start >= 24 * 60 * 60 * 1000;
    }

    return(
        <div className={s.dayView}>
            <div className={s.allDaySection}>
                <span className={s.allDayLabel}>All Day</span>
                <div className={s.allDayEvents}>
                    {events
                        .filter(e => isAllDay(e))
                        .map(e => (
                            <div key={e.id} className={s.allDayEvent}>
                                {e.name}
                            </div>
                        ))}
                </div>
            </div>

            <div className={s.timelineSection}>
                {hours.map((h) => (
                    <div key={h} className={s.hourRow}>
                        <span className={s.timeLabel}><p>{`${h % 12 === 0 ? 12 : h % 12}`}</p>{`${h < 12 ? "AM" : "PM"}`}</span>
                        <div className={s.hourLine}></div>
                    </div>
                ))}
                {/* event blocks */}
                <div className={s.eventsLayer}>
                    {events
                        .filter(e => !isAllDay(e))
                        .map(e => (
                            <EventBlock key={e.id} event={e} />
                        ))}
                </div>
            </div>
        </div>

    );
}