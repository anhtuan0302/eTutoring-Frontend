import React from "react";
import AppLayout from "../../../components/layouts/layout";
import ListClassTutors from "../../../components/common/education/classTutor/list";
import CreateClassTutor from "../../../components/common/education/classTutor/create";

export const ListClassTutorsPage = () => {
  return (
    <AppLayout title="List Class Tutors">
      <ListClassTutors />
    </AppLayout>
  );
};

export const CreateClassTutorPage = () => {
  return (
    <AppLayout title="Create Class Tutor">
      <CreateClassTutor />
    </AppLayout>
  );
};
