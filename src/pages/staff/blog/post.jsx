import React from "react";
import AppLayout from "../../../components/layouts/layout";
import Post from "../../../components/common/blog/post";

export const PostPage = () => {
  return (
    <AppLayout title="Posts List">
      <Post />
    </AppLayout>
  );
};