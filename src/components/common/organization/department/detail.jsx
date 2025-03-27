import React, { useState, useEffect, useMemo } from "react";
import { Card, Descriptions, Button, Space, message } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import { getDepartmentById } from "../../../../api/organization/department";
import { RollbackOutlined, EditOutlined } from "@ant-design/icons";

const DepartmentDetail = ({
  basePath, // path prefix sẽ được tự động xác định dựa vào role nếu không được cung cấp
  customPermissions, // optional - ghi đè permissions từ role
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);

  // Xác định basePath dựa theo role nếu không được cung cấp
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
      case "tutor":
      case "student":
      default:
        return {
          canView: true,
          canEdit: false,
        };
    }
  }, [customPermissions, user?.role]);

  useEffect(() => {
    const fetchDepartmentDetail = async () => {
      try {
        setLoading(true);
        const data = await getDepartmentById(id);
        setDepartment(data);
      } catch (error) {
        message.error("Failed to load department details");
        console.error("Error fetching department:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartmentDetail();
  }, [id]);

  if (loading) {
    return <Card loading={true} />;
  }

  if (!department) {
    return (
      <Card>
        <div>Department not found</div>
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
          onClick={() => navigate(`${effectiveBasePath}/department`)}
        >
          Back to List
        </Button>
      </div>
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Name">{department.name}</Descriptions.Item>
        <Descriptions.Item label="Description">
          {department.description || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Created At">
          {department.createdAt
            ? new Date(department.createdAt).toLocaleString()
            : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Updated At">
          {department.updatedAt
            ? new Date(department.updatedAt).toLocaleString()
            : "-"}
        </Descriptions.Item>
      </Descriptions>
      <div
        style={{
          marginTop: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {permissions.canEdit && (
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() =>
              navigate(`${effectiveBasePath}/department/${id}/edit`)
            }
          >
            Edit
          </Button>
        )}
      </div>
    </div>
  );
};

export default DepartmentDetail;
