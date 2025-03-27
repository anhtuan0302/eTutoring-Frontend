import React, { useState, useMemo } from "react";
import { Form, Input, Button, message, Modal, Card, Typography } from "antd";
import { RollbackOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import {
  updateDepartment,
  getDepartmentById,
} from "../../../../api/organization/department";
import { useEffect } from "react";

const { Title } = Typography;

const UpdateDepartment = ({
  basePath, // path prefix sẽ được tự động xác định dựa vào role nếu không được cung cấp
  customPermissions, // optional - ghi đè permissions từ role
}) => {
  const { id } = useParams(); // Lấy id từ URL
  const [form] = Form.useForm();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [department, setDepartment] = useState(null);

  // Xác định basePath dựa theo role nếu không được cung cấp
  const effectiveBasePath = useMemo(() => {
    if (basePath) return basePath;

    // Tự động xác định basePath dựa vào role
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
    // Nếu có customPermissions, ưu tiên sử dụng
    if (customPermissions) return customPermissions;

    // Mặc định permissions dựa vào role
    switch (user?.role) {
      case "admin":
      case "staff":
        return {
          canEdit: true,
        };
      case "tutor":
      case "student":
      default:
        return {
          canEdit: false,
        };
    }
  }, [customPermissions, user?.role]);

  // Fetch department data khi component mount
  useEffect(() => {
    const fetchDepartment = async () => {
      try {
        setLoading(true);
        const data = await getDepartmentById(id);
        setDepartment(data);
        form.setFieldsValue({
          name: data.name,
          description: data.description,
        });
      } catch (error) {
        message.error("Failed to load department data");
        console.error("Error fetching department:", error);
        navigate(`${effectiveBasePath}/department`);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartment();
  }, [id, form, effectiveBasePath, navigate]);

  // Kiểm tra quyền - nếu không có quyền edit, redirect về trang list
  useEffect(() => {
    if (!permissions.canEdit) {
      message.error("You don't have permission to edit departments");
      navigate(`${effectiveBasePath}/department`);
    }
  }, [permissions, effectiveBasePath, navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await updateDepartment(id, values);
      message.success("Department updated successfully!");
      setTimeout(() => {
        navigate(`${effectiveBasePath}/department/${id}`);
      }, 1000);
    } catch (error) {
      const apiError = error.response?.data?.error || "Failed to update department";
      setErrorMessage(apiError);
      setIsModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  if (!department && !loading) {
    return <div>Department not found</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          icon={<RollbackOutlined />}
          onClick={() => navigate(`${effectiveBasePath}/department`)}
        >
          Back to List
        </Button>
      </div>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={department}
        >
          <Form.Item
            label="Department Name"
            name="name"
            rules={[{ required: true, message: "Please enter department name!" }]}
          >
            <Input placeholder="Enter the department name" />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea rows={4} placeholder="Enter description (optional)" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Update Department
            </Button>
            <Button
              style={{ marginLeft: 8 }}
              onClick={() => navigate(`${effectiveBasePath}/department`)}
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

export default UpdateDepartment;