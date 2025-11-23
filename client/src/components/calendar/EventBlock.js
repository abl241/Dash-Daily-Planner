import s from "./EventBlock.module.css";

export default function EventBlock({ event, top, height, left, width }) {
    return (
        <div
        className={s.eventBlock}
        style={{
            top: `${top}px`,
            height: `${height}px`,
            left: `${left}px`,
            width: `${width}px`,
        }}
        >
            {event.name}
        </div>
    );
}