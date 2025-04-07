import React from "react";
import TutorLayout from "../../../components/layouts/tutor/layout";
import ListClasses from "../../../components/common/education/classInfo/list";
import DetailClass from "../../../components/common/education/classInfo/detail";

export const ListClassesPage = () => {
  return (
    <TutorLayout title="List Classes">
      <ListClasses />
    </TutorLayout>
  );
};

export const DetailClassPage = () => {
  return (
    <TutorLayout title="Detail Class">
      <DetailClass />
    </TutorLayout>
  );
};