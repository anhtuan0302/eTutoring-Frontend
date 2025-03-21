import React, { useState } from "react";
import { Form, Input, Button, message, Modal } from "antd";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { createDepartment } from "../../../../api/education/department";
import AdminLayout from "../../../../components/layouts/admin/layout";

const CreateDepartment = () => {
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate(); // Khai báo useNavigate

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await createDepartment(values);

      if (response.error) {
        setErrorMessage(response.error);
        setIsModalVisible(true);
      } else {
        message.success("Department created successfully!");
        setTimeout(() => {
          navigate("/admin/department"); // Chuyển hướng sau 1 giây
        }, 1000);
      }
    } catch (error) {
      const apiError = error.response?.data?.error || "Failed to create department";
      setErrorMessage(apiError);
      setIsModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Tạo Department">
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="Tên Department"
          name="name"
          rules={[{ required: true, message: "Vui lòng nhập tên department!" }]}
        >
          <Input placeholder="Nhập tên department" />
        </Form.Item>

        <Form.Item label="Mô tả" name="description">
          <Input.TextArea placeholder="Nhập mô tả (không bắt buộc)" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Tạo mới
          </Button>
        </Form.Item>
      </Form>

      {/* Modal thông báo lỗi */}
      <Modal
        title="Lỗi"
        open={isModalVisible}
        onOk={() => setIsModalVisible(false)}
        onCancel={() => setIsModalVisible(false)}
        okText="Đóng"
      >
        <p>{errorMessage}</p>
      </Modal>
    </AdminLayout>
  );
};

export default CreateDepartment;
