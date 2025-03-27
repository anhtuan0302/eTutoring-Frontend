import React from "react";
import { Route, Routes } from "react-router-dom";

import Dashboard from "../pages/admin/dashboard";
import ListTutor from "../pages/admin/tutor/list";

// Department
import ListDepartment from "../pages/admin/education/department/list";
import CreateDepartment from "../pages/admin/education/department/create";
import UpdateDepartment from "../pages/admin/education/department/update";

// Course Category
import ListCourseCategory from "../pages/admin/education/courseCategory/list";
import CreateCourseCategory from "../pages/admin/education/courseCategory/create";
import UpdateCourseCategory from "../pages/admin/education/courseCategory/update";


// Post
import ListPost from "../pages/admin/post/post/list";
import CreatePost from "../pages/admin/post/post/create";
import UpdatePost from "../pages/admin/post/post/update";

//Post Category
import ListPostCategory from "../pages/admin/post/postCategory/list";
import UpdatePostCategory from "../pages/admin/post/postCategory/update";
import CreatePostCategory from "../pages/admin/post/postCategory/create";

//Post Comment
import ListPostComment from "../pages/admin/post/postComment/list";

import CreatePostComment from "../pages/admin/post/postComment/create";


//Post Comment Reaction
import ListPostCommentReaction from "../pages/admin/post/postCommentReaction/list";
import CreatePostCommentReaction from "../pages/admin/post/postCommentReaction/create";


//Post File
import ListPostFile from "../pages/admin/post/postFile/list";
import CreatePostFile from "../pages/admin/post/postFile/create";
//Post Reaction
import ListPostReaction from "../pages/admin/post/postReaction/list";
import CreatePostReaction from "../pages/admin/post/postReaction/create";


//Post View
import ListPostView from "../pages/admin/post/postView/list";
import CreatePostView from "../pages/admin/post/postView/create";


// Class Tutor - Chỉnh sửa đường dẫn đúng với cấu trúc mới
import CreateClassTutor from "../pages/admin/education/classTutor/create";
import UpdateClassTutor from "../pages/admin/education/classTutor/update";
import ListClassTutor from "../pages/admin/education/classTutor/list";

//Class Room
import CreateClassRoom from "../pages/admin/education/classRoom/create";
import UpdateClassRoom from "../pages/admin/education/classRoom/update";
import ListClassRoom from "../pages/admin/education/classRoom/list";

const AdminRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Dashboard />} />
            
            {/* Tutor */}
            <Route path="/tutor" element={<ListTutor />} />
            
            {/* Department */}
            <Route path="/department" element={<ListDepartment />} />
            <Route path="/department/create" element={<CreateDepartment />} />
            <Route path="/department/:id" element={<UpdateDepartment />} />

            
        
            {/* Course Category */}
            <Route path="/course_category" element={<ListCourseCategory />} />
            <Route path="/course_category/create" element={<CreateCourseCategory />} />
            <Route path="/course_category/:id" element={<UpdateCourseCategory />} />

            {/* Class Tutor */}
            <Route path="/class_tutor" element={<ListClassTutor />} />
            <Route path="/class_tutor/create" element={<CreateClassTutor />} />
            <Route path="/class_tutor/:id" element={<UpdateClassTutor />} />

            {/* Class Room */}
            <Route path="/classroom" element={<ListClassRoom />} />
            <Route path="/classroom/create" element={<CreateClassRoom />} />
            <Route path="/classroom/:id" element={<UpdateClassRoom />} />

            {/* Post Management */}
            {/* Post */}
            <Route path="/post" element={<ListPost />} />
            <Route path="/post/create" element={<CreatePost />} />
            <Route path="/post/:id" element={<UpdatePost />} />

            {/* Post Category */}
            <Route path="/post-category" element={<ListPostCategory />} />
            <Route path="/post-category/create" element={<CreatePostCategory />} />
            <Route path="/post-category/:id" element={<UpdatePostCategory />} />

            {/* Post Comment */}
            <Route path="/post-comment" element={<ListPostComment />} />
            <Route path="/post-comment/create" element={<CreatePostComment />} />

            {/* Post Comment Reaction */}
            <Route path="/post-comment-reaction" element={<ListPostCommentReaction />} />
            <Route path="/post-comment-reaction/create" element={<CreatePostCommentReaction />} />

            {/* Post File */}
            <Route path="/post-file" element={<ListPostFile />} />
            <Route path="/post-file/create" element={<CreatePostFile />} />

            {/* Post Reaction */}
            <Route path="/post-reaction" element={<ListPostReaction />} />
            <Route path="/post-reaction/create" element={<CreatePostReaction />} />

            {/* Post View */}
            <Route path="/post-view" element={<ListPostView />} />
            <Route path="/post-view/create" element={<CreatePostView />} />
        </Routes>
    );
};

export default AdminRoutes;
