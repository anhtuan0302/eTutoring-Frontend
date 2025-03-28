import React from "react";
import { Route, Routes } from "react-router-dom";

import Dashboard from "../pages/admin/dashboard";
import NotFound from "../pages/notFound";

import { ListPendingUsersPage, CreatePendingUserPage } from "../pages/admin/auth/pendingUser";

import { ListDepartmentsPage, CreateDepartmentPage, UpdateDepartmentPage, DetailDepartmentPage } from "../pages/admin/organization/department";
import { ListStaffsPage } from "../pages/admin/organization/staff";
const AdminRoutes = () => {

    return (
        <Routes>
            <Route path="" element={<Dashboard />} />
            <Route path="department" element={<ListDepartmentsPage />} />
            <Route path="department/create" element={<CreateDepartmentPage />} />
            <Route path="department/:id" element={<DetailDepartmentPage />} />
            <Route path="department/:id/edit" element={<UpdateDepartmentPage />} />

            <Route path="staff" element={<ListStaffsPage />} />

            <Route path="pendingUser" element={<ListPendingUsersPage />} />
            <Route path="pendingUser/create" element={<CreatePendingUserPage />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default AdminRoutes;

