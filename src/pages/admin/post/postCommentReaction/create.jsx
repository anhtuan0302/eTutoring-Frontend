import React, { useState, useEffect } from "react";
import { Form, Select, Button, message } from "antd";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../../components/layouts/admin/layout";
import { createPostCommentReaction } from "../../../../api/post/postCommentReaction";
import { getAllPostComment } from "../../../../api/post/postComment";

const CreatePostCommentReaction = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      const data = await getAllPostComment();
      setComments(data);
    } catch (error) {
      message.error("Không thể tải danh sách bình luận");
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      await createPostCommentReaction(values);
      message.success("Tạo reaction thành công");
      navigate("/admin/post-comment-reaction");
    } catch (error) {
      message.error("Lỗi khi tạo reaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Tạo reaction cho bình luận">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ maxWidth: 600, margin: '0 auto', padding: '24px' }}
      >
        <Form.Item
          name="comment_id"
          label="Bình luận"
          rules={[{ required: true, message: "Vui lòng chọn bình luận" }]}
        >
          <Select placeholder="Chọn bình luận">
            {comments.map(comment => (
              <Select.Option key={comment._id} value={comment._id}>
                {comment.content}
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
            <Select.Option value="dislike">Dislike</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button onClick={() => navigate("/admin/post-comment-reaction")}>
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

export default CreatePostCommentReaction;