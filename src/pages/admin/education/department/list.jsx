import React, { useEffect, useState } from "react";
import { Table, Tag, Button, Popconfirm, message } from "antd";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../../components/layouts/admin/layout";
import { getDepartment, updateDepartment } from "../../../../api/education/department";

const ListDepartment = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        console.log('Đang gọi API getCoursecategory...');
        const data = await getDepartment();
        console.log('Dữ liệu nhận được:', data);
        setDepartments(data);
      } catch (error) {
        console.error("Chi tiết lỗi:", error);
        message.error("Không thể tải danh sách department");
      } finally {
        setLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  const handleUpdate = async (id) => {
    try {
      const departmentToUpdate = departments.find(dep => dep._id === id);
      if (!departmentToUpdate) {
        message.error("Không tìm thấy department");
        return;
      }
  
      await updateDepartment({
        id,
        name: departmentToUpdate.name,
        description: departmentToUpdate.description,
        is_deleted: true,
      });
  
      // Cập nhật lại danh sách hiển thị
      setDepartments(prev =>
        prev.filter(dep => dep._id !== id)  // Thay đổi này để xóa item khỏi danh sách ngay lập tức
      );
  
      message.success("Department đã chuyển sang trạng thái Inactive");
    } catch (error) {
      message.error(error.response?.data?.error || "Lỗi khi cập nhật department");
      console.error("Chi tiết lỗi:", error.response?.data || error.message);
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
      title: "Action",
      key: "action",
      render: (_, record) => (
        <>
          <Button type="link" onClick={() => navigate(`/admin/department/${record._id}`)}>
            Edit
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa không?"
            onConfirm={() => handleUpdate(record._id)}
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

  // Lọc chỉ hiển thị các department chưa bị xóa
  const activeDepartments = departments.filter(dep => !dep.is_deleted);

  return (
    <AdminLayout title="List Department">
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Button type="primary" onClick={() => navigate("/admin/department/create")}>
          New Department
        </Button>
        <Button onClick={() => navigate("/admin/department/deleted")}>
          View Deleted Departments ({departments.filter(dep => dep.is_deleted).length})
        </Button>
      </div>
      <Table columns={columns} dataSource={activeDepartments} rowKey="_id" loading={loading} />
    </AdminLayout>
  );
};

export default ListDepartment;
