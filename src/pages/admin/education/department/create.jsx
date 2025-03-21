import React, { useState } from "react";
import { Form, Input, Button, message } from "antd";
import { useNavigate } from "react-router-dom";
import { createDepartment } from "../../../../api/education/department";
import AdminLayout from "../../../../components/layouts/admin/layout";

const CreateDepartment = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Thêm useNavigate để điều hướng

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await createDepartment(values);
      message.success("Department created successfully!");
      setTimeout(() => {
        navigate("/admin/department"); // Chuyển hướng về trang danh sách
      }); // Đợi 1 giây để người dùng thấy thông báo
    } catch (error) {
      message.error("Failed to create department");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Create Department">
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="Department Name"
          name="name"
          rules={[{ required: true, message: "Please enter department name!" }]}
        >
          <Input placeholder="Enter the department name" />
        </Form.Item>

        <Form.Item label="description" name="description">
          <Input.TextArea placeholder="Enter description (optional)" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Create Department
          </Button>
        </Form.Item>
      </Form>
    </AdminLayout>
  );
};

export default CreateDepartment;
