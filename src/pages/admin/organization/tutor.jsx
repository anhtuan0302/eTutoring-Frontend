import React from "react";
import AdminLayout from "../../../components/layouts/layout";
import ListTutors from "../../../components/common/organization/tutor/list";

export const ListTutorsPage = () => {
  return (
    <AdminLayout title="Tutors List">
      <ListTutors />
    </AdminLayout>
  );
};
