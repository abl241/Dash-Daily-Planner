import s from "./EventBlock.module.css";

export default function EventBlock({ event, onSelectEvent, top, height, left, width }) {
    return (
        <div
        className={s.eventBlock}
        onClick={() => onSelectEvent(event)}
        style={{
            top: `${top}px`,
            height: `${height}px`,
            left: `${left}px`,
            width: `${width}px`,
            background: event.is_occurrence ? event.original.category_color : event.category_color
        }}
        >
            {event.is_occurrence ? event.original.name : event.name}
        </div>
    );
}