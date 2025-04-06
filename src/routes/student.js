import React from "react";
import { Route, Routes } from "react-router-dom";

import NotFoundPage from "../pages/notFound";

import { MessagePage } from "../pages/student/communication/message";
import { PostPage } from "../pages/student/blog/post";

const StudentRoutes = () => {

    return (
        <Routes>
            <Route path="message" element={<MessagePage />} />
            <Route path="post" element={<PostPage />} />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};

export default StudentRoutes;

