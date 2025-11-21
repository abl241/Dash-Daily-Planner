import { parseISO, differenceInMinutes, getHours, getMinutes } from "date-fns";
import s from "./EventBlock.module.css";

export default function EventBlock({ event }) {
    if (!event?.start_time || !event?.end_time) return null;

    const start = parseISO(event.start_time);
    const end = parseISO(event.end_time);

    // Total minutes from 0:00
    const startMinutes = getHours(start) * 60 + getMinutes(start);
    const durationMinutes = differenceInMinutes(end, start);

    // Each hour = 60px, so 1min = 1px
    const pxPerMinute = 60 / 60; // 60px / 60min = 1
    const top = startMinutes * pxPerMinute + 24 - 8; // add all-day section height; subtract Timeline.allDaySection's (8px) padding
    const height = durationMinutes * pxPerMinute;

    return (
        <div
        className={s.eventBlock}
        style={{
            top: `${top}px`,
            height: `${height}px`,
            left: "60px", // adjust if you want padding or multiple columns
        }}
        >
        {event.name}
        </div>
    );
}