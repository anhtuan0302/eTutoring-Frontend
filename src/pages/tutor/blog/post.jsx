import React from "react";
import TutorLayout from "../../../components/layouts/tutor/layout";
import Post from "../../../components/common/blog/post";

export const PostPage = () => {
  return (
    <TutorLayout title="Posts List">
      <Post />
    </TutorLayout>
  );
};
