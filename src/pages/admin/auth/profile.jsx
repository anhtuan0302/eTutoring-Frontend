import React from "react";
import AppLayout from "../../../components/layouts/layout";
import Profile from "../../../components/common/auth/profile";

export const AdminProfilePage = () => {
  return (
    <AppLayout title="Admin Profile">
      <Profile />
    </AppLayout>
  );
};
