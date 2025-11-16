import s from "./UpcomingWeek.module.css";
import React, { useState, useEffect } from "react";
import { addDays, startOfToday, isSameDay, format } from "date-fns";
import api from "./../../api/axios";

import Day from "./Day";

export default function UpcomingWeek({ refreshKey }) {
    const [weekData, setWeekData] = useState([]);
    const [focusedDate, setFocusedDate] = useState(startOfToday());

    const today = startOfToday();
    const days = [...Array(7)].map((_, i) => addDays(today, i));

    useEffect(() => {
        const fetchWeekData = async () => {
            try {
                const start = format(today, "yyyy-MM-dd");
                const end = format(addDays(today, 6), "yyyy-MM-dd");

                const res = await api.get("/api/inrange", {
                    params: { start, end }
                });

                const { tasks, events } = res.data;
                const grouped = groupByDate(tasks, events, start, end);
                setWeekData(grouped);
            } catch (err) {
                console.error("Error fetching week data: ", err.message);
            }
        };

        fetchWeekData();
    }, [ refreshKey ]);

    const handleFocus = (day) => setFocusedDate(day);

    const focusedKey = format(focusedDate, "yyyy-MM-dd");
    const focusedData = weekData[focusedKey] || { tasks: [], events: [] };

    return (
        <div>
            <div className={s.weekContainer}>
                {days.map((day) => {
                    const key = format(day, "yyyy-MM-dd");
                    return (
                        <Day
                        key={key}
                        date={day}
                        data={weekData[key] || { tasks: [], events: [] }}
                        isFocused={isSameDay(day, focusedDate)}
                        onClick={() => handleFocus(day)}
                        variant={"upcomingWeek"}
                        />
                    );
                })}
            </div>

            <div className={s.dayOverviewContainer}>

            </div>
        </div>
    );
}

// Helpers
function groupByDate(tasks, events, startString, endString) {
    const map = {};

    const start = new Date(startString);
    for (let i = 0; i < 7; i++) {
        const d = addDays(start, i);
        const key = format(d, "yyyy-MM-dd");
        map[key] = { date: key, tasks: [], events: [] };
    }

    // ---- TASKS ----
    tasks.forEach((task) => {
        const dateKey = format(
            new Date(task.is_occurrence ? task.occurrence_date : task.due_date),
            "yyyy-MM-dd"
        );
        if (map[dateKey]) {
            map[dateKey].tasks.push(task);
        }
    });

    // ---- EVENTS ----
    events.forEach((event) => {
        const dateKey = format(
            new Date(event.is_occurrence ? event.occurrence_date : event.start_time),
            "yyyy-MM-dd"
        );
        if (map[dateKey]) {
            map[dateKey].events.push(event);
        }
    });

    return map;
}
