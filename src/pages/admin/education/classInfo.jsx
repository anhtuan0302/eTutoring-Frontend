import React from "react";
import AdminLayout from "../../../components/layouts/admin/layout";
import ListClasses from "../../../components/common/education/classInfo/list";
import CreateClass from "../../../components/common/education/classInfo/create";
import DetailClass from "../../../components/common/education/classInfo/detail";
import UpdateClass from "../../../components/common/education/classInfo/update";

export const ListClassesPage = () => {
  return (
    <AdminLayout title="List Classes">
      <ListClasses />
    </AdminLayout>
  );
};

export const CreateClassPage = () => {
  return (
    <AdminLayout title="Create Class">
      <CreateClass />
    </AdminLayout>
  );
};

export const DetailClassPage = () => {
  return (
    <AdminLayout title="Detail Class">
      <DetailClass />
    </AdminLayout>
  );
};

export const UpdateClassPage = () => {
  return (
    <AdminLayout title="Update Class">
      <UpdateClass />
    </AdminLayout>
  );
};
