import React, { useEffect, useState } from "react";
import { Table, Button, Popconfirm, message } from "antd";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../../components/layouts/admin/layout";
import { getDepartment, deletedDepartment, updateDepartment } from "../../../../api/education/department";

const DeletedList = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await getDepartment();
        // Lọc chỉ lấy các department đã bị xóa
        const deletedDepartments = data.filter(dep => dep.is_deleted);
        setDepartments(deletedDepartments);
      } catch (error) {
        console.error("Chi tiết lỗi:", error);
        message.error("Không thể tải danh sách department đã xóa");
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();

    // Tự động refresh dữ liệu mỗi 5 giây
    const interval = setInterval(fetchDepartments);

    // Cleanup function
    return () => clearInterval(interval);
  }, []);

  const handleRestore = async (id) => {
    try {
      const departmentToRestore = departments.find(dep => dep._id === id);
      await updateDepartment({
        id,
        name: departmentToRestore.name,
        description: departmentToRestore.description,
        is_deleted: false,
      });
      
      // Refresh dữ liệu ngay lập tức sau khi restore
      const data = await getDepartment();
      const deletedDepartments = data.filter(dep => dep.is_deleted);
      setDepartments(deletedDepartments);
      
      message.success("Khôi phục department thành công");
    } catch (error) {
      message.error("Lỗi khi khôi phục department");
    }
  };

  const handlePermanentDelete = async (id) => {
    try {
      await deletedDepartment(id);
      setDepartments(prev => prev.filter(dep => dep._id !== id));
      message.success("Xóa department thành công");
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
      title: "Action",
      key: "action",
      render: (_, record) => (
        <>
          <Button type="link" onClick={() => handleRestore(record._id)}>
            Khôi phục
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa vĩnh viễn không?"
            onConfirm={() => handlePermanentDelete(record._id)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="link" danger>
              Xóa vĩnh viễn
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <AdminLayout title="Deleted Departments">
      <div style={{ marginBottom: 16 }}>
        <Button onClick={() => navigate("/admin/department")}>
          Quay lại danh sách Department
        </Button>
      </div>
      <Table columns={columns} dataSource={departments} rowKey="_id" loading={loading} />
    </AdminLayout>
  );
};

export default DeletedList;
