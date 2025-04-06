import React from "react";
import StudentLayout from "../../../components/layouts/student/layout";
import Message from "../../../components/common/communication/message";

export const MessagePage = () => {
  return (
    <StudentLayout title="Message">
      <Message />
    </StudentLayout>
  );
};
