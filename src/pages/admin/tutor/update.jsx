import React, { useEffect, useState } from "react";
import { Form, Input, Button, message } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../../../components/layouts/tutor/layout";
import { getTutorByID, updateTutor } from "../../../../api/user/tutor";

const UpdateTutor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tutor, setTutor] = useState(null);

  useEffect(() => {
    const fetchTutor = async () => {
      try {
        const data = await getTutorByID(id);
        setTutor(data);
        form.setFieldsValue(data);
      } catch (error) {
        message.error("Lỗi khi lấy thông tin tutor");
      }
    };

    if (id) {
      fetchTutor();
    }
  }, [id, form]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await updateTutor({ id, ...values });
      message.success("Cập nhật tutor thành công!");
      navigate("/admin/tutor");
    } catch (error) {
      message.error("Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  if (!tutor) {
    return <p>Đang tải dữ liệu...</p>;
  }

  return (
    <AdminLayout title="Cập nhật Tutor">
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="Tên Tutor"
          name="name"
          rules={[{ required: true, message: "Vui lòng nhập tên tutor!" }]}
        >
          <Input placeholder="Nhập tên tutor" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Vui lòng nhập email!" },
            { type: "email", message: "Email không hợp lệ!" },
          ]}
        >
          <Input placeholder="Nhập email" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Cập nhật
          </Button>
        </Form.Item>
      </Form>
    </AdminLayout>
  );
};

export default UpdateTutor;