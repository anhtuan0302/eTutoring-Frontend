import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Avatar,
  Typography,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Tooltip,
  Upload,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  LogoutOutlined,
  DeleteOutlined,
  CameraOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../../AuthContext";
import {
  getUserLoginHistory,
  clearUserLoginHistory,
  deleteLoginHistory,
} from "../../../api/auth/loginHistory";
import { changePassword, updateAvatar } from "../../../api/auth/user";
import { staticURL } from "../../../api/config";
const { Title, Text } = Typography;

const LocationCell = ({ ip }) => {
  const [location, setLocation] = useState("Loading...");

  useEffect(() => {
    const getLocation = async () => {
      // Xử lý IP đặc biệt
      if (ip === "::1" || ip === "127.0.0.1") {
        setLocation("Local Machine");
        return;
      }

      if (
        ip.startsWith("10.") ||
        ip.startsWith("172.16.") ||
        ip.startsWith("192.168.")
      ) {
        setLocation("Internal Network");
        return;
      }

      try {
        const response = await fetch(`https://ipapi.co/${ip}/json/`);
        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        const locationStr =
          `${data.city || ""} ${data.country_name || ""}`.trim() || "Unknown";
        setLocation(locationStr);
      } catch (error) {
        console.error("Error fetching location:", error);
        setLocation("Unknown");
      }
    };

    getLocation();
  }, [ip]);

  return (
    <Space>
      <span>{location}</span>
    </Space>
  );
};

