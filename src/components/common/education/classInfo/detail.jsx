import React, { useState, useEffect, useMemo } from "react";
import { Card, Descriptions, Button, Space, message, Tag } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import { getClassById } from "../../../../api/education/classInfo";
import { RollbackOutlined, EditOutlined } from "@ant-design/icons";

const ClassDetail = ({
  basePath,
  customPermissions,
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Xác định basePath dựa theo role
  const effectiveBasePath = useMemo(() => {
    if (basePath) return basePath;

    switch (user?.role) {
      case "admin":
        return "/admin";
      case "staff":
        return "/staff";
      case "tutor":
        return "/tutor";
      case "student":
        return "/student";
      default:
        return "/";
    }
  }, [basePath, user?.role]);

  // Xác định permissions dựa vào role
  const permissions = useMemo(() => {
    if (customPermissions) return customPermissions;

    switch (user?.role) {
      case "admin":
      case "staff":
        return {
          canView: true,
          canEdit: true,
        };
      default:
        return {
          canView: true,
          canEdit: false,
        };
    }
  }, [customPermissions, user?.role]);

  useEffect(() => {
    const fetchClassDetail = async () => {
      try {
        setLoading(true);
        const data = await getClassById(id);
        setClassInfo(data);
      } catch (error) {
        message.error("Failed to load class details");
        console.error("Error fetching class:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClassDetail();
  }, [id]);

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "green";
      case "closed":
        return "red";
      case "in progress":
        return "blue";
      default:
        return "default";
    }
  };

  if (loading) {
    return <Card loading={true} />;
  }

  if (!classInfo) {
    return (
      <Card>
        <div>Class not found</div>
      </Card>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Button
          icon={<RollbackOutlined />}
          onClick={() => navigate(`${effectiveBasePath}/classInfo`)}
        >
          Back to List
        </Button>
      </div>
      <Descriptions bordered column={2}>
        <Descriptions.Item label="Code">
          <Tag>{classInfo.code}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Name">{classInfo.name}</Descriptions.Item>
        <Descriptions.Item label="Course">
          <Tag color="purple">
            {classInfo.course_id?.code} - {classInfo.course_id?.name}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={getStatusColor(classInfo.status)}>
            {classInfo.status?.toUpperCase()}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Maximum Students">
          {classInfo.max_students || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Current Enrollment">
          {classInfo.enrollment_count || 0}
        </Descriptions.Item>
        <Descriptions.Item label="Start Date">
          {classInfo.start_date
            ? new Date(classInfo.start_date).toLocaleDateString()
            : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="End Date">
          {classInfo.end_date
            ? new Date(classInfo.end_date).toLocaleDateString()
            : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Created At">
          {classInfo.createdAt
            ? new Date(classInfo.createdAt).toLocaleString()
            : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Updated At">
          {classInfo.updatedAt
            ? new Date(classInfo.updatedAt).toLocaleString()
            : "-"}
        </Descriptions.Item>
      </Descriptions>

      <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-start" }}>
        {permissions.canEdit && (
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`${effectiveBasePath}/classInfo/${id}/edit`)}
          >
            Edit
          </Button>
        )}
      </div>
    </div>
  );
};

export default ClassDetail;