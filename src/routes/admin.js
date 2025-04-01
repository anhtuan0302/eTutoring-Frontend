import React from "react";
import { Route, Routes } from "react-router-dom";

import Dashboard from "../pages/admin/dashboard";
import NotFoundPage from "../pages/notFound";

import { ListPendingUsersPage, CreatePendingUserPage } from "../pages/admin/auth/pendingUser";

import { ListDepartmentsPage, CreateDepartmentPage, UpdateDepartmentPage, DetailDepartmentPage } from "../pages/admin/organization/department";

import { ListStaffsPage } from "../pages/admin/organization/staff";
import { ListStudentsPage, CreatePendingStudentPage } from "../pages/admin/organization/student";
import { ListTutorsPage } from "../pages/admin/organization/tutor";

import { ListCoursesPage } from "../pages/admin/education/course";

import { MessagePage } from "../pages/admin/communication/message";

const AdminRoutes = () => {

    return (
        <Routes>
            <Route path="" element={<Dashboard />} />
            <Route path="department" element={<ListDepartmentsPage />} />
            <Route path="department/create" element={<CreateDepartmentPage />} />
            <Route path="department/:id" element={<DetailDepartmentPage />} />
            <Route path="department/:id/edit" element={<UpdateDepartmentPage />} />

            <Route path="staff" element={<ListStaffsPage />} />

            <Route path="student" element={<ListStudentsPage />} />
            <Route path="student/create" element={<CreatePendingStudentPage />} />
            
            <Route path="tutor" element={<ListTutorsPage />} />
            
            <Route path="pendingUser" element={<ListPendingUsersPage />} />
            <Route path="pendingUser/create" element={<CreatePendingUserPage />} />

            <Route path="course" element={<ListCoursesPage />} />

            <Route path="message" element={<MessagePage />} />

            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};

export default AdminRoutes;

