import React, { useEffect, useState } from "react";
import AdminLayout from "../../../components/layouts/admin/layout";


const content = (
  <div></div>
);

const CreateTutor = () => {

  return (
    <AdminLayout title="Danh sách Tutor" children={content}>
    </AdminLayout>
  );
};

export default CreateTutor;
