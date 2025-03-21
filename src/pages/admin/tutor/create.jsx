import React, { useState } from "react";
import { Form, Input, Button, message, Modal } from "antd";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { createTutor } from "../../../../api/user/tutor"; // Sửa hàm API đúng
import AdminLayout from "../../../../components/layouts/admin/layout"; // Đổi thành AdminLayout

const CreateTutor = () => {
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate(); // Khai báo useNavigate

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await createTutor(values);

      if (response.error) {
        setErrorMessage(response.error);
        setIsModalVisible(true);
      } else {
        message.success("Tutor created successfully!");
        setTimeout(() => {
          navigate("/admin/tutor"); // Chuyển hướng đúng đường dẫn
        }, 1000);
      }
    } catch (error) {
      const apiError = error.response?.data?.error || "Failed to create tutor";
      setErrorMessage(apiError);
      setIsModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Tạo Tutor"> {/* Đổi thành AdminLayout */}
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="Tên Tutor"
          name="name"
          rules={[{ required: true, message: "Vui lòng nhập tên tutor!" }]}
        >
          <Input placeholder="Nhập tên tutor" />
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

export default CreateTutor;
