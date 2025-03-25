import React, { useEffect, useState } from "react";
import { Form, Input, Button, message } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { getAllClassRooms, updateClassRoom } from "../../../../api/education/classRoom";
import AdminLayout from "../../../../components/layouts/admin/layout";

const UpdateClassRoom = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchClassRoomDetails();
    }, []);

    const fetchClassRoomDetails = async () => {
        try {
            setLoading(true);
            const data = await getAllClassRooms(id);
            form.setFieldsValue(data);
        } catch (error) {
            message.error("Lỗi khi lấy thông tin lớp học!");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (values) => {
        try {
            setLoading(true);
            await updateClassRoom(id, values);
            message.success("Cập nhật lớp học thành công!");
            navigate("/admin/classroom");
        } catch (error) {
            message.error("Lỗi khi cập nhật lớp học!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <h2>Cập nhật lớp học</h2>
            <Form form={form} layout="vertical" onFinish={handleUpdate}>
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
                        Cập nhật
                    </Button>
                    <Button onClick={() => navigate("/admin/classroom")} style={{ marginLeft: 10 }}>
                        Hủy
                    </Button>
                </Form.Item>
            </Form>
        </AdminLayout>
    );
};

export default UpdateClassRoom;
