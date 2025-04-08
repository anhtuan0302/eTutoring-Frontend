import React from "react";
import AdminLayout from "../../../components/layouts/layout";
import ListDepartments from "../../../components/common/organization/department/list";
import CreateDepartment from "../../../components/common/organization/department/create";
import UpdateDepartment from "../../../components/common/organization/department/update";
import DetailDepartment from "../../../components/common/organization/department/detail";

export const ListDepartmentsPage = () => {
  return (
    <AdminLayout title="Departments List">
      <ListDepartments />
    </AdminLayout>
  );
};

export const CreateDepartmentPage = () => {
  return (
    <AdminLayout title="Create Department">
      <CreateDepartment />
    </AdminLayout>
  );
};

export const UpdateDepartmentPage = () => {
  return (
    <AdminLayout title="Update Department">
      <UpdateDepartment />
    </AdminLayout>
  );
};

export const DetailDepartmentPage = () => {
  return (
    <AdminLayout title="Detail Department">
      <DetailDepartment />
    </AdminLayout>
  );
};
