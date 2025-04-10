import React from "react";
import { Route, Routes } from "react-router-dom";

import NotFoundPage from "../pages/notFound";

import StudentDashboard from "../pages/student/dashboard";

import { MessagePage } from "../pages/student/communication/message";
import { PostPage } from "../pages/student/blog/post";
import { StudentProfilePage } from "../pages/student/auth/profile";

import { ListClassesPage, DetailClassPage } from "../pages/student/education/classInfo";
import { ClassSchedulePage } from "../pages/student/education/classSchedule";

const StudentRoutes = () => {

    return (
        <Routes>
            <Route path="" element={<StudentDashboard />} />
            <Route path="dashboard" element={<StudentDashboard />} />

            <Route path="message" element={<MessagePage />} />
            <Route path="post" element={<PostPage />} />
            <Route path="profile" element={<StudentProfilePage />} />

            <Route path="classInfo" element={<ListClassesPage />} />
            <Route path="classInfo/:id" element={<DetailClassPage />} />

            <Route path="classSchedule" element={<ClassSchedulePage />} />

            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};

export default StudentRoutes;

