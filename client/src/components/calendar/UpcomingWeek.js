import s from "./UpcomingWeek.module.css";
import React, { useState, useEffect } from "react";
import { addDays, startOfToday, isSameDay, format } from "date-fns";
import api from "./../../api/axios";

import Day from "./Day";
import Timeline from "./Timeline";
import Button from "../Button";

export default function UpcomingWeek({ refreshKey }) {
    const [ weekData, setWeekData ] = useState([]);
    const [ focusedDate, setFocusedDate ] = useState(startOfToday());
    const [ focusedOption, setFocusedOption ] = useState("schedule");


    // get week data
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

    // handling day focus
    const handleFocus = (day) => setFocusedDate(day);
    const focusedKey = format(focusedDate, "yyyy-MM-dd");
    const focusedData = weekData[focusedKey] || { tasks: [], events: [] };

    // day overview section
    

    return (
        <div>
            <Button onClick={() => console.log(weekData)}/>
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
                <div className={s.overviewOptionsContainer}>
                    <button className={`${s.focusOption} ${focusedOption === "schedule" ? s.active : ""}`} onClick={() => setFocusedOption("schedule")}>Schedule</button>
                    <button className={`${s.focusOption} ${focusedOption === "tasks" ? s.active : ""}`} onClick={() => setFocusedOption("tasks")}>Tasks</button>
                    <button className={`${s.focusOption} ${focusedOption === "stats" ? s.active : ""}`} onClick={() => setFocusedOption("stats")}>Stats</button>
                </div>
                {focusedOption === "schedule" && (
                    <div className={s.scheduleContents}>
                        <Timeline/>
                    </div>
                )}
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
        const raw = task.is_occurrence ? task.occurrence_date : task.due_date;
        const parsed = safeParse(raw);
        if (!parsed) return; // skip invalid

        const dateKey = format(parsed, "yyyy-MM-dd");
        if (map[dateKey]) map[dateKey].tasks.push(task);
    });

    // ---- EVENTS ----
    events.forEach((event) => {
        const parsed = safeParse(event.start_time);
        if (!parsed) return;

        const dateKey = format(parsed, "yyyy-MM-dd");
        if (map[dateKey]) map[dateKey].events.push(event);
    });


    return map;
}

function safeParse(dateString) {
    const d = new Date(dateString);
    return isNaN(d) ? null : d;
}
