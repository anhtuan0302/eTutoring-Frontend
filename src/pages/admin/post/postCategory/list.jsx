import React, { useEffect, useState } from "react";
import { Table, Tag, Button, Popconfirm, message } from "antd";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../../components/layouts/admin/layout";
import { getPostCategory, updatePostCategory, deletedPostCategory } from "../../../../api/post/postCategory";

const ListPostCategory = () => {
  const [postcategories, setPostCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPostCategories = async () => {
      try {
        console.log('Đang gọi API getCoursecategory...');
        const data = await getPostCategory();
        console.log('Dữ liệu nhận được:', data);
        setPostCategories(data);
      } catch (error) {
        console.error("Chi tiết lỗi:", error);
        message.error("Không thể tải danh sách coursecategory");
      } finally {
        setLoading(false);
      }
    };
    fetchPostCategories();
  }, []);

  // eslint-disable-next-line no-unused-vars
  const handleUpdate = async (id) => {
    try {
      const PostCategoryToUpdate = postcategories.find(dep => dep._id === id);
      if (!PostCategoryToUpdate) {
        message.error("Không tìm thấy post category");
        return;
      }
  
      await updatePostCategory({
        _id: id,
        name: PostCategoryToUpdate.name,
        description: PostCategoryToUpdate.description,
        is_deleted: true,
      });
    
      setPostCategories(prev =>
        prev.map(dep =>
          dep._id === id ? { ...dep, is_deleted: true } : dep
        )
      );
    
      message.success("PostCategory đã chuyển sang trạng thái Inactive");
    } catch (error) {
      message.error(error.response?.data?.error || "Lỗi khi cập nhật PostCategory");
      console.error("Chi tiết lỗi:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deletedPostCategory({ _id: id });
      setPostCategories(prev => prev.filter(item => item._id !== id));
      message.success("Xóa post category thành công");
    } catch (error) {
      console.error("Chi tiết lỗi:", error);
      message.error("Không thể xóa post category");
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
    <AdminLayout title="List Postcategory">
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={() => navigate("/admin/post_category/create")}>
          New PostCategory
        </Button>
      </div>
      <Table columns={columns} dataSource={postcategories} rowKey="_id" loading={loading} />
    </AdminLayout>
  );
};

export default ListPostCategory;
