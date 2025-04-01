import React, { useState, useMemo, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  message,
  Modal,
  Card,
  Typography,
  Select,
} from "antd";
import { RollbackOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import { createPendingUser } from "../../../../api/auth/pendingUser";
import { getAllDepartments } from "../../../../api/organization/department";

const { Title } = Typography;
const { Option } = Select;

const CreatePendingUser = ({
  basePath, // path prefix sẽ được tự động xác định dựa vào role nếu không được cung cấp
  customPermissions, // optional - ghi đè permissions từ role
}) => {
  const [form] = Form.useForm();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  // Xác định basePath dựa theo role nếu không được cung cấp
  const effectiveBasePath = useMemo(() => {
    if (basePath) return basePath;

    // Tự động xác định basePath dựa vào role
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
    // Nếu có customPermissions, ưu tiên sử dụng
    if (customPermissions) return customPermissions;

    // Mặc định permissions dựa vào role
    switch (user?.role) {
      case "admin":
      case "staff":
        return {
          canCreate: true,
        };
      default:
        return {
          canCreate: false,
        };
    }
  }, [customPermissions, user?.role]);

  // Xử lý khi role thay đổi
  const handleRoleChange = (value) => {
    setSelectedRole(value);
    // Reset department_id field nếu chọn role admin
    if (value === "admin") {
      form.setFieldValue("department_id", undefined);
    }
  };

  // Kiểm tra quyền - nếu không có quyền, redirect về trang list
  useEffect(() => {
    if (!permissions.canCreate) {
      message.error("You don't have permission to invite users");
      navigate(`${effectiveBasePath}/pendingUser`);
    }
  }, [permissions, effectiveBasePath, navigate]);

  // Thêm effect để load departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setDepartmentsLoading(true);
        const data = await getAllDepartments();
        setDepartments(data);
      } catch (error) {
        message.error("Failed to load departments");
        console.error("Error fetching departments:", error);
      } finally {
        setDepartmentsLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const dataToSubmit = {
        ...values,
        department_id: values.role === 'admin' ? undefined : values.department_id
      };
  
      await createPendingUser(dataToSubmit);
      message.success("Invitation sent successfully!");
      setTimeout(() => {
        navigate(`${effectiveBasePath}/pendingUser`);
      }, 1000);
    } catch (error) {
      const apiError = error.response?.data?.error || "Failed to send invitation";
      setErrorMessage(apiError);
      setIsModalVisible(true);
    } finally {
      setLoading(false);
    }
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

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="First Name"
          name="first_name"
          rules={[{ required: true, message: "Please enter first name!" }]}
        >
          <Input placeholder="Enter first name" />
        </Form.Item>

        <Form.Item
          label="Last Name"
          name="last_name"
          rules={[{ required: true, message: "Please enter last name!" }]}
        >
          <Input placeholder="Enter last name" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Please enter email!" },
            { type: "email", message: "Please enter a valid email!" },
          ]}
        >
          <Input placeholder="Enter email address" />
        </Form.Item>

        <Form.Item
          label="Phone Number"
          name="phone_number"
          rules={[
            {
              pattern: /^[0-9+\-\s()]*$/,
              message: "Please enter a valid phone number!",
            },
          ]}
        >
          <Input placeholder="Enter phone number (optional)" />
        </Form.Item>

        <Form.Item
          label="Role"
          name="role"
          rules={[{ required: true, message: "Please select a role!" }]}
        >
          <Select placeholder="Select user role" onChange={handleRoleChange}>
            {user?.role === "admin" && <Option value="admin">Admin</Option>}
            <Option value="staff">Staff</Option>
            <Option value="tutor">Tutor</Option>
            <Option value="student">Student</Option>
          </Select>
        </Form.Item>

        {selectedRole !== "admin" && (
          <Form.Item
            label="Department"
            name="department_id"
            rules={[
              {
                required: selectedRole !== "admin",
                message: "Please select a department!",
              },
            ]}
          >
            <Select
              placeholder="Select department"
              loading={departmentsLoading}
            >
              {departments.map((dept) => (
                <Option key={dept._id} value={dept._id}>
                  {dept.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Send Invitation
          </Button>
          <Button
            style={{ marginLeft: 8 }}
            onClick={() => navigate(`${effectiveBasePath}/pendingUser`)}
          >
            Cancel
          </Button>
        </Form.Item>
      </Form>

      {/* Modal thông báo lỗi */}
      <Modal
        title="Error"
        open={isModalVisible}
        onOk={() => setIsModalVisible(false)}
        onCancel={() => setIsModalVisible(false)}
        okText="Close"
      >
        <p>{errorMessage}</p>
      </Modal>
    </div>
  );
};

export default CreatePendingUser;
