import React, { useState, useMemo } from "react";
import { Form, Button, message, Modal, Select, Row, Col } from "antd";
import { RollbackOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import { enrollStudent } from "../../../../api/education/enrollment";
import { getAllClasses } from "../../../../api/education/classInfo";
import { getAllStudents } from "../../../../api/organization/student";
import { useEffect } from "react";

const CreateEnrollment = ({ basePath, customPermissions }) => {
  const [form] = Form.useForm();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
          canCreate: true,
        };
      default:
        return {
          canCreate: false,
        };
    }
  }, [customPermissions, user?.role]);

  // Fetch classes và students data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classesData, studentsData] = await Promise.all([
          getAllClasses(),
          getAllStudents()
        ]);
        setClasses(classesData);
        setStudents(studentsData);
      } catch (error) {
        message.error("Failed to load data");
      }
    };

    fetchData();
  }, []);

  // Kiểm tra quyền
  useEffect(() => {
    if (!permissions.canCreate) {
      message.error("You don't have permission to access this page");
      navigate(`${effectiveBasePath}/enrollment`);
    }
  }, [permissions, effectiveBasePath, navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await enrollStudent(values);
      message.success("Student enrolled successfully!");
      setTimeout(() => {
        navigate(`${effectiveBasePath}/enrollment`);
      }, 1000);
    } catch (error) {
      const apiError = error.response?.data?.error || "Failed to enroll student";
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
          onClick={() => navigate(`${effectiveBasePath}/enrollment`)}
        >
          Back to List
        </Button>
      </div>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Class"
              name="classInfo_id"
              rules={[{ required: true, message: "Please select a class!" }]}
            >
              <Select
                placeholder="Select a class"
                options={classes.map(c => ({
                  value: c._id,
                  label: `${c.code} - ${c.name}`
                }))}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Student"
              name="student_id"
              rules={[{ required: true, message: "Please select a student!" }]}
            >
              <Select
                placeholder="Select a student"
                options={students.map(student => ({
                  value: student._id,
                  label: `${student.student_code} - ${student.user_id?.first_name} ${student.user_id?.last_name}`
                }))}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Enroll Student
          </Button>
          <Button
            style={{ marginLeft: 8 }}
            onClick={() => navigate(`${effectiveBasePath}/enrollment`)}
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

export default CreateEnrollment;