import s from "./UpcomingWeek.module.css";
import React, { useState } from "react";

import Day from "./Day";

export default function UpcomingWeek({}) {
    const [weekData, setWeekData] = useState([]);
    const [focusedDate, setFocusedDate] = useState(startOfToday());

    useEffect(() => {
        // const fetchWeekData = async () => {
        // try {
        //     const start = startOfToday();
        //     const end = addDays(start, 6);
        //     const { data } = await axios.get("/api/week", {
        //     params: { start, end },
        //     });
        //     setWeekData(data);
        // } catch (err) {
        //     console.error("Error fetching week data:", err);
        // }
        // };
        // fetchWeekData();
    }, []);

    const days = [...Array(7)].map((_, i) => addDays(startOfToday(), i));

    const handleFocus = (day) => setFocusedDate(day);

    const focusedData = weekData.find((d) => isSameDay(new Date(d.date), focusedDate));

    return (
        <div>
            <div className={s.weekContainer}>
                {days.map((day) => {
                    const data = weekData.find((d) => isSameDay(new Date(d.date), day));
                    return (
                        <Day
                        key={day.toISOString()}
                        date={day}
                        data={data}
                        isFocused={isSameDay(day, focusedDate)}
                        onClick={() => handleFocus(day)}
                        variant={variant}
                        />
                    );
                })}
            </div>

            <div className={s.dayOverviewContainer}>

            </div>
        </div>
    );
}