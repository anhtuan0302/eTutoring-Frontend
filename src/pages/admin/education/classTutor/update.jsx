import React, { useEffect, useState } from "react";
import { Form, Input, Button, message, Select } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { getClassTutorById, updateClassTutor } from "../../../../api/education/classTutor"; // API lấy dữ liệu và cập nhật
import AdminLayout from "../../../../components/layouts/admin/layout";

const { Option } = Select;

const UpdateClassTutor = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { id } = useParams(); // Lấy ID từ URL
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClassTutor = async () => {
      try {
        setLoading(true);
        const data = await getClassTutorById(id);
        form.setFieldsValue({
          class_id: data.class_id,
          tutor_id: data.tutor_id,
          is_primary: data.is_primary,
        });
      } catch (error) {
        message.error("Lỗi khi lấy dữ liệu ClassTutor");
      } finally {
        setLoading(false);
      }
    };
    fetchClassTutor();
  }, [id, form]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await updateClassTutor(id, values);
      message.success("Cập nhật ClassTutor thành công!");
      navigate("/admin/class_tutor/list");
    } catch (error) {
      message.error("Lỗi khi cập nhật ClassTutor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Cập nhật ClassTutor">
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="ID Lớp học"
          name="class_id"
          rules={[{ required: true, message: "Vui lòng nhập ID lớp học!" }]}
        >
          <Input placeholder="Nhập ID lớp học" />
        </Form.Item>

        <Form.Item
          label="ID Tutor"
          name="tutor_id"
          rules={[{ required: true, message: "Vui lòng nhập ID Tutor!" }]}
        >
          <Input placeholder="Nhập ID Tutor" />
        </Form.Item>

        <Form.Item
          label="Loại Tutor"
          name="is_primary"
          rules={[{ required: true, message: "Vui lòng chọn loại Tutor!" }]}
        >
          <Select placeholder="Chọn loại Tutor">
            <Option value={true}>Primary</Option>
            <Option value={false}>Not Primary</Option>
          </Select>
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

export default UpdateClassTutor;
