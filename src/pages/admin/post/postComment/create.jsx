import React, { useState, useEffect } from "react";
import { Form, Input, Select, Button, message } from "antd";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../../components/layouts/admin/layout";
import { createPostComment } from "../../../../api/post/postComment";
import { getAllPosts } from "../../../../api/post/post";

const { TextArea } = Input;

const CreatePostComment = () => {
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
      await createPostComment(values);
      message.success("Tạo bình luận thành công");
      navigate("/admin/post-comment");
    } catch (error) {
      message.error("Lỗi khi tạo bình luận");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Tạo bình luận mới">
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

        <Form.Item
          name="content"
          label="Nội dung bình luận"
          rules={[{ required: true, message: "Vui lòng nhập nội dung bình luận" }]}
        >
          <TextArea rows={4} placeholder="Nhập nội dung bình luận" />
        </Form.Item>

        <Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button onClick={() => navigate("/admin/post-comment")}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Tạo bình luận
            </Button>
          </div>
        </Form.Item>
      </Form>
    </AdminLayout>
  );
};

export default CreatePostComment;