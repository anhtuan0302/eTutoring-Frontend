import React, { useEffect, useState } from "react";
import { Table, Button, Popconfirm, message, Tag } from "antd";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../../components/layouts/admin/layout";
import { getAllPostCommentReaction, deletePostCommentReaction } from "../../../../api/post/postCommentReaction";

const ListPostCommentReaction = () => {
  const [reactions, setReactions] = useState([]);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line
  const navigate = useNavigate();

  useEffect(() => {
    fetchReactions();
  }, []);

  const fetchReactions = async () => {
    try {
      const data = await getAllPostCommentReaction();
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
      await deletePostCommentReaction({ _id: id });
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
        <Tag color={type === 'like' ? 'blue' : 'red'}>
          {type.toUpperCase()}
        </Tag>
      )
    },
    {
      title: "Bình luận",
      dataIndex: "comment",
      key: "comment",
      render: (comment) => (
        <div style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {comment?.content || 'N/A'}
        </div>
      )
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
    <AdminLayout title="Danh sách reaction bình luận">
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

export default ListPostCommentReaction;