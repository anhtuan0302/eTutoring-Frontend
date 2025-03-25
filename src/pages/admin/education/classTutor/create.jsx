import React, { useState, useEffect } from "react";
import { Form, Input, Select, Button, message } from "antd";
import AdminLayout from "../../../../components/layouts/admin/layout";
import { createClassTutor } from "../../../../api/education/classTutor";
import { getAllClassRooms } from "../../../../api/education/classRoom";
import { getTutors } from "../../../../api/user/tutor";

const { Option } = Select;

const CreateClassTutor = () => {
    const [form] = Form.useForm();
    const [classes, setClasses] = useState([]);
    const [tutors, setTutors] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const classData = await getAllClassRooms();
                const tutorData = await getTutors();
                setClasses(classData);
                setTutors(tutorData);
            } catch (error) {
                message.error("Lỗi khi tải dữ liệu");
            }
        };
        fetchData();
    }, []);

    const onFinish = async (values) => {
        try {
            setLoading(true);
            await createClassTutor(values);
            message.success("Tạo class tutor thành công!");
            form.resetFields();
        } catch (error) {
            message.error("Lỗi khi tạo class tutor");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout title="Tạo Class Tutor">
            <Form form={form} onFinish={onFinish} layout="vertical">
                <Form.Item name="class_id" label="Chọn Lớp" rules={[{ required: true }]}>
                    <Select>
                        {classes.map((cls) => (
                            <Option key={cls._id} value={cls._id}>
                                {cls.name}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item name="tutor_id" label="Chọn Tutor" rules={[{ required: true }]}>
                    <Select>
                        {tutors.map((tutor) => (
                            <Option key={tutor._id} value={tutor._id}>
                                {tutor.name}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                    Tạo
                </Button>
            </Form>
        </AdminLayout>
    );
};

export default CreateClassTutor;
