import React from "react";
import StudentLayout from "../../../components/layouts/student/layout";
import ListClasses from "../../../components/common/education/classInfo/list";
import DetailClass from "../../../components/common/education/classInfo/detail";

export const ListClassesPage = () => {
  return (
    <StudentLayout title="List Classes">
      <ListClasses />
    </StudentLayout>
  );
};

export const DetailClassPage = () => {
  return (
    <StudentLayout title="Detail Class">
      <DetailClass />
    </StudentLayout>
  );
};