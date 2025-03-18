import React from "react";
import AdminLayout from "../../components/layouts/admin/layout";

const content = (
  <div>
    <h1>Dashboard</h1>
  </div>
);

const Dashboard = () => {
  return (
    <AdminLayout title="Dashboard" breadcrumb="Dashboard" children={content} />
  );
};

export default Dashboard;