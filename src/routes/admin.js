import React from "react";
import { Route, Routes } from "react-router-dom";

import Dashboard from "../pages/admin/dashboard";
import ListTutor from "../pages/admin/tutor/list";


//Department
import ListDepartment from "../pages/admin/education/department/list";
import CreateDepartment from "../pages/admin/education/department/create";
import UpdateDepartment from "../pages/admin/education/department/update";
import DeletedList from "../pages/admin/education/department/deletedList";

//Coursecategory
import ListCourseCategory from "../pages/admin/education/courseCategory/list";
import CreateCourseCategory from "../pages/admin/education/courseCategory/create";
import UpdateCourseCategory from "../pages/admin/education/courseCategory/update";


const AdminRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Dashboard />} />
            {/* Tutor */}
            <Route path="/tutor" element={<ListTutor />} />
            
            {/* Departmaent */}
            <Route path="/department" element={<ListDepartment />} />
            <Route path="/department/create" element={<CreateDepartment />} />
            <Route path="/department/:id" element={<UpdateDepartment />} />
            <Route path="admin/department/deleted" element={<DeletedList />} />
            
            

            {/* Course category */}
            <Route path="/course_category" element={<ListCourseCategory />} />
            <Route path="/course_category/create" element={<CreateCourseCategory />} />
            <Route path="/course_category/:id" element={<UpdateCourseCategory />} />
            
        </Routes>
    );
};

export default AdminRoutes;