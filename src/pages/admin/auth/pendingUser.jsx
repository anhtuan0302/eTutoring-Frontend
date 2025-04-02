import React from "react";
import AdminLayout from "../../../components/layouts/admin/layout";
import ListPendingUsers from "../../../components/common/auth/pendingUser/list";
import CreatePendingUser from "../../../components/common/auth/pendingUser/create";
import DetailPendingUser from "../../../components/common/auth/pendingUser/detail";

export const ListPendingUsersPage = () => {
  return (
    <AdminLayout title="Pending Users List">
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

export const DetailPendingUserPage = () => {
  return (
    <AdminLayout title="Detail Pending User">
      <DetailPendingUser />
    </AdminLayout>
  );
};

