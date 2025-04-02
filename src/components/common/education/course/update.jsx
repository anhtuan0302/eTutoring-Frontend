import React, { useState, useMemo } from "react";
import { Form, Input, Button, message, Modal, Select } from "antd";
import { RollbackOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import { updateCourse, getCourseById } from "../../../../api/education/course";
import { getAllDepartments } from "../../../../api/organization/department";
import { useEffect } from "react";

const UpdateCourse = ({
  basePath,
  customPermissions,
}) => {
  const { id } = useParams();
  const [form] = Form.useForm();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [course, setCourse] = useState(null);

  // Xác định basePath dựa theo role
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
          canEdit: true,
        };
      default:
        return {
          canEdit: false,
        };
    }
  }, [customPermissions, user?.role]);

  // Fetch course data và departments khi component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [courseData, departmentsData] = await Promise.all([
          getCourseById(id),
          getAllDepartments()
        ]);
        
        setCourse(courseData);
        setDepartments(departmentsData);
        
        form.setFieldsValue({
          code: courseData.code,
          name: courseData.name,
          department_id: courseData.department_id?._id,
          description: courseData.description,
        });
      } catch (error) {
        message.error("Failed to load data");
        console.error("Error fetching data:", error);
        navigate(`${effectiveBasePath}/course`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, form, effectiveBasePath, navigate]);

  // Kiểm tra quyền
  useEffect(() => {
    if (!permissions.canEdit) {
      message.error("You don't have permission to edit courses");
      navigate(`${effectiveBasePath}/course`);
    }
  }, [permissions, effectiveBasePath, navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await updateCourse(id, values);
      message.success("Course updated successfully!");
      setTimeout(() => {
        navigate(`${effectiveBasePath}/course/${id}`);
      }, 1000);
    } catch (error) {
      const apiError = error.response?.data?.error || "Failed to update course";
      setErrorMessage(apiError);
      setIsModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  if (!course && !loading) {
    return <div>Course not found</div>;
  }

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
            Update Course
          </Button>
          <Button
            style={{ marginLeft: 8 }}
            onClick={() => navigate(`${effectiveBasePath}/course/${id}`)}
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

export default UpdateCourse;