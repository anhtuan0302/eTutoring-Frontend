import React, { useState, useEffect } from "react";
import { Form, Select, Upload, Button, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../../components/layouts/admin/layout";
import { uploadPostFile } from "../../../../api/post/postFile";
import { getAllPosts } from "../../../../api/post/post";

const CreatePostFile = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [fileList, setFileList] = useState([]);

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
      const formData = new FormData();
      formData.append('post_id', values.post_id);
      fileList.forEach(file => {
        formData.append('files', file.originFileObj);
      });

      await uploadPostFile(formData);
      message.success("Tải file lên thành công");
      navigate("/admin/post-file");
    } catch (error) {
      message.error("Lỗi khi tải file lên");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Tải file lên">
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
          label="Files"
          rules={[{ required: true, message: "Vui lòng chọn ít nhất một file" }]}
        >
          <Upload
            multiple
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            beforeUpload={() => false}
          >
            <Button icon={<UploadOutlined />}>Chọn files</Button>
          </Upload>
        </Form.Item>

        <Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button onClick={() => navigate("/admin/post-file")}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Tải lên
            </Button>
          </div>
        </Form.Item>
      </Form>
    </AdminLayout>
  );
};

export default CreatePostFile;