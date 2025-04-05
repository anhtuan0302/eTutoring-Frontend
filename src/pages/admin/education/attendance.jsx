import React from "react";
import AdminLayout from "../../../components/layouts/admin/layout";
import ListAttendance from "../../../components/common/education/attendance/list";

export const ListAttendancePage = () => {
  return (
    <AdminLayout title="List Attendance">
      <ListAttendance />
    </AdminLayout>
  );
};