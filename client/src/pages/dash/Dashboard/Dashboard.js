import s from "./Dashboard.module.css";
import DashboardLayout from '../../../components/DashboardLayout';
import { useState } from "react";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import NewItemModal from "../../../components/NewItemModal";
import Button from "../../../components/Button";

export default function Dashboard() {
    // layout stuff
    const [layout, setLayout] = useState([
        { i: "pomodoro", x: 0, y: 0, w: 3, h: 2 }, // temporary
        { i: "goal", x: 3, y: 0, w: 3, h: 2 },
    ]);
    const [ isModalOpen, setIsModalOpen ] = useState(false);

    const handleLayoutChange = (newLayout) => {
        setLayout(newLayout);
        localStorage.setItem("dashboardLayout", JSON.stringify(newLayout));
    };

    // modal stuff
    const handleAdd = async (data, type) => { // add handler for reminders (add to separate reminders table)
        try {
            if(type === "task") {
                const newTask = await fetch("http://localhost:4000/tasks", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: JSON.stringify(data),
                });
                const taskResult = await newTask.json();
                console.log("New task added:", taskResult);
            } else if(type === "event") {
                const newEvent = await fetch("http://localhost:4000/events", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: JSON.stringify(data),
                });
                const eventResult = await newEvent.json();
                console.log("New event added:", eventResult);
            }
        } catch (err) {
            console.error("Error adding new item:", err);
        }
    };


    return (
        <div className={s.dashboardContainer}>
            <section className={s.mainSection}>
                <div className={s.overviewSection}>
                    {/* insert overview components here */}
                    <Button variant="primary" onClick={() => setIsModalOpen(true)}>Add New</Button>
                    <NewItemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAdd}/>
                </div>

                <div className={s.addButtonSection}> {/* or just put button here */}

                </div>
            </section>

            <section className={s.widgetsSection}>
                <h2>Widgets</h2>
                <GridLayout
                    className="layout"
                    layout={layout}
                    cols={6}
                    rowHeight={120}
                    width={600}
                    onLayoutChange={handleLayoutChange}
                >

                </GridLayout>
            </section>
        </div>
    );
}
