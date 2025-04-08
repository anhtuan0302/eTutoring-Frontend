import React from "react";
import AppLayout from "../../../components/layouts/layout";
import Profile from "../../../components/common/auth/profile";

export const StudentProfilePage = () => {
  return (
    <AppLayout title="Profile">
      <Profile />
    </AppLayout>
  );
};