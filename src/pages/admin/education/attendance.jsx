import React from "react";
import AppLayout from "../../../components/layouts/layout";
import ListAttendance from "../../../components/common/education/attendance/list";

export const ListAttendancePage = () => {
  return (
    <AppLayout title="List Attendance">
      <ListAttendance />
    </AppLayout>
  );
};