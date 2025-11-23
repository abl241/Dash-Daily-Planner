import s from "./EventBlock.module.css";

export default function EventBlock({ event, top, height, left, width }) {
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