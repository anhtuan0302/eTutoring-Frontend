import React from "react";
import AppLayout from "../../../components/layouts/layout";
import ListCourses from "../../../components/common/education/course/list";
import CreateCourse from "../../../components/common/education/course/create";
import UpdateCourse from "../../../components/common/education/course/update";
import CourseDetail from "../../../components/common/education/course/detail";

export const ListCoursesPage = () => {
  return (
    <AppLayout title="Courses List">
      <ListCourses />
    </AppLayout>
  );
};

export const CreateCoursePage = () => {
  return (
    <AppLayout title="Create Course">
      <CreateCourse />
    </AppLayout>
  );
};

export const UpdateCoursePage = () => {
  return (
    <AppLayout title="Update Course">
      <UpdateCourse />
    </AppLayout>
  );
};

export const CourseDetailPage = () => {
  return (
    <AppLayout title="Course Detail">
      <CourseDetail />
    </AppLayout>
  );
};
