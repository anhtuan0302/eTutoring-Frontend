import React from "react";
import StudentLayout from "../../../components/layouts/student/layout";
import Profile from "../../../components/common/auth/profile";

export const StudentProfilePage = () => {
  return (
    <StudentLayout title="Profile">
      <Profile />
    </StudentLayout>
  );
};