import React, { useState, useEffect } from "react";
import { Form, Select, Button, message } from "antd";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../../components/layouts/admin/layout";
import { createPostView } from "../../../../api/post/postView";
import { getAllPosts } from "../../../../api/post/post";

const CreatePostView = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const data = await getAllPosts();
      setPosts(data);
    } catch (error) {
      message.error("Không thể tải danh sách bài viết");
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      await createPostView(values);
      message.success("Tạo lượt xem thành công");
      navigate("/admin/post-view");
    } catch (error) {
      message.error("Lỗi khi tạo lượt xem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Tạo lượt xem bài viết">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ maxWidth: 600, margin: '0 auto', padding: '24px' }}
      >
        <Form.Item
          name="post_id"
          label="Bài viết"
          rules={[{ required: true, message: "Vui lòng chọn bài viết" }]}
        >
          <Select placeholder="Chọn bài viết">
            {posts.map(post => (
              <Select.Option key={post._id} value={post._id}>
                {post.title}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button onClick={() => navigate("/admin/post-view")}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Tạo lượt xem
            </Button>
          </div>
        </Form.Item>
      </Form>
    </AdminLayout>
  );
};

export default CreatePostView;