import React from "react";
import AdminLayout from "../../../components/layouts/admin/layout";
import ListClassTutors from "../../../components/common/education/classTutor/list";
import CreateClassTutor from "../../../components/common/education/classTutor/create";

export const ListClassTutorsPage = () => {
  return (
    <AdminLayout title="List Class Tutors">
      <ListClassTutors />
    </AdminLayout>
  );
};

export const CreateClassTutorPage = () => {
  return (
    <AdminLayout title="Create Class Tutor">
      <CreateClassTutor />
    </AdminLayout>
  );
};
