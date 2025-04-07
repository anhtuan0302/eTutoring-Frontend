import React from "react";
import TutorLayout from "../../../components/layouts/tutor/layout";
import ListClassSchedules from "../../../components/common/education/classSchedule/list";

export const ClassSchedulePage = () => {
  return (
    <TutorLayout title="Class Schedule">
      <ListClassSchedules />
    </TutorLayout>
  );
};