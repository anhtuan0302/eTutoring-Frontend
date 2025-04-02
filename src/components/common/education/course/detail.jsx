import React, { useState, useEffect, useMemo } from "react";
import { Card, Descriptions, Button, message } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import { getCourseById } from "../../../../api/education/course";
import { RollbackOutlined, EditOutlined } from "@ant-design/icons";

const CourseDetail = ({
  basePath,
  customPermissions,
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
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
    const fetchCourseDetail = async () => {
      try {
        setLoading(true);
        const data = await getCourseById(id);
        setCourse(data);
      } catch (error) {
        message.error("Failed to load course details");
        console.error("Error fetching course:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetail();
  }, [id]);

  if (loading) {
    return <Card loading={true} />;
  }

  if (!course) {
    return (
      <Card>
        <div>Course not found</div>
      </Card>
    );
  }

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Button
          icon={<RollbackOutlined />}
          onClick={() => navigate(`${effectiveBasePath}/course`)}
        >
          Back to List
        </Button>
      </div>
      <Descriptions bordered column={2}>
        <Descriptions.Item label="Code">{course.code}</Descriptions.Item>
        <Descriptions.Item label="Name">{course.name}</Descriptions.Item>
        <Descriptions.Item label="Department">
          {course.department_id?.name || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Description">
          {course.description || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Created At">
          {course.createdAt
            ? new Date(course.createdAt).toLocaleString()
            : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Updated At">
          {course.updatedAt
            ? new Date(course.updatedAt).toLocaleString()
            : "-"}
        </Descriptions.Item>
      </Descriptions>
      <div
        style={{
          marginTop: 16,
          display: "flex",
          justifyContent: "flex-start",
        }}
      >
        {permissions.canEdit && (
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`${effectiveBasePath}/course/${id}/edit`)}
          >
            Edit
          </Button>
        )}
      </div>
    </div>
  );
};

export default CourseDetail;