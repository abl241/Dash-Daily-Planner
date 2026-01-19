import s from "./UpcomingWeek.module.css";
import React, { useState, useEffect } from "react";
import { FaPen } from "react-icons/fa";
import { addDays, startOfToday, isSameDay, format } from "date-fns";
import api from "./../../api/axios";

import Day from "./Day";
import Timeline from "./Timeline";


export default function UpcomingWeek({ refreshKey, onEditItem }) {
    const [ weekData, setWeekData ] = useState([]);
    const [ focusedDate, setFocusedDate ] = useState(startOfToday());
    const [ focusedOption, setFocusedOption ] = useState("schedule");
    const [ selectedEvent, setSelectedEvent ] = useState(null);

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
                const normalizedEvents = events.map(e => ({
                    ...e,
                    original: e.original ?? e
                }));

                const grouped = groupByDate(tasks, normalizedEvents, start, end);
                console.log("Grouped week data: ", grouped);
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

    // handle selecting event
    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
    }

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
                <div className={s.overviewOptionsContainer}>
                    <button className={`${s.focusOption} ${focusedOption === "schedule" ? s.active : ""}`} onClick={() => setFocusedOption("schedule")}>Schedule</button>
                    <button className={`${s.focusOption} ${focusedOption === "tasks" ? s.active : ""}`} onClick={() => setFocusedOption("tasks")}>Tasks</button>
                    <button className={`${s.focusOption} ${focusedOption === "stats" ? s.active : ""}`} onClick={() => setFocusedOption("stats")}>Stats</button>
                </div>
                {focusedOption === "schedule" && (
                    <div className={s.scheduleContent}>
                        <div className={s.timelineWrapper}>
                            <Timeline events={focusedData.events} onSelectEvent={handleSelectEvent}/>
                        </div>
                        <div className={s.eventDetailsContainer}>
                            {selectedEvent && isSameDay(selectedEvent?.start_time, focusedDate) ? (
                                <>
                                    <div className={s.eventDetailsContent}>
                                        <div className={s.eventHeader}>
                                            <h1>{selectedEvent.name}</h1>

                                            <div style={selectedEvent.original?.category_color ? {background: selectedEvent.original.category_color} : {}} className={s.categoryLabel}>
                                                <p>{selectedEvent.original.category}</p>
                                            </div>

                                            <button className={s.editEventButton} onClick={() =>{ onEditItem(selectedEvent.original) }}>
                                                <FaPen />
                                            </button>
                                        </div>
                                        <div className={s.infoContainer}>
                                            <div className={s.info}>
                                                <p>Location:</p>
                                                <h2>{`${selectedEvent.original.location ? selectedEvent.original.location : "No location"}`}</h2>
                                                <div className={s.timesContainer}>
                                                    <div className={s.time}>
                                                        <p>From:</p>
                                                        <h2>{format(selectedEvent.start, "h:mm a")}</h2>
                                                    </div>
                                                    <div className={s.time}>
                                                        <p>To:</p>
                                                        <h2>{format(selectedEvent.end, "h:mm a")}</h2>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={s.notesContainer}>
                                                <p>Notes:</p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <p>No selected event.</p>
                            )}
                        </div>
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
