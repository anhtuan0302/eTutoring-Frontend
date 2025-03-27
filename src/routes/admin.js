import React from "react";
import { Route, Routes } from "react-router-dom";

import Dashboard from "../pages/admin/dashboard";
import NotFound from "../pages/notFound";

import { ListDepartmentsPage, CreateDepartmentPage, UpdateDepartmentPage, DetailDepartmentPage } from "../pages/admin/organization/department";

const AdminRoutes = () => {

    return (
        <Routes>
            <Route path="" element={<Dashboard />} />
            <Route path="department" element={<ListDepartmentsPage />} />
            <Route path="department/create" element={<CreateDepartmentPage />} />
            <Route path="department/:id" element={<DetailDepartmentPage />} />
            <Route path="department/:id/edit" element={<UpdateDepartmentPage />} />

            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default AdminRoutes;

