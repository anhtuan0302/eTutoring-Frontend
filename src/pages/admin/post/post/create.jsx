import React, { useState, useEffect } from "react";
import { Form, Input, Select, Button, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../../components/layouts/admin/layout";
import { createPost } from "../../../../api/post/post";
import { getPostCategory } from "../../../../api/post/postCategory";
import { uploadPostFile } from "../../../../api/post/postFile";

const { TextArea } = Input;

const CreatePost = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await getPostCategory();
      setCategories(data);
    } catch (error) {
      message.error("Không thể tải danh mục bài viết");
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      // Lấy user_id từ localStorage hoặc nơi lưu thông tin user
      const userData = JSON.parse(localStorage.getItem('user')); // hoặc cách lấy user_id khác
      
      const postData = {
        title: values.title,
        content: values.content,
        post_category_id: values.post_category_id,
        is_deleted: false,
        user_id: userData._id  // Thêm user_id vào đây
      };

      const post = await createPost(postData);

      if (fileList.length > 0) {
        const formData = new FormData();
        fileList.forEach(file => {
          formData.append('files', file.originFileObj);
        });
        formData.append('post_id', post._id);
        await uploadPostFile(formData);
      }

      message.success("Tạo bài viết thành công");
      navigate("/admin/post");
    } catch (error) {
      message.error("Lỗi khi tạo bài viết");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Tạo bài viết mới">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ maxWidth: 800 }}
      >
        <Form.Item
          name="title"
          label="Tiêu đề"
          rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
        >
          <Input placeholder="Nhập tiêu đề bài viết" />
        </Form.Item>

        <Form.Item
          name="content"
          label="Nội dung"
          rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
        >
          <TextArea rows={6} placeholder="Nhập nội dung bài viết" />
        </Form.Item>

        <Form.Item
          name="post_category_id"
          label="Danh mục"
          rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
        >
          <Select placeholder="Chọn danh mục">
            {categories.map(category => (
              <Select.Option key={category._id} value={category._id}>
                {category.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Tệp đính kèm">
          <Upload
            listType="picture"
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            beforeUpload={() => false}
            multiple
          >
            <Button icon={<UploadOutlined />}>Chọn file</Button>
          </Upload>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Tạo bài viết
          </Button>
          <Button 
            style={{ marginLeft: 8 }} 
            onClick={() => navigate("/admin/post")}
          >
            Hủy
          </Button>
        </Form.Item>
      </Form>
    </AdminLayout>
  );
};

export default CreatePost;