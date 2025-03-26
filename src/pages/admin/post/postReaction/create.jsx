import React, { useState, useEffect } from "react";
import { Form, Select, Button, message } from "antd";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../../components/layouts/admin/layout";
import { createPostReaction } from "../../../../api/post/postReaction";
import { getAllPosts } from "../../../../api/post/post";

const CreatePostReaction = () => {
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
      await createPostReaction(values);
      message.success("Tạo reaction thành công");
      navigate("/admin/post-reaction");
    } catch (error) {
      message.error("Lỗi khi tạo reaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Tạo reaction cho bài viết">
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
          name="reaction_type"
          label="Loại reaction"
          rules={[{ required: true, message: "Vui lòng chọn loại reaction" }]}
        >
          <Select placeholder="Chọn loại reaction">
            <Select.Option value="like">Like</Select.Option>
            <Select.Option value="love">Love</Select.Option>
            <Select.Option value="haha">Haha</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button onClick={() => navigate("/admin/post-reaction")}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Tạo reaction
            </Button>
          </div>
        </Form.Item>
      </Form>
    </AdminLayout>
  );
};

export default CreatePostReaction;