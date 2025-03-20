import React, { useEffect, useState } from "react";
import { Table, Tag } from "antd";
import AdminLayout from "../../../components/layouts/admin/layout";
import { getTutor } from "../../../api/user/tutor";
import { getDepartment } from "../../../api/education/department";

const ListTutor = () => {
  const [tutors, setTutors] = useState([]);
  const [departments, setDepartments] = useState({}); // Dùng {} thay vì []
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Gọi cả hai API song song
        const [tutorData, departmentData] = await Promise.all([
          getTutor(),
          getDepartment(),
        ]);

        console.log("Tutors:", tutorData);
        console.log("Departments:", departmentData);

        // Chuyển danh sách khoa thành object { _id: name }
        const departmentMap = {};
        departmentData.forEach(dept => {
          departmentMap[dept._id] = dept.name;
        });

        setTutors(tutorData);
        setDepartments(departmentMap);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const columns = [
    {
      title: "Mã Tutor",
      dataIndex: "tutor_code",
      key: "tutor_code",
    },
    {
      title: "User ID",
      dataIndex: "user_id",
      key: "user_id",
      render: (user_id) => user_id || "N/A",
    },
    {
        title: "Khoa",
        dataIndex: "department_id",
        key: "department_id",
        render: (department) => {
          console.log("Render department:", department);
          return department?.name || "N/A";
        },
      },           
    {
      title: "Trạng thái",
      dataIndex: "is_deleted",
      key: "is_deleted",
      render: (is_deleted) => (
        <Tag color={is_deleted ? "red" : "green"}>
          {is_deleted ? "Đã xóa" : "Hoạt động"}
        </Tag>
      ),
    },
  ];

  return (
    <AdminLayout title="Danh sách Tutor">
      <Table columns={columns} dataSource={tutors} rowKey="_id" loading={loading} />
    </AdminLayout>
  );
};

export default ListTutor;
