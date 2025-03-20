import React from "react";
import { Route, Routes } from "react-router-dom";

import Dashboard from "../pages/admin/dashboard";
import ListTutor from "../pages/admin/tutor/list";


//Department
import ListDepartment from "../pages/admin/education/department/list";
import CreateDepartment from "../pages/admin/education/department/create";
import UpdateDepartment from "../pages/admin/education/department/update";

const AdminRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tutor" element={<ListTutor />} />
            <Route path="/department" element={<ListDepartment />} />
            <Route path="/department/create" element={<CreateDepartment />} />
            <Route path="/department/:id" element={<UpdateDepartment />} />
        </Routes>
    );
};

export default AdminRoutes;