import React, { useEffect, useState } from "react";
import { Table, Button, Popconfirm, message, Tag } from "antd";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../../components/layouts/admin/layout";
import { getFilesByPostId, deleteFile } from "../../../../api/post/postFile";

const ListPostFile = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line
  const navigate = useNavigate();

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const data = await getFilesByPostId();
      setFiles(data);
    } catch (error) {
      console.error("Chi tiết lỗi:", error);
      message.error("Không thể tải danh sách file");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteFile(id);
      setFiles(prev => prev.filter(item => item._id !== id));
      message.success("Xóa file thành công");
    } catch (error) {
      message.error("Không thể xóa file");
    }
  };

  const columns = [
    {
      title: "Tên file",
      dataIndex: "file_name",
      key: "file_name",
    },
    {
      title: "Loại file",
      dataIndex: "file_type",
      key: "file_type",
      render: (type) => <Tag color="blue">{type}</Tag>
    },
    {
      title: "Bài viết",
      dataIndex: "post",
      key: "post",
      render: (post) => post?.title || 'N/A'
    },
    {
      title: "Thời gian tải lên",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => new Date(date).toLocaleString('vi-VN')
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <>
          <Button type="link" onClick={() => window.open(record.file_url, '_blank')}>
            Xem
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa file này không?"
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
    <AdminLayout title="Danh sách file đính kèm">
      <Table 
        columns={columns} 
        dataSource={files} 
        rowKey="_id" 
        loading={loading}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng số ${total} file`
        }}
      />
    </AdminLayout>
  );
};

export default ListPostFile;