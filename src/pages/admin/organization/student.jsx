import React from "react";
import AdminLayout from "../../../components/layouts/layout";
import ListStudents from "../../../components/common/organization/student/list";
import CreatePendingStudent from "../../../components/common/organization/student/create";

export const ListStudentsPage = () => {
  return (
    <AdminLayout title="Students List">
      <ListStudents />
    </AdminLayout>
  );
};

export const CreatePendingStudentPage = () => {
  return (
    <AdminLayout title="Create Pending Student">
      <CreatePendingStudent />
    </AdminLayout>
  );
};
