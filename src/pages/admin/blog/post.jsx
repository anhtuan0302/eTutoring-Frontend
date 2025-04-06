import React from "react";
import AdminLayout from "../../../components/layouts/admin/layout";
import Post from "../../../components/common/blog/post";

export const PostPage = () => {
  return (
    <AdminLayout title="Posts List">
      <Post />
    </AdminLayout>
  );
};

