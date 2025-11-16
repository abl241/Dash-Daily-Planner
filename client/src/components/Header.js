import React, { useEffect, useState } from "react";
import { FaBars, FaUserCircle } from "react-icons/fa";
import { NavLink } from "react-router-dom";
import s from "./Header.module.css";

export default function Header() {
    const [date, setDate] = useState("");
    const [greeting, setGreeting] = useState("");
    const user = JSON.parse(localStorage.getItem("user"));
    const first_name = user?.first_name || "User";
    const [ currentTime, setCurrentTime ] = useState(new Date());

    useEffect(() => {
        const today = new Date();

        // Greeting logic
        const hour = currentTime.getHours();
        if (hour < 12) setGreeting("Good morning");
        else if (hour < 18) setGreeting("Good afternoon");
        else setGreeting("Good evening");

        // Date formatting
        const formatted = currentTime.toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
        });
        setDate(formatted);
    }, []);

    // Update every min
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60 * 1000);

        return () => clearInterval(interval);
    }, []);

  return (
      <header className={s.header}>
            {/* LEFT SIDE */}
            <div className={s.left}>
                <button className={s.optionsBtn}>
                    <FaBars />
                </button>
                <img src="/logo.svg" alt="App Logo" className={s.logo}/>
            </div>
            <nav className={s.navTabs}>
                <NavLink
                    to="/dash/dashboard"
                    className={({ isActive }) =>
                        isActive ? `${s.tab} ${s.active}` : s.tab
                    }
                >Dashboard</NavLink>
                <NavLink
                    to="/dash/calendar"
                    className={({ isActive }) =>
                        isActive ? `${s.tab} ${s.active}` : s.tab
                    }
                >Calendar</NavLink>
                <NavLink
                    to="/dash/widgets"
                    className={({ isActive }) =>
                        isActive ? `${s.tab} ${s.active}` : s.tab
                    }
                >Widgets</NavLink>
            </nav>

            {/* RIGHT SIDE */}
            <div className={s.right}>
                <div className={s.greeting}>
                    <div className={s.greetingText}>
                        {greeting}, <p className={s.username}>{first_name}!</p>
                    </div>
                    <div className={s.date}>{date}</div>
                </div>

                <div className={s.profile}>
                    <FaUserCircle />
                </div>
            </div>
        </header>
    );
}
