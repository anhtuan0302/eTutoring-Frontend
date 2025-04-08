import React from "react";
import AppLayout from "../../../components/layouts/layout";
import ListClasses from "../../../components/common/education/classInfo/list";
import DetailClass from "../../../components/common/education/classInfo/detail";

export const ListClassesPage = () => {
  return (
    <AppLayout title="List Classes">
      <ListClasses />
    </AppLayout>
  );
};

export const DetailClassPage = () => {
  return (
    <AppLayout title="Detail Class">
      <DetailClass />
    </AppLayout>
  );
};