import React, { useEffect, useState } from "react";
import { Table, Button, message, Space } from "antd";
import { useNavigate } from "react-router-dom";
import { getAllClassRooms, deleteClassRoom } from "../../../../api/education/classRoom";
import AdminLayout from "../../../../components/layouts/admin/layout";

const ListClassRoom = () => {
    const [classrooms, setClassrooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchClassrooms();
    }, []);

    const fetchClassrooms = async () => {
        try {
            setLoading(true);
            const data = await getAllClassRooms();
            setClassrooms(data);
        } catch (error) {
            message.error("Lỗi khi tải danh sách lớp học!");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            setLoading(true);
            await deleteClassRoom(id);
            message.success("Xóa lớp học thành công!");
            fetchClassrooms();
        } catch (error) {
            message.error("Lỗi khi xóa lớp học!");
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: "Tên lớp học",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Mô tả",
            dataIndex: "description",
            key: "description",
        },
        {
            title: "Hành động",
            key: "action",
            render: (_, record) => (
                <Space>
                    <Button onClick={() => navigate(`/admin/classroom/${record.id}`)}>Sửa</Button>
                    <Button danger onClick={() => handleDelete(record.id)}>Xóa</Button>
                </Space>
            ),
        },
    ];

    return (
        <AdminLayout>
            <h2>Danh sách lớp học</h2>
            <Button type="primary" onClick={() => navigate("/admin/classroom/create")}>
                Thêm lớp học
            </Button>
            <Table
                dataSource={classrooms}
                columns={columns}
                rowKey="id"
                loading={loading}
                style={{ marginTop: 20 }}
            />
        </AdminLayout>
    );
};

export default ListClassRoom;
