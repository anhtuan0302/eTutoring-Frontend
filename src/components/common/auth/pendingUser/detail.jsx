import React, { useState, useEffect, useMemo } from "react";
import { Card, Descriptions, Button, Space, message, Tag, Popconfirm } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import { getPendingUserById, resendInvitation } from "../../../../api/auth/pendingUser";
import { RollbackOutlined, RedoOutlined } from "@ant-design/icons";

const PendingUserDetail = ({
  basePath,
  customPermissions,
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pendingUser, setPendingUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Xác định basePath dựa theo role nếu không được cung cấp
  const effectiveBasePath = useMemo(() => {
    if (basePath) return basePath;

    switch (user?.role) {
      case "admin":
        return "/admin";
      case "staff":
        return "/staff";
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
          canResend: true,
        };
      default:
        return {
          canView: false,
          canResend: false,
        };
    }
  }, [customPermissions, user?.role]);

  const handleResend = async () => {
    try {
      await resendInvitation(id);
      message.success("Invitation resent successfully");
      // Refresh data
      const data = await getPendingUserById(id);
      setPendingUser(data);
    } catch (error) {
      message.error(error.response?.data?.error || "Error resending invitation");
    }
  };

  useEffect(() => {
    const fetchPendingUserDetail = async () => {
      try {
        setLoading(true);
        const data = await getPendingUserById(id);
        setPendingUser(data);
      } catch (error) {
        message.error("Failed to load pending user details");
        console.error("Error fetching pending user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingUserDetail();
  }, [id]);

  if (loading) {
    return <Card loading={true} />;
  }

  if (!pendingUser) {
    return (
      <Card>
        <div>Pending user not found</div>
      </Card>
    );
  }

  const getRoleTag = (role) => {
    const colors = {
      admin: "red",
      staff: "blue",
      tutor: "green",
      student: "orange",
    };
    return (
      <Tag color={colors[role]}>
        {role.toUpperCase()}
      </Tag>
    );
  };

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
          onClick={() => navigate(`${effectiveBasePath}/pendingUser`)}
        >
          Back to List
        </Button>
      </div>
      <Descriptions bordered column={2}>
        <Descriptions.Item label="Full Name" span={1}>
          {`${pendingUser.first_name} ${pendingUser.last_name}`}
        </Descriptions.Item>
        <Descriptions.Item label="Email" span={1}>
          {pendingUser.email}
        </Descriptions.Item>
        
        <Descriptions.Item label="Phone Number" span={1}>
          {pendingUser.phone_number || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Role" span={1}>
          {getRoleTag(pendingUser.role)}
        </Descriptions.Item>
  
        {pendingUser.role !== 'admin' ? (
          <Descriptions.Item label="Department" span={1}>
            {pendingUser.department_id?.name || "-"}
          </Descriptions.Item>
        ) : (
          <Descriptions.Item label="Department" span={1}>
            -
          </Descriptions.Item>
        )}
  
        <Descriptions.Item label="Invitation Status" span={1}>
          <Tag color={new Date(pendingUser.invitation_expires_at) > new Date() ? "green" : "red"}>
            {new Date(pendingUser.invitation_expires_at) > new Date() ? "ACTIVE" : "EXPIRED"}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Invitation Sent At" span={1}>
          {pendingUser.invitation_sent_at
            ? new Date(pendingUser.invitation_sent_at).toLocaleString()
            : "-"}
        </Descriptions.Item>
  
        <Descriptions.Item label="Invitation Expires At" span={1}>
          {pendingUser.invitation_expires_at
            ? new Date(pendingUser.invitation_expires_at).toLocaleString()
            : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Created At" span={1}>
          {pendingUser.createdAt
            ? new Date(pendingUser.createdAt).toLocaleString()
            : "-"}
        </Descriptions.Item>
  
        <Descriptions.Item label="Updated At" span={1}>
          {pendingUser.updatedAt
            ? new Date(pendingUser.updatedAt).toLocaleString()
            : "-"}
        </Descriptions.Item>
      </Descriptions>
  
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-start' }}>
        {permissions.canResend && (
          <Popconfirm
            title="Are you sure you want to resend this invitation?"
            onConfirm={handleResend}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              icon={<RedoOutlined />}
              style={{ backgroundColor: "#faad14" }}
            >
              Resend Invitation
            </Button>
          </Popconfirm>
        )}
      </div>
    </div>
  );
};

export default PendingUserDetail;