import React, { useEffect, useState } from "react";
import { Table, Button, Popconfirm, message } from "antd";
import AdminLayout from "../../../../components/layouts/admin/layout";
import { getClassTutors, deleteClassTutor } from "../../../../api/education/classTutor";
import { useNavigate } from "react-router-dom";

const ListClassTutor = () => {
    const [classTutors, setClassTutors] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchClassTutors = async () => {
            try {
                const data = await getClassTutors();
                setClassTutors(data);
            } catch (error) {
                message.error("Lỗi khi lấy danh sách class tutor");
            } finally {
                setLoading(false);
            }
        };
        fetchClassTutors();
    }, []);

    const handleDelete = async (id) => {
        try {
            await deleteClassTutor(id);
            message.success("Xóa class tutor thành công!");
            setClassTutors(classTutors.filter((item) => item._id !== id));
        } catch (error) {
            message.error("Lỗi khi xóa class tutor");
        }
    };

    return (
        <AdminLayout title="Danh sách Class Tutor">
            <Table columns={[
                { title: "Lớp", dataIndex: "class_id", key: "class_id" },
                { title: "Tutor", dataIndex: "tutor_id", key: "tutor_id" },
                {
                    title: "Hành động",
                    key: "action",
                    render: (_, record) => (
                        <>
                            <Button onClick={() => navigate(`/admin/class-tutor/${record._id}`)}>Chỉnh sửa</Button>
                            <Popconfirm title="Bạn có chắc muốn xóa?" onConfirm={() => handleDelete(record._id)}>
                                <Button danger>Xóa</Button>
                            </Popconfirm>
                        </>
                    ),
                },
            ]} dataSource={classTutors} rowKey="_id" loading={loading} />
        </AdminLayout>
    );
};

export default ListClassTutor;
