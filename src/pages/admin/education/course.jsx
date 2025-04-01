import React from "react";
import AdminLayout from "../../../components/layouts/admin/layout";
import ListCourses from "../../../components/common/education/course/list";

export const ListCoursesPage = () => {
  return (
    <AdminLayout title="Courses List">
      <ListCourses />
    </AdminLayout>
  );
};
