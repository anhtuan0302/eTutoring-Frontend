import React from "react";
import AdminLayout from "../../../components/layouts/admin/layout";
import ListPendingUsers from "../../../components/common/auth/pendingUser/list";
import CreatePendingUser from "../../../components/common/auth/pendingUser/create";

export const ListPendingUsersPage = () => {
  return (
    <AdminLayout title="Pending Users">
      <ListPendingUsers />
    </AdminLayout>
  );
};

export const CreatePendingUserPage = () => {
  return (
    <AdminLayout title="Create Pending User">
      <CreatePendingUser />
    </AdminLayout>
  );
};

