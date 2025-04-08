import React from "react";
import AppLayout from "../../../components/layouts/layout";
import ListClassSchedules from "../../../components/common/education/classSchedule/list";

export const ClassSchedulePage = () => {
  return (
    <AppLayout title="Class Schedule">
      <ListClassSchedules />
    </AppLayout>
  );
};