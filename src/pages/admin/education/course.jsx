import React from "react";
import AdminLayout from "../../../components/layouts/admin/layout";
import ListCourses from "../../../components/common/education/course/list";
import CreateCourse from "../../../components/common/education/course/create";
import UpdateCourse from "../../../components/common/education/course/update";
import CourseDetail from "../../../components/common/education/course/detail";

export const ListCoursesPage = () => {
  return (
    <AdminLayout title="Courses List">
      <ListCourses />
    </AdminLayout>
  );
};

export const CreateCoursePage = () => {
  return (
    <AdminLayout title="Create Course">
      <CreateCourse />
    </AdminLayout>
  );
};

export const UpdateCoursePage = () => {
  return (
    <AdminLayout title="Update Course">
      <UpdateCourse />
    </AdminLayout>
  );
};

export const CourseDetailPage = () => {
  return (
    <AdminLayout title="Course Detail">
      <CourseDetail />
    </AdminLayout>
  );
};
