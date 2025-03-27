import React, { useState, useMemo } from "react";
import { Form, Input, Button, message, Modal, Card, Typography } from "antd";
import { RollbackOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import {
  createDepartment,
  getDepartmentById,
} from "../../../../api/organization/department";
import { useEffect } from "react";

const { Title } = Typography;

const CreateDepartment = ({
  departmentId, // Nếu có, sẽ là chế độ edit. Nếu không có, sẽ là chế độ create
  basePath, // path prefix sẽ được tự động xác định dựa vào role nếu không được cung cấp
  customPermissions, // optional - ghi đè permissions từ role
}) => {
  const [form] = Form.useForm();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [initialValues, setInitialValues] = useState(null);

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
          canCreate: true,
          canEdit: true,
        };
      case "tutor":
      case "student":
      default:
        return {
          canCreate: false,
          canEdit: false,
        };
    }
  }, [customPermissions, user?.role]);

  // Fetch department data nếu ở chế độ edit
  useEffect(() => {
    const fetchDepartment = async () => {
      if (!departmentId) return;

      try {
        setLoading(true);
        const data = await getDepartmentById(departmentId);
        setInitialValues(data);
        form.setFieldsValue({
          name: data.name,
          description: data.description,
        });
      } catch (error) {
        message.error("Failed to load department data");
        console.error("Error fetching department:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartment();
  }, [departmentId, form]);

  // Xác định chế độ (create/edit)
  const isEditMode = !!departmentId;

  // Kiểm tra quyền - nếu không có quyền, redirect về trang list
  useEffect(() => {
    if (
      (isEditMode && !permissions.canEdit) ||
      (!isEditMode && !permissions.canCreate)
    ) {
      message.error("You don't have permission to access this page");
      navigate(`${effectiveBasePath}/department`);
    }
  }, [isEditMode, permissions, effectiveBasePath, navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await createDepartment(values);
      message.success("Department created successfully!");
      setTimeout(() => {
        navigate(`${effectiveBasePath}/department`);
      }, 1000);
    } catch (error) {
      const apiError =
        error.response?.data?.error ||
        `Failed to ${isEditMode ? "update" : "create"} department`;
      setErrorMessage(apiError);
      setIsModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

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
        initialValues={initialValues}
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
            {isEditMode ? "Update Department" : "Create Department"}
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

export default CreateDepartment;
