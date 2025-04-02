import React from "react";
import AdminLayout from "../../../components/layouts/admin/layout";
import ListEnrollments from "../../../components/common/education/enrollment/list";
import CreateEnrollment from "../../../components/common/education/enrollment/create";
import DetailEnrollment from "../../../components/common/education/enrollment/detail";
import UpdateEnrollment from "../../../components/common/education/enrollment/update";

export const ListEnrollmentsPage = () => {
  return (
    <AdminLayout title="List Enrollments">
      <ListEnrollments />
    </AdminLayout>
  );
};

export const CreateEnrollmentPage = () => {
  return (
    <AdminLayout title="Create Enrollment">
      <CreateEnrollment />
    </AdminLayout>
  );
};

export const DetailEnrollmentPage = () => {
  return (
    <AdminLayout title="Detail Enrollment">
      <DetailEnrollment />
    </AdminLayout>
  );
};

export const UpdateEnrollmentPage = () => {
  return (
    <AdminLayout title="Update Enrollment">
      <UpdateEnrollment />
    </AdminLayout>
  );
};