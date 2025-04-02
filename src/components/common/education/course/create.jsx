import React, { useState, useMemo } from "react";
import { Form, Input, Button, message, Modal, Select } from "antd";
import { RollbackOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import { createCourse } from "../../../../api/education/course";
import { getAllDepartments } from "../../../../api/organization/department";
import { useEffect } from "react";

const CreateCourse = ({
  courseId,
  basePath,
  customPermissions,
}) => {
  const [form] = Form.useForm();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
          canCreate: true,
          canEdit: true,
        };
      default:
        return {
          canCreate: false,
          canEdit: false,
        };
    }
  }, [customPermissions, user?.role]);

  // Fetch departments for select input
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await getAllDepartments();
        setDepartments(data);
      } catch (error) {
        message.error("Failed to load departments");
        console.error("Error fetching departments:", error);
      }
    };

    fetchDepartments();
  }, []);

  // Kiểm tra quyền
  useEffect(() => {
    if (!permissions.canCreate) {
      message.error("You don't have permission to access this page");
      navigate(`${effectiveBasePath}/course`);
    }
  }, [permissions, effectiveBasePath, navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await createCourse(values);
      message.success("Course created successfully!");
      setTimeout(() => {
        navigate(`${effectiveBasePath}/course`);
      }, 1000);
    } catch (error) {
      const apiError = error.response?.data?.error || "Failed to create course";
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
          onClick={() => navigate(`${effectiveBasePath}/course`)}
        >
          Back to List
        </Button>
      </div>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item
          label="Course Code"
          name="code"
          rules={[
            { required: true, message: "Please enter course code!" },
            { max: 100, message: "Course code cannot exceed 100 characters!" }
          ]}
        >
          <Input placeholder="Enter the course code" />
        </Form.Item>

        <Form.Item
          label="Course Name"
          name="name"
          rules={[
            { required: true, message: "Please enter course name!" },
            { max: 100, message: "Course name cannot exceed 100 characters!" }
          ]}
        >
          <Input placeholder="Enter the course name" />
        </Form.Item>

        <Form.Item
          label="Department"
          name="department_id"
          rules={[{ required: true, message: "Please select a department!" }]}
        >
          <Select
            placeholder="Select a department"
            options={departments.map(dept => ({
              value: dept._id,
              label: dept.name
            }))}
          />
        </Form.Item>

        <Form.Item 
          label="Description" 
          name="description"
        >
          <Input.TextArea rows={4} placeholder="Enter description (optional)" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Create Course
          </Button>
          <Button
            style={{ marginLeft: 8 }}
            onClick={() => navigate(`${effectiveBasePath}/course`)}
          >
            Cancel
          </Button>
        </Form.Item>
      </Form>

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

export default CreateCourse;