import React from "react";
import StaffLayout from "../../../components/layouts/staff/layout";
import Message from "../../../components/common/communication/message";

export const MessagePage = () => {
  return (
    <StaffLayout title="Message">
      <Message />
    </StaffLayout>
  );
};
