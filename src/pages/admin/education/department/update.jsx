import React, { useEffect, useState } from "react";
import { Form, Input, Button, message } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import { getDepartmentByID, updateDepartment } from "../../../../api/education/department";
import AdminLayout from "../../../../components/layouts/admin/layout";

const UpdateDepartment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [department, setDepartment] = useState(null);

  useEffect(() => {
    const fetchDepartment = async () => {
      try {
        const data = await getDepartmentByID(id);
        if (!data) {
          message.error("Không tìm thấy thông tin department");
          return;
        }
        setDepartment(data);
        form.setFieldsValue({
          name: data.name,
          description: data.description
        });
      } catch (error) {
        console.error("Chi tiết lỗi:", error);
        message.error("Lỗi khi lấy thông tin department: " + (error.response?.data?.error || error.message));
      }
    };
    
    if (id) {
      fetchDepartment();
    }
  }, [id, form]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const updateData = {
        id: id,
        name: values.name,
        description: values.description
      };
      
      await updateDepartment(updateData);
      message.success("Cập nhật department thành công!");
      navigate("/admin/department");
    } catch (error) {
      console.error("Chi tiết lỗi:", error);
      message.error("Cập nhật thất bại: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!department) {
    return <p>Đang tải dữ liệu...</p>;
  }

  return (
    <AdminLayout title="Cập nhật Department">
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="Tên Department"
          name="name"
          rules={[{ required: true, message: "Vui lòng nhập tên department!" }]}
        >
          <Input placeholder="Nhập tên department" />
        </Form.Item>

        <Form.Item label="Mô tả" name="description">
          <Input.TextArea placeholder="Nhập mô tả" />
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

export default UpdateDepartment;