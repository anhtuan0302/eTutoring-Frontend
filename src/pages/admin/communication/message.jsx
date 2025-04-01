import React from "react";
import AdminLayout from "../../../components/layouts/admin/layout";
import Message from "../../../components/common/communication/message";

export const MessagePage = () => {
  return (
    <AdminLayout title="Message">
      <Message />
    </AdminLayout>
  );
};
