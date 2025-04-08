import React from "react";
import AppLayout from "../../../components/layouts/layout";
import ListEnrollments from "../../../components/common/education/enrollment/list";
import CreateEnrollment from "../../../components/common/education/enrollment/create";
import DetailEnrollment from "../../../components/common/education/enrollment/detail";
import UpdateEnrollment from "../../../components/common/education/enrollment/update";

export const ListEnrollmentsPage = () => {
  return (
    <AppLayout title="List Enrollments">
      <ListEnrollments />
    </AppLayout>
  );
};

export const CreateEnrollmentPage = () => {
  return (
    <AppLayout title="Create Enrollment">
      <CreateEnrollment />
    </AppLayout>
  );
};

export const DetailEnrollmentPage = () => {
  return (
    <AppLayout title="Detail Enrollment">
      <DetailEnrollment />
    </AppLayout>
  );
};

export const UpdateEnrollmentPage = () => {
  return (
    <AppLayout title="Update Enrollment">
      <UpdateEnrollment />
    </AppLayout>
  );
};