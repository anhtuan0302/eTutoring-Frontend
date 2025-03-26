import React from "react";
import { Route, Routes } from "react-router-dom";
import ListStudent from "../pages/student/Course/list";
import { Calendar } from "antd";

const StudentRoutes = () => {
    return (
        <Routes>
            <Route path="/student" element={<Calendar />} />
            <Route path="/student/list" element={<ListStudent />} />
        </Routes>
    );
};

export default StudentRoutes;