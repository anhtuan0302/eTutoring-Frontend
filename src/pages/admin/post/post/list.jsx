import React, { useEffect, useState } from "react";
import { Table, Tag, Button, Popconfirm, message } from "antd";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../../components/layouts/admin/layout";
import { getAllPosts, deletePost } from "../../../../api/post/post";

const ListPost = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      console.log('Đang gọi API getAllPosts...');
      const data = await getAllPosts();
      console.log('Dữ liệu nhận được:', data);
      setPosts(data);
    } catch (error) {
      console.error("Chi tiết lỗi:", error);
      message.error("Không thể tải danh sách bài viết");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deletePost({ _id: id });
      setPosts(prev => prev.filter(item => item._id !== id));
      message.success("Xóa bài viết thành công");
    } catch (error) {
      console.error("Chi tiết lỗi:", error);
      message.error("Không thể xóa bài viết");
    }
  };

  const columns = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Nội dung",
      dataIndex: "content",
      key: "content",
      render: (content) => (
        <div style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {content}
        </div>
      )
    },
    {
      title: "Danh mục",
      dataIndex: "post_category",
      key: "post_category",
      render: (post_category) => post_category?.name || 'Chưa phân loại'
    },
    {
      title: "Trạng thái",
      dataIndex: "is_deleted",
      key: "is_deleted",
      render: (is_deleted) => (
        <Tag color={is_deleted ? "red" : "green"}>
          {is_deleted ? "Đã xóa" : "Active"}
        </Tag>
      ),
    },
    {
      title: "Thời gian tạo",
      dataIndex: "created_at",
      key: "created_at",
      render: (created_at) => new Date(created_at).toLocaleDateString('vi-VN')
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <>
          <Button 
            type="link" 
            onClick={() => navigate(`/admin/post/${record._id}`)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa bài viết này không?"
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
    <AdminLayout title="Danh sách bài viết">
      <div style={{ marginBottom: 16 }}>
        <Button 
          type="primary" 
          onClick={() => navigate("/admin/post/create")}
        >
          Tạo bài viết mới
        </Button>
      </div>
      <Table 
        columns={columns} 
        dataSource={posts} 
        rowKey="_id" 
        loading={loading}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng số ${total} bài viết`
        }}
      />
    </AdminLayout>
  );
};

export default ListPost;