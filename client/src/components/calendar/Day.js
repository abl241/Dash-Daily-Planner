import s from "./Day.module.css"
import React, { useState, useRef, useEffect } from "react";
import { addDays, startOfToday, isSameDay, format } from "date-fns";

export default function Day({date, data, variant="upcomingWeek", isFocused, onClick}) {
    /*
        data {
            "events" : [
                {
                    id: 3,
                    name: "Team meeting",
                    start_time: "2025-11-13T09:00:00",
                    end_time: "2025-11-13T10:00:00",
                    category: "Work",
                    notes: "Discuss Q4 goals",
                    link: "https://zoom.us/...",
                    is_recurring: false,
                    repeat_rule: null,
                },
                ...
            ]
            "tasks" : [
                {
                    id: 9,
                    name: "Submit project report",
                    due_date: "2025-11-13T23:59:00",
                    category: "School",
                    notes: "Upload PDF to portal",
                    link: null,
                    is_completed: false,
                    is_recurring: false,
                    repeat_rule: null,
                },
                ...
            ]
        }
    */
    const events = data.events;
    const tasks = data.tasks;
    const [maxVisible, setMaxVisible] = useState(0);
    const cardRef = useRef(null);
    const itemRef = useRef(null);

    useEffect(() => {
        const handleResize = () => {
            if (!cardRef.current || !itemRef.current) return;
            const cardHeight = cardRef.current.clientHeight;
            const itemHeight = itemRef.current.clientHeight;
            setMaxVisible(Math.floor(cardHeight / itemHeight));
        };

        handleResize(); // initial calculation
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [tasks]);
    const visibleCount = maxVisible > 0 ? maxVisible : 1;


    switch (variant) {
        case "upcomingWeek":

            return (
                <div className={`${s.uwCard} ${isFocused ? s.focused : ""}`} onClick={onClick}>
                    <h1>{format(date, "EEE")}</h1>
                    <h2>{`${format(date, "MM/dd")} ${isSameDay(date, startOfToday()) ? "(Today)" : ""}`}</h2>
                    <div className={s.uwTasks} ref={cardRef}>
                        {tasks.length === 0 ? (
                            <p className={s.empty}>No tasks</p>
                            ) : (
                            tasks.slice(0, visibleCount).map((task, idx) => (
                                <div key={task.id} className={s.taskItem} ref={idx === 0 ? itemRef : null}>
                                    <div className={s.categoryDot}/> {/*Later make color of dot match with category or default to blue*/}
                                    <p className={s.taskName} title={task.name}>{task.name}</p>
                                </div>
                            ))
                        )}
                        {tasks.length > visibleCount && (
                            <div className={s.moreIndicator}>and {tasks.length-visibleCount} more</div>
                        )}
                    </div>
                </div>
            );
        default: // calendar option
            return (
                <>
                
                </>
            );
    }
};