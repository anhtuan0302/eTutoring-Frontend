import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Descriptions, Button, Spin, message, Tag, Space } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import AdminLayout from "../../../../components/layouts/admin/layout";
import { getDepartmentByID } from "../../../../api/education/department";

const DepartmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepartmentDetail = async () => {
      try {
        setLoading(true);
        const data = await getDepartmentByID(id);
        setDepartment(data);
      } catch (error) {
        console.error("Error fetching department:", error);
        message.error("Failed to load department details");
      } finally {
        setLoading(false);
      }
    };

    fetchDepartmentDetail();
  }, [id]);

  if (loading) {
    return (
      <AdminLayout title="Department Detail">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Department Detail">
      <Card
        title={
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate("/admin/department")}
            >
              Back
            </Button>
            <span>Department Information</span>
          </Space>
        }
        extra={
          <Button 
            type="primary" 
            onClick={() => navigate(`/admin/department/${id}`)}
          >
            Edit
          </Button>
        }
      >
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Name">
            {department?.name}
          </Descriptions.Item>
          <Descriptions.Item label="Description">
            {department?.description || 'No description'}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={department?.is_deleted ? "red" : "green"}>
              {department?.is_deleted ? "Inactive" : "Active"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Created At">
            {department?.createdAt ? new Date(department.createdAt).toLocaleString() : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Updated At">
            {department?.updatedAt ? new Date(department.updatedAt).toLocaleString() : 'N/A'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </AdminLayout>
  );
};

export default DepartmentDetail;
