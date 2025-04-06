import React from "react";
import StudentLayout from "../../../components/layouts/student/layout";
import Post from "../../../components/common/blog/post";

export const PostPage = () => {
  return (
    <StudentLayout title="Posts List">
      <Post />
    </StudentLayout>
  );
};