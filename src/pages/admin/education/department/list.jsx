import React, { useEffect, useState } from "react";
import { Table, Tag, Button, Popconfirm, message } from "antd";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../../components/layouts/admin/layout";
import { getDepartment, deletedDepartment } from "../../../../api/education/department";

const ListDepartment = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await getDepartment();
        setDepartments(data);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách department:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deletedDepartment({ id });
      message.success("Xóa department thành công!");
      setDepartments(departments.filter((dept) => dept._id !== id));
    } catch (error) {
      message.error("Lỗi khi xóa department");
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Status",
      dataIndex: "is_deleted",
      key: "is_deleted",
      render: (is_deleted) => (
        <Tag color={is_deleted ? "red" : "green"}>
          {is_deleted ? "Đã xóa" : "Active"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <>
          <Button type="link" onClick={() => navigate(`/admin/department/${record._id}`)}>
            Edit
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa không?"
            onConfirm={() => handleDelete(record._id)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="link" danger>
              Delete
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <AdminLayout title="List Department">
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={() => navigate("/admin/department/create")}>
          New Department
        </Button>
      </div>
      <Table columns={columns} dataSource={departments} rowKey="_id" loading={loading} />
    </AdminLayout>
  );
};

export default ListDepartment;
