import s from "./Timeline.module.css";
import React, { useState, useEffect } from "react";
import { addDays, startOfToday, isSameDay, format } from "date-fns";
import api from "./../../api/axios";

export default function Timeline({}) {

    return(
        <div className="timeline-section">
            {hours.map((h) => (
                <div key={h} className="hour-row">
                <span className="time-label">{h}:00</span>
                <div className="hour-line"></div>
                </div>
            ))}
        </div>

    );
}