import React, { useEffect, useState } from "react";
import { Table, message } from "antd";
import AdminLayout from "../../../../components/layouts/admin/layout";
import { getPostViewsByPost } from "../../../../api/post/postView";

const ListPostView = () => {
  const [views, setViews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchViews = async () => {
      try {
          setLoading(true);
          const data = await getPostViewsByPost();
          setViews(data);
      } catch (error) {
          message.error("Không thể tải danh sách lượt xem");
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchViews();
  }, []);
  
  // const fetchData = async () => {
  //     try {
  //         setLoading(true);
  //         const data = await someAPI();
  //         setData(data);
  //     } catch (error) {
  //         message.error(error.message || "Có lỗi xảy ra");
  //     } finally {
  //         setLoading(false);
  //     }
  // };

  const columns = [
    {
      title: "Bài viết",
      dataIndex: "post",
      key: "post",
      render: (post) => post?.title || 'N/A'
    },
    {
      title: "Người xem",
      dataIndex: "user",
      key: "user",
      render: (user) => user?.name || 'Ẩn danh'
    },
    {
      title: "Thời gian xem",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => new Date(date).toLocaleString('vi-VN')
    },
    {
      title: "IP Address",
      dataIndex: "ip_address",
      key: "ip_address",
    }
  ];

  return (
    <AdminLayout title="Danh sách lượt xem bài viết">
      <Table 
        columns={columns} 
        dataSource={views} 
        rowKey="_id" 
        loading={loading}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng số ${total} lượt xem`
        }}
      />
    </AdminLayout>
  );
};

export default ListPostView;