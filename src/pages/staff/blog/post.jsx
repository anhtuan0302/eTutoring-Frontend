import React from "react";
import StaffLayout from "../../../components/layouts/staff/layout";
import Post from "../../../components/common/blog/post";

export const PostPage = () => {
  return (
    <StaffLayout title="Posts List">
      <Post />
    </StaffLayout>
  );
};