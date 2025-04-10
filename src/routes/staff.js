import React from "react";
import { Route, Routes } from "react-router-dom";

import NotFoundPage from "../pages/notFound";

import StaffDashboard from "../pages/staff/dashboard";

import { MessagePage } from "../pages/staff/communication/message";
import { PostPage } from "../pages/staff/blog/post";

const StaffRoutes = () => {

    return (
        <Routes>
            <Route path="" element={<StaffDashboard />} />
            <Route path="dashboard" element={<StaffDashboard />} />
            
            <Route path="message" element={<MessagePage />} />
            <Route path="post" element={<PostPage />} />
            
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};

export default StaffRoutes;

