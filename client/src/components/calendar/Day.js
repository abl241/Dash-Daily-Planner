import s from "./Day.module.css"
import React, { useState } from "react";

export default function Day({date, data, variant="upcomingWeek"}) {
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

    switch (variant) {
        case "upcomingWeek":
            return (
                <div className={s.uwCard}>
                    <h1>day of week</h1>
                    <h2>date</h2>
                    <div className={s.uwTasks}>

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