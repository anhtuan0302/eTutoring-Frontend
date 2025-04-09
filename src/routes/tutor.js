import React from "react";
import { Route, Routes } from "react-router-dom";

import NotFoundPage from "../pages/notFound";

import { MessagePage } from "../pages/tutor/communication/message";
import { PostPage } from "../pages/tutor/blog/post";
import { TutorProfilePage } from "../pages/tutor/auth/profile";
import { ListClassesPage, DetailClassPage } from "../pages/tutor/education/classInfo";
import { ClassSchedulePage } from "../pages/tutor/education/classSchedule";
import { SubmissionDetailPage } from "../pages/tutor/education/submission";

const TutorRoutes = () => {

    return (
        <Routes>
            <Route path="profile" element={<TutorProfilePage />} />
            <Route path="message" element={<MessagePage />} />
            <Route path="post" element={<PostPage />} />

            <Route path="classInfo" element={<ListClassesPage />} />
            <Route path="classInfo/:id" element={<DetailClassPage />} />

            <Route path="classSchedule" element={<ClassSchedulePage />} />

            <Route path="submission/:id" element={<SubmissionDetailPage />} />
            
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};

export default TutorRoutes;

