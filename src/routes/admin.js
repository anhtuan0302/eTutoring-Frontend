import React from "react";
import { Route, Routes } from "react-router-dom";
import Dashboard from "../pages/admin/dashboard";
import NotFoundPage from "../pages/notFound";

import { ListPendingUsersPage, CreatePendingUserPage, DetailPendingUserPage } from "../pages/admin/auth/pendingUser";

import { ListDepartmentsPage, CreateDepartmentPage, UpdateDepartmentPage, DetailDepartmentPage } from "../pages/admin/organization/department";

import { ListStaffsPage } from "../pages/admin/organization/staff";
import { ListStudentsPage, CreatePendingStudentPage } from "../pages/admin/organization/student";
import { ListTutorsPage } from "../pages/admin/organization/tutor";

import { ListCoursesPage, CreateCoursePage, UpdateCoursePage, CourseDetailPage } from "../pages/admin/education/course";
import { ListClassesPage, CreateClassPage, DetailClassPage, UpdateClassPage } from "../pages/admin/education/classInfo";
import { ListClassSchedulesPage } from "../pages/admin/education/classSchedule";
import { ListAttendancePage } from "../pages/admin/education/attendance";
import { ListEnrollmentsPage, CreateEnrollmentPage, DetailEnrollmentPage, UpdateEnrollmentPage } from "../pages/admin/education/enrollment";
import { ListClassTutorsPage, CreateClassTutorPage } from "../pages/admin/education/classTutor";
import { SubmissionDetailPage } from "../pages/admin/education/submission";

import { PostPage } from "../pages/admin/blog/post";
import { MessagePage } from "../pages/admin/communication/message";
import { AdminProfilePage } from "../pages/admin/auth/profile";

const AdminRoutes = () => {

    return (
        <Routes>
            <Route path="" element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
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
            <Route path="pendingUser/:id" element={<DetailPendingUserPage />} />

            <Route path="course" element={<ListCoursesPage />} />
            <Route path="course/create" element={<CreateCoursePage />} />
            <Route path="course/:id" element={<CourseDetailPage />} />
            <Route path="course/:id/edit" element={<UpdateCoursePage />} />

            <Route path="classInfo" element={<ListClassesPage />} />
            <Route path="classInfo/create" element={<CreateClassPage />} />
            <Route path="classInfo/:id" element={<DetailClassPage />} />
            <Route path="classInfo/:id/edit" element={<UpdateClassPage />} />

            <Route path="classSchedule" element={<ListClassSchedulesPage />} />

            <Route path="attendance/schedule/:id" element={<ListAttendancePage />} />

            <Route path="classTutor" element={<ListClassTutorsPage />} />
            <Route path="classTutor/create" element={<CreateClassTutorPage />} />
            
            <Route path="enrollment" element={<ListEnrollmentsPage />} />
            <Route path="enrollment/create" element={<CreateEnrollmentPage />} />
            <Route path="enrollment/:id" element={<DetailEnrollmentPage />} />
            <Route path="enrollment/:id/edit" element={<UpdateEnrollmentPage />} />

            <Route path="submission/:id" element={<SubmissionDetailPage />} />

            <Route path="message" element={<MessagePage />} />
            <Route path="post" element={<PostPage />} />
            <Route path="profile" element={<AdminProfilePage />} />

            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};

export default AdminRoutes;

