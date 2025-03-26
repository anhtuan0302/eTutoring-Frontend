import React, { useState } from "react";
import { Form, Input, Button, message } from "antd";
import { useNavigate } from "react-router-dom";
import { createPostCategory } from "../../../../api/post/postCategory";
import AdminLayout from "../../../../components/layouts/admin/layout";

const CreatePostCategory = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Thêm useNavigate để điều hướng

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await createPostCategory(values);
      message.success("Department created successfully!");
      setTimeout(() => {
        navigate("/admin/post_category"); 
      }); 
    } catch (error) {
      message.error("Failed to create department");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Create CourseCategory">
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="Post Category Name"
          name="name"
          rules={[{ required: true, message: "Please enter coursecategory name!" }]}
        >
          <Input placeholder="Enter the postcategory name" />
        </Form.Item>

        <Form.Item label="description" name="description">
          <Input.TextArea placeholder="Enter description (optional)" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Create PostCategory
          </Button>
        </Form.Item>
      </Form>
    </AdminLayout>
  );
};

export default CreatePostCategory;
