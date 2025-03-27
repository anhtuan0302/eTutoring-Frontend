import React, { useEffect, useState } from "react";
import { Table, Tag, Button, Popconfirm, message } from "antd";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../components/layouts/admin/layout"; 
import { getTutors, deleteTutor } from "../../../api/user/tutor"; 

const ListTutor = () => {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const data = await getTutors();
        setTutors(data);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách tutor:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTutors();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteTutor({ id });
      message.success("Xóa tutor thành công!");
      setTutors(tutors.filter((tutor) => tutor._id !== id));
    } catch (error) {
      message.error("Lỗi khi xóa tutor");
    }
  };

  const columns = [
    {
      title: "Tên Tutor",
      dataIndex: "name",
      key: "name",
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
      title: "Status",
      dataIndex: "is_deleted",
      key: "is_deleted",
      render: (is_deleted) => (
        <Tag color={is_deleted ? "red" : "green"}>
          {is_deleted ? "Delete" : "Active"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <>
          <Button type="link" onClick={() => navigate(`/admin/tutor/${record._id}`)}>
            Chỉnh sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa không?"
            onConfirm={() => handleDelete(record._id)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="link" danger>
              Xóa
            </Button>
          </Popconfirm>
        </>
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
