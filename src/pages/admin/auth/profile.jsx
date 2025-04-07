import React from "react";
import AdminLayout from "../../../components/layouts/admin/layout";
import Profile from "../../../components/common/auth/profile";

export const AdminProfilePage = () => {
  return (
    <AdminLayout title="Admin Profile">
      <Profile />
    </AdminLayout>
  );
};
