import React from "react";
import AdminLayout from "../../../components/layouts/admin/layout";
import ListStaffs from "../../../components/common/organization/staff/list";

export const ListStaffsPage = () => {
  return (
    <AdminLayout title="Staffs List">
      <ListStaffs />
    </AdminLayout>
  );
};
