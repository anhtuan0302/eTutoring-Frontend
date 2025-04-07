import React from "react";
import StudentLayout from "../../../components/layouts/student/layout";
import ListClassSchedules from "../../../components/common/education/classSchedule/list";

export const ClassSchedulePage = () => {
  return (
    <StudentLayout title="Class Schedule">
      <ListClassSchedules />
    </StudentLayout>
  );
};