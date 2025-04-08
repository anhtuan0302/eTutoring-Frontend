import React from "react";
import AppLayout from "../../../components/layouts/layout";
import ListPendingUsers from "../../../components/common/auth/pendingUser/list";
import CreatePendingUser from "../../../components/common/auth/pendingUser/create";
import DetailPendingUser from "../../../components/common/auth/pendingUser/detail";

export const ListPendingUsersPage = () => {
  return (
    <AppLayout title="Pending Users List">
      <ListPendingUsers />
    </AppLayout>
  );
};

export const CreatePendingUserPage = () => {
  return (
    <AppLayout title="Create Pending User">
      <CreatePendingUser />
    </AppLayout>
  );
};

export const DetailPendingUserPage = () => {
  return (
    <AppLayout title="Detail Pending User">
      <DetailPendingUser />
    </AppLayout>
  );
};

