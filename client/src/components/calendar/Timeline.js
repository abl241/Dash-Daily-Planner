import s from "./Timeline.module.css";
import React, { useState, useEffect, useRef } from "react";
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
    const timelineRef = useRef(null);
    const [timelineWidth, setTimelineWidth] = useState(0);
    const labelOffset = 60; // same as .eventBlock left
    const rightOffset = 10; // same as .eventBlock right
    const availableWidth = Math.max(0, timelineWidth - labelOffset + rightOffset);
    useEffect(() => {
        if (timelineRef.current) {
            setTimelineWidth(timelineRef.current.offsetWidth);
        }

        // Optional: handle window resize
        const handleResize = () => {
            if (timelineRef.current) {
                setTimelineWidth(timelineRef.current.offsetWidth);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);
    function layoutEvents(events, columnWidth, minWidth = 80) {
        const groups = groupOverlappingEvents(events);

        return groups.flatMap(group => {
            const groupSize = group.length;
            const width = Math.max(minWidth, columnWidth / groupSize);

            return group.map((event, index) => ({
                ...event,
                layout: {
                    width,
                    left: index * width // 50px is from .hourLine left: 50px
                }
            }));
        });
    }
    const laidOutEvents = layoutEvents(timedEvents, availableWidth);

    const renderedEvents = laidOutEvents.map(event => {
        const start = parseISO(event.start_time);
        const end = parseISO(event.end_time);

        const startMinutes = getHours(start) * 60 + getMinutes(start);
        const durationMinutes = differenceInMinutes(end, start);

        const top = startMinutes + 24 - 8 - 16; // add all-day section height (24px); subtract Timeline.allDaySection's (8px) padding; subtract .hourRow:first-child margin-top (16px)
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

            <div className={s.timelineSection} ref={timelineRef}>
                <div className={s.gridAndEvents}>
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
        </div>

    );
}