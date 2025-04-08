import React from "react";
import AppLayout from "../../../components/layouts/layout";
import ListClassSchedules from "../../../components/common/education/classSchedule/list";

export const ListClassSchedulesPage = () => {
  return (
    <AppLayout title="List Class Schedules">
      <ListClassSchedules />
    </AppLayout>
  );
};