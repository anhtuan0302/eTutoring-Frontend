import React, { useState } from "react";
import { Form, Input, Button, message } from "antd";
import { useNavigate } from "react-router-dom";
import { createClassRoom } from "../../../../api/education/classRoom";
import AdminLayout from "../../../../components/layouts/admin/layout";

const CreateClassRoom = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleCreate = async (values) => {
        try {
            setLoading(true);
            await createClassRoom(values);
            message.success("Tạo lớp học thành công!");
            navigate("/admin/classroom");
        } catch (error) {
            message.error("Lỗi khi tạo lớp học!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <h2>Thêm lớp học</h2>
            <Form form={form} layout="vertical" onFinish={handleCreate}>
                <Form.Item
                    label="Tên lớp học"
                    name="name"
                    rules={[{ required: true, message: "Vui lòng nhập tên lớp học!" }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Mô tả"
                    name="description"
                    rules={[{ required: true, message: "Vui lòng nhập mô tả lớp học!" }]}
                >
                    <Input.TextArea />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        Thêm mới
                    </Button>
                    <Button onClick={() => navigate("/admin/classroom")} style={{ marginLeft: 10 }}>
                        Hủy
                    </Button>
                </Form.Item>
            </Form>
        </AdminLayout>
    );
};

export default CreateClassRoom;