const Profile = ({ basePath, customPermissions }) => {
  const { user, logout } = useAuth();
  const [loginHistory, setLoginHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isChangePasswordVisible, setIsChangePasswordVisible] = useState(false);
  const [changePasswordForm] = Form.useForm();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);

  // Xác định basePath
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

  // Xác định permissions
  const permissions = useMemo(() => {
    if (customPermissions) return customPermissions;

    switch (user?.role) {
      case "admin":
      case "staff":
      case "tutor":
        return {
          canUpdateAvatar: true,
        };
      default:
        return {
          canUpdateAvatar: false,
        };
    }
  }, [customPermissions, user?.role]);

  // Fetch login history
  useEffect(() => {
    const fetchLoginHistory = async () => {
      try {
        setLoading(true);
        const data = await getUserLoginHistory(user._id);
        setLoginHistory(data);
      } catch (error) {
        console.error("Error fetching login history:", error);
        message.error("Failed to load login history");
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) {
      fetchLoginHistory();
    }
  }, [user?._id]);

  // Avatar upload handlers
  const beforeUpload = (file) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("You can only upload image files!");
      return false;
    }

    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error("Image must be smaller than 5MB!");
      return false;
    }

    return true;
  };

  const handleAvatarChange = async (info) => {
    if (!permissions.canUpdateAvatar) {
      message.error("You do not have permission to update avatar");
      return;
    }

    const file = info.file;

    // Kiểm tra file trước khi upload
    const isValid = beforeUpload(file);
    if (!isValid) {
      return;
    }

    try {
      setUploadLoading(true);
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await updateAvatar(formData);
      message.success("Avatar updated successfully");
      window.location.reload();
    } catch (error) {
      console.error("Error updating avatar:", error);
      message.error(error.response?.data?.error || "Failed to update avatar");
    } finally {
      setUploadLoading(false);
    }
  };

  const handlePreview = async (file) => {
    if (file.url) {
      setPreviewImage(file.url);
    } else {
      setPreviewImage(URL.createObjectURL(file.originFileObj));
    }
    setPreviewOpen(true);
  };

  // Handle password change
  const handlePasswordChange = async (values) => {
    try {
      await changePassword(values);
      message.success("Password changed successfully");
      setIsChangePasswordVisible(false);
      changePasswordForm.resetFields();
    } catch (error) {
      console.error("Password change error:", error);
      // Hiển thị lỗi chi tiết từ server nếu có
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to change password";
      message.error(errorMessage);
    }
  };

  const handleDeviceLogout = async (record) => {
    try {
      console.log("Logging out device:", record);
      const isCurrentDevice =
        record.ipaddress === "::1" ||
        record.ipaddress === "127.0.0.1" ||
        record.ipaddress === window.location.hostname;

      if (isCurrentDevice) {
        // Đối với thiết bị hiện tại, xử lý trực tiếp không cần Modal
        try {
          console.log("Deleting current device history...");
          await deleteLoginHistory(record._id);
          console.log("Current device history deleted");

          console.log("Logging out...");
          await logout();
          message.success("Logged out successfully");
          window.location.href = "/login";
        } catch (error) {
          console.error("Error logging out current device:", error);
          message.error(
            "Failed to logout: " +
              (error.response?.data?.error || error.message)
          );
        }
      } else {
        // Đối với thiết bị khác
        console.log("Deleting other device history:", record._id);
        await deleteLoginHistory(record._id);
        console.log("Other device history deleted");

        // Refresh lại danh sách
        const data = await getUserLoginHistory(user._id);
        setLoginHistory(data);
        message.success("Device logged out successfully");
      }
    } catch (error) {
      console.error("Error in handleDeviceLogout:", error);
      message.error(
        error.response?.data?.error || "Failed to handle device logout"
      );
    }
  };

  const handleAllDevicesLogout = async () => {
    try {
      console.log('Clearing all login history for user:', user._id);
      await clearUserLoginHistory(user._id);
      console.log('All login history cleared');
      
      console.log('Logging out current user...');
      await logout();
      
      message.success("Logged out from all devices successfully");
      window.location.href = "/login";
    } catch (error) {
      console.error("Error in handleAllDevicesLogout:", error);
      message.error(error.response?.data?.error || "Failed to logout from all devices");
    }
  };

  // Login history columns
  const columns = useMemo(
    () => [
      {
        title: "Device/Browser",
        dataIndex: "browser",
        key: "browser",
        width: 350,
        render: (browser) => {
          const browserInfo = browser?.split(") ").pop() || "Unknown Device";
          const deviceInfo =
            browser?.split(") ")[0]?.replace("Mozilla/5.0 (", "") || "";
          const fullInfo = deviceInfo
            ? `${deviceInfo} - ${browserInfo}`
            : browserInfo;
          return (
            <Tooltip placement="topLeft" title={browser}>
              <span>{fullInfo}</span>
            </Tooltip>
          );
        },
      },
      {
        title: "IP Address",
        dataIndex: "ipaddress",
        key: "ipaddress",
        width: 120,
        render: (ip) => (
          <Tooltip placement="top" title={ip}>
            <span>{ip}</span>
          </Tooltip>
        ),
      },
      {
        title: "Location",
        key: "location",
        width: 150,
        render: (_, record) => <LocationCell ip={record.ipaddress} />,
      },
      {
        title: "Login Time",
        dataIndex: "history_time",
        key: "history_time",
        width: 180,
        render: (date) => new Date(date).toLocaleString(),
        sorter: (a, b) => new Date(b.history_time) - new Date(a.history_time),
      },
      {
        title: "Actions",
        key: "actions",
        width: 100,
        render: (_, record) => (
          <Button
            type="primary"
            danger
            icon={<LogoutOutlined />}
            size="small"
            onClick={() => handleDeviceLogout(record)}
          >
            Logout
          </Button>
        ),
      },
    ],
    [handleDeviceLogout]
  );

  return (
    <div style={{ padding: "24px" }}>
      {/* Profile Information Card */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={24} align="middle">
          <Col xs={24} sm={8} md={6} lg={4} style={{ textAlign: "center" }}>
            <Tooltip title={permissions.canUpdateAvatar ? "Change avatar" : ""}>
              <Upload
                accept="image/jpeg,image/png,image/gif,image/webp"
                showUploadList={false}
                beforeUpload={() => false} // Chỉ cần return false để ngăn upload tự động
                onChange={handleAvatarChange}
                disabled={!permissions.canUpdateAvatar || uploadLoading}
              >
                <div style={{ position: "relative", display: "inline-block" }}>
                  <Avatar
                    size={120}
                    src={
                      user?.avatar_path
                        ? `${staticURL}/${user.avatar_path}`
                        : null
                    }
                    icon={<UserOutlined />}
                    style={{
                      cursor: permissions.canUpdateAvatar
                        ? "pointer"
                        : "default",
                      border: "2px solid #f0f0f0",
                    }}
                  />
                  {permissions.canUpdateAvatar && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        background: "#1890ff",
                        borderRadius: "50%",
                        padding: "4px",
                        color: "#fff",
                        cursor: "pointer",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "24px",
                        height: "24px",
                      }}
                    >
                      {uploadLoading ? <LoadingOutlined /> : <CameraOutlined />}
                    </div>
                  )}
                </div>
              </Upload>
            </Tooltip>
          </Col>
          <Col xs={24} sm={16} md={18} lg={20}>
            <Title level={2}>{`${user?.first_name} ${user?.last_name}`}</Title>
            <Space direction="vertical" size="small">
              <Text>Email: {user?.email}</Text>
              <Text>Phone: {user?.phone_number || "Not provided"}</Text>
              <Text>
                Role: <Tag color="blue">{user?.role?.toUpperCase()}</Tag>
              </Text>
              {user?.profile?.department_id && (
                <Text>Department: {user?.profile?.department_id?.name}</Text>
              )}
            </Space>
            <div style={{ marginTop: 16 }}>
              <Button
                type="primary"
                icon={<LockOutlined />}
                onClick={() => setIsChangePasswordVisible(true)}
              >
                Change Password
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Login History Card */}
      <Card
        title="Login History"
        extra={
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={handleAllDevicesLogout}
          >
            Logout All Devices
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={loginHistory}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} login records`,
          }}
        />
      </Card>

      {/* Preview Modal */}
      <Modal
        open={previewOpen}
        title="Avatar Preview"
        footer={null}
        onCancel={() => setPreviewOpen(false)}
      >
        <img alt="Avatar" style={{ width: "100%" }} src={previewImage} />
      </Modal>

      {/* Change Password Modal */}
      <Modal
        title="Change Password"
        open={isChangePasswordVisible}
        onCancel={() => {
          setIsChangePasswordVisible(false);
          changePasswordForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={changePasswordForm}
          onFinish={handlePasswordChange}
          layout="vertical"
        >
          <Form.Item
            name="current_password"
            label="Current Password"
            rules={[
              {
                required: true,
                message: "Please input your current password!",
              },
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            name="new_password"
            label="New Password"
            rules={[
              { required: true, message: "Please input your new password!" },
              { min: 6, message: "Password must be at least 6 characters!" },
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            name="confirm_password"
            label="Confirm Password"
            dependencies={["new_password"]}
            rules={[
              { required: true, message: "Please confirm your password!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("new_password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match!"));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button
                onClick={() => {
                  setIsChangePasswordVisible(false);
                  changePasswordForm.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Change Password
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Profile;
