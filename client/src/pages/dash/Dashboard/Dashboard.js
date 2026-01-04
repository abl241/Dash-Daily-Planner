import s from "./Dashboard.module.css";
import DashboardLayout from '../../../components/DashboardLayout';
import { useState, useEffect } from "react";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import api from '../../../api/axios';

import UpcomingWeek from "../../../components/calendar/UpcomingWeek";
import NewItemModal from "../../../components/NewItemModal";
import Button from "../../../components/Button";
import { set } from "date-fns";

export default function Dashboard() {
    const [ refreshKey, setRefreshKey ] = useState(0);
    const [ isModalOpen, setIsModalOpen ] = useState(false);
    const [ modalMode, setModalMode ] = useState("create"); // "create" | "edit"
    const [ selectedItem, setSelectedItem ] = useState(null);

    function handleCreate(type) {
        setIsModalOpen(false); // ✅ Close first
        setTimeout(() => {
            setSelectedItem(null);
            setModalMode("create");
            setIsModalOpen(true);
        }, 50); // Small delay to ensure close completes
    }

    function handleEdit(item) {
        setIsModalOpen(false); // ✅ Close first
        setTimeout(() => {
            setSelectedItem(item);
            setModalMode("edit");
            setIsModalOpen(true);
        }, 50); // Small delay to ensure close completes
    }
    
    // layout stuff
    const [layout, setLayout] = useState([
        { i: "pomodoro", x: 0, y: 0, w: 3, h: 2 }, // temporary
        { i: "goal", x: 3, y: 0, w: 3, h: 2 },
    ]);

    const handleLayoutChange = (newLayout) => {
        setLayout(newLayout);
        localStorage.setItem("dashboardLayout", JSON.stringify(newLayout));
    };

    // update refreshKey every min
    useEffect(() => {
        const interval = setInterval(() => {
            setRefreshKey(prev => prev +1);
        }, 60 * 1000);
    }, []);

    // modal stuff
    const handleSubmit = async (data, type) => { // add handler for reminders (add to separate reminders table)
        if(modalMode === "edit") {
            try {
                if(type === "task") {
                    const updatedTask = await api.put(`/tasks/${data.id}`, data);
                    console.log("Task edited:", updatedTask.data);
                } else if(type === "event") {
                    const updatedEvent = await api.put(`/events/${data.id}`, data);
                    console.log("Event edited:", updatedEvent.data);
                }
            } catch (err) {
                console.error("Error editing item:", err);
            }
        } else {
            try {
                if(type === "task") {
                    const newTask = await api.post("/tasks", data);
                    console.log("New task added:", newTask.data);
                } else if(type === "event") {
                    const newEvent = await api.post("/events", data);
                    console.log("New event added:", newEvent.data);
                }
            } catch (err) {
                console.error("Error adding new item:", err);
            }
        }
        setRefreshKey(prev => prev + 1);
        setIsModalOpen(false);
    };


    return (
        <div className={s.dashboardContainer}>
            <section className={s.mainSection}>
                <div className={s.upcomingWeekSection}>
                    {/* insert overview components here */}
                    <UpcomingWeek refreshKey={refreshKey} onEditItem={handleEdit}/>
                    <Button variant="primary" onClick={() => handleCreate()}>Add New</Button>
                    <NewItemModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleSubmit}
                    mode={modalMode}
                    initialData={selectedItem}
                    />
                </div>

                <div className={s.addButtonSection}> {/* or just put button here */}

                </div>
            </section>

            {/* <section className={s.widgetsSection}>
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
            </section> */}
        </div>
    );
}
