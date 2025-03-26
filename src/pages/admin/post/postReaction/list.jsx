import React, { useEffect, useState } from "react";
import { Table, Button, Popconfirm, message, Tag } from "antd";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../../components/layouts/admin/layout";
import { getAllPostReaction, deletePostReaction } from "../../../../api/post/postReaction";

const ListPostReaction = () => {
  const [reactions, setReactions] = useState([]);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line
  const navigate = useNavigate();

  useEffect(() => {
    fetchReactions();
  }, []);

  const fetchReactions = async () => {
    try {
      const data = await getAllPostReaction();
      setReactions(data);
    } catch (error) {
      console.error("Chi tiết lỗi:", error);
      message.error("Không thể tải danh sách reaction");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deletePostReaction({ _id: id });
      setReactions(prev => prev.filter(item => item._id !== id));
      message.success("Xóa reaction thành công");
    } catch (error) {
      message.error("Không thể xóa reaction");
    }
  };

  const columns = [
    {
      title: "Loại reaction",
      dataIndex: "reaction_type",
      key: "reaction_type",
      render: (type) => (
        <Tag color={type === 'like' ? 'blue' : type === 'love' ? 'red' : 'orange'}>
          {type.toUpperCase()}
        </Tag>
      )
    },
    {
      title: "Bài viết",
      dataIndex: "post",
      key: "post",
      render: (post) => post?.title || 'N/A'
    },
    {
      title: "Người dùng",
      dataIndex: "user",
      key: "user",
      render: (user) => user?.name || 'Ẩn danh'
    },
    {
      title: "Thời gian",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => new Date(date).toLocaleString('vi-VN')
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Popconfirm
          title="Bạn có chắc muốn xóa reaction này không?"
          onConfirm={() => handleDelete(record._id)}
          okText="Có"
          cancelText="Không"
        >
          <Button type="link" danger>
            Xóa
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <AdminLayout title="Danh sách reaction bài viết">
      <Table 
        columns={columns} 
        dataSource={reactions} 
        rowKey="_id" 
        loading={loading}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng số ${total} reaction`
        }}
      />
    </AdminLayout>
  );
};

export default ListPostReaction;