import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import ProtectedRoute from "./components/ProtectRoute";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/dash/Dashboard/Dashboard";
import Calendar from "./pages/dash/Calendar/Calendar";
import Widgets from "./pages/dash/Widgets/Widgets";

function App() {
    return (
        <Router>
            <Routes>
                {/* auth routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* dashboard routes */}
                <Route path="/dash/dashboard" element={
                    <ProtectedRoute>
                        <DashboardLayout>
                            <Dashboard />
                        </DashboardLayout>
                    </ProtectedRoute>}
                />
                <Route path="/dash/calendar" element={
                    <ProtectedRoute>
                        <DashboardLayout>
                            <Calendar />
                        </DashboardLayout>
                    </ProtectedRoute>}
                />
                <Route path="/dash/widgets" element={
                    <ProtectedRoute>
                        <DashboardLayout>
                            <Widgets />
                        </DashboardLayout>
                    </ProtectedRoute>}
                />

                {/* redirect to login by default */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
