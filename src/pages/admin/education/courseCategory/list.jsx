import React, { useEffect, useState } from "react";
import { Table, Tag, Button, Popconfirm, message } from "antd";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../../components/layouts/admin/layout";
import { getCourseCategory, updateCourseCategory, deletedCourseCategory } from "../../../../api/education/courseCategory";

const ListCourseCategory = () => {
  const [coursecategories, setCourseCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourseCategories = async () => {
      try {
        console.log('Đang gọi API getCoursecategory...');
        const data = await getCourseCategory();
        console.log('Dữ liệu nhận được:', data);
        setCourseCategories(data);
      } catch (error) {
        console.error("Chi tiết lỗi:", error);
        message.error("Không thể tải danh sách coursecategory");
      } finally {
        setLoading(false);
      }
    };
    fetchCourseCategories();
  }, []);

  const handleUpdate = async (id) => {
    try {
      const CourseCategoryToUpdate = coursecategories.find(dep => dep._id === id);
      if (!CourseCategoryToUpdate) {
        message.error("Không tìm thấy course category");
        return;
      }
  
      await updateCourseCategory({
        _id: id,
        name: CourseCategoryToUpdate.name,
        description: CourseCategoryToUpdate.description,
        is_deleted: true,
      });
    
      setCourseCategories(prev =>
        prev.map(dep =>
          dep._id === id ? { ...dep, is_deleted: true } : dep
        )
      );
    
      message.success("CourseCategory đã chuyển sang trạng thái Inactive");
    } catch (error) {
      message.error(error.response?.data?.error || "Lỗi khi cập nhật CourseCategory");
      console.error("Chi tiết lỗi:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deletedCourseCategory({ _id: id });
      setCourseCategories(prev => prev.filter(item => item._id !== id));
      message.success("Xóa course category thành công");
    } catch (error) {
      console.error("Chi tiết lỗi:", error);
      message.error("Không thể xóa course category");
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
          <Button type="link" onClick={() => navigate(`/admin/course_category/${record._id}`)}>
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
    <AdminLayout title="List Coursecategory">
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={() => navigate("/admin/course_category/create")}>
          New CourseCategory
        </Button>
      </div>
      <Table columns={columns} dataSource={coursecategories} rowKey="_id" loading={loading} />
    </AdminLayout>
  );
};

export default ListCourseCategory;
