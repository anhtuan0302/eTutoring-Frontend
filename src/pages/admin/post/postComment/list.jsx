import React, { useEffect, useState } from "react";
import { Table, Button, Popconfirm, message } from "antd";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../../components/layouts/admin/layout";
import { getAllPostComment, deletePostComment } from "../../../../api/post/postComment";

const ListPostComment = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      const data = await getAllPostComment();
      setComments(data);
    } catch (error) {
      console.error("Chi tiết lỗi:", error);
      message.error("Không thể tải danh sách bình luận");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deletePostComment({ _id: id });
      setComments(prev => prev.filter(item => item._id !== id));
      message.success("Xóa bình luận thành công");
    } catch (error) {
      message.error("Không thể xóa bình luận");
    }
  };

  const columns = [
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
      title: "Bài viết",
      dataIndex: "post",
      key: "post",
      render: (post) => post?.title || 'N/A'
    },
    {
      title: "Người bình luận",
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
        <>
          <Button type="link" onClick={() => navigate(`/admin/post-comment/${record._id}`)}>
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa bình luận này không?"
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
    <AdminLayout title="Danh sách bình luận">
      <Table 
        columns={columns} 
        dataSource={comments} 
        rowKey="_id" 
        loading={loading}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng số ${total} bình luận`
        }}
      />
    </AdminLayout>
  );
};

export default ListPostComment;