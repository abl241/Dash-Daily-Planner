import s from "./Timeline.module.css";
import React, { useState, useEffect } from "react";
import { parseISO, differenceInMinutes, getHours, getMinutes } from "date-fns";

import EventBlock from "./EventBlock";
import { Loader } from "three/src/Three.Core.js";

export default function Timeline({ events }) {
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Helper: detect all-day events
    function isAllDay(event) {
        // RULE: event lasts 24h or explicitly all-day
        const start = parseISO(event.start_time);
        const end = parseISO(event.end_time);
        return end - start >= 24 * 60 * 60 * 1000;
    }
    const allDayEvents = events.filter(event => isAllDay(event));
    const timedEvents = events.filter(event => !isAllDay(event)).map(
        e => ({
            ...e,
            start: parseISO(e.start_time),
            end: parseISO(e.end_time)
        })
    );

    // handles overlapping events
    function eventsOverlap(a, b) {
        return a.start < b.end && b.start < a.end;
    }
    function groupOverlappingEvents(events) {
        const groups = [];

        events.forEach(event => {
            let placed = false;

            for (const group of groups) {
                if (group.some(e => eventsOverlap(e, event))) {
                    group.push(event);
                    placed = true;
                    break;
                }
            }

            if (!placed) groups.push([event]);
        });

        return groups;
    }
    function layoutEvents(events, columnWidth = 300, minWidth = 80) {
        const groups = groupOverlappingEvents(events);

        return groups.flatMap(group => {
            const groupSize = group.length;
            const width = Math.max(minWidth, columnWidth / groupSize);

            return group.map((event, index) => ({
                ...event,
                layout: {
                    width,
                    left: 50 + index * width // 50px is from .hourLine left: 50px
                }
            }));
        });
    }
    const laidOutEvents = layoutEvents(timedEvents);

    const renderedEvents = laidOutEvents.map(event => {
        const start = parseISO(event.start_time);
        const end = parseISO(event.end_time);

        const startMinutes = getHours(start) * 60 + getMinutes(start);
        const durationMinutes = differenceInMinutes(end, start);

        const top = startMinutes * 1 + 24 - 8; // add all-day section height; subtract Timeline.allDaySection's (8px) padding
        const height = durationMinutes * 1;

        return (
            <EventBlock
                key={event.master_id + event.start_time}
                event={event}
                top={top}
                height={height}
                left={event.layout.left}
                width={event.layout.width}
            />
        );
    });

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
                    {renderedEvents}
                </div>
            </div>
        </div>

    );
}