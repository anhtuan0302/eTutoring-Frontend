import React from "react";
import AdminLayout from "../../../components/layouts/admin/layout";
import ListClassSchedules from "../../../components/common/education/classSchedule/list";

export const ListClassSchedulesPage = () => {
  return (
    <AdminLayout title="List Class Schedules">
      <ListClassSchedules />
    </AdminLayout>
  );
};