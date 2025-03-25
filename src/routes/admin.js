import React from "react";
import { Route, Routes } from "react-router-dom";

import Dashboard from "../pages/admin/dashboard";
import ListTutor from "../pages/admin/tutor/list";

// Department
import ListDepartment from "../pages/admin/education/department/list";
import CreateDepartment from "../pages/admin/education/department/create";
import UpdateDepartment from "../pages/admin/education/department/update";
import DeletedList from "../pages/admin/education/department/deletedList";

// Course Category
import ListCourseCategory from "../pages/admin/education/courseCategory/list";
import CreateCourseCategory from "../pages/admin/education/courseCategory/create";
import UpdateCourseCategory from "../pages/admin/education/courseCategory/update";

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
            <Route path="/department/deleted" element={<DeletedList />} />
            
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
        </Routes>
    );
};

export default AdminRoutes;
