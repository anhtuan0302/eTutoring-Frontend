import React, { useState, useMemo } from "react";
import { Form, Input, Button, message, Modal, DatePicker, InputNumber, Select, Row, Col } from "antd";
import { RollbackOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import { createClass } from "../../../../api/education/classInfo";
import { getAllCourses } from "../../../../api/education/course";
import { useEffect } from "react";
import moment from 'moment';

const CreateClass = ({
  classId,
  basePath,
  customPermissions,
}) => {
  const [form] = Form.useForm();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [startDate, setStartDate] = useState(null);

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

  // Fetch courses data
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await getAllCourses();
        setCourses(data);
      } catch (error) {
        message.error("Failed to load courses");
      }
    };

    fetchCourses();
  }, []);

  // Kiểm tra quyền
  useEffect(() => {
    if (!permissions.canCreate) {
      message.error("You don't have permission to access this page");
      navigate(`${effectiveBasePath}/classInfo`);
    }
  }, [permissions, effectiveBasePath, navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await createClass(values);
      message.success("Class created successfully!");
      setTimeout(() => {
        navigate(`${effectiveBasePath}/classInfo`);
      }, 1000);
    } catch (error) {
      const apiError = error.response?.data?.error || "Failed to create class";
      setErrorMessage(apiError);
      setIsModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleStartDateChange = (date) => {
    form.setFieldValue('start_date', date);
    setStartDate(date);
    
    // Reset end_date nếu không thỏa mãn điều kiện
    const currentEndDate = form.getFieldValue('end_date');
    if (currentEndDate) {
      const minEndDate = moment(date).add(1, 'month');
      const maxEndDate = moment(date).add(6, 'months');
      if (currentEndDate.isBefore(minEndDate) || currentEndDate.isAfter(maxEndDate)) {
        form.setFieldValue('end_date', null);
      }
    }
  };

    // Disable các ngày không hợp lệ cho end_date
    const disabledEndDate = (current) => {
      if (!startDate) {
        return false;
      }
      
      const minDate = moment(startDate).add(1, 'month');
      const maxDate = moment(startDate).add(6, 'months');
      
      return current && (current < minDate || current > maxDate);
    };

    return (
      <div>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            icon={<RollbackOutlined />}
            onClick={() => navigate(`${effectiveBasePath}/classInfo`)}
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
                label="Class Code"
                name="code"
                rules={[{ required: true, message: "Please enter class code!" }]}
              >
                <Input placeholder="Enter the class code" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Class Name"
                name="name"
                rules={[{ required: true, message: "Please enter class name!" }]}
              >
                <Input placeholder="Enter the class name" />
              </Form.Item>
            </Col>
          </Row>
  
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Course"
                name="course_id"
                rules={[{ required: true, message: "Please select a course!" }]}
              >
                <Select
                  placeholder="Select a course"
                  options={courses.map(course => ({
                    value: course._id,
                    label: `${course.code} - ${course.name}`
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Maximum Students"
                name="max_students"
                rules={[
                  { required: true, message: "Please enter maximum students!" },
                  { type: 'number', min: 10, message: "Minimum students is 10" },
                  { type: 'number', max: 50, message: "Maximum students is 50" }
                ]}
              >
                <InputNumber 
                  min={10} 
                  max={50} 
                  placeholder="Enter maximum number of students (10-50)" 
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
  
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Start Date"
                name="start_date"
                rules={[{ required: true, message: "Please select start date!" }]}
              >
                <DatePicker 
                  style={{ width: '100%' }}
                  onChange={handleStartDateChange}
                  disabledDate={(current) => {
                    // Không cho phép chọn ngày trong quá khứ
                    return current && current < moment().startOf('day');
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="End Date"
                name="end_date"
                rules={[
                  { required: true, message: "Please select end date!" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const startDate = getFieldValue('start_date');
                      if (!startDate || !value) {
                        return Promise.resolve();
                      }
                      
                      const minEndDate = moment(startDate).add(1, 'month');
                      const maxEndDate = moment(startDate).add(6, 'months');
                      
                      if (value.isBefore(minEndDate)) {
                        return Promise.reject('End date must be at least 1 month after start date');
                      }
                      if (value.isAfter(maxEndDate)) {
                        return Promise.reject('End date cannot be more than 6 months after start date');
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
                dependencies={['start_date']}
              >
                <DatePicker 
                  style={{ width: '100%' }}
                  disabledDate={disabledEndDate}
                  disabled={!startDate}
                />
              </Form.Item>
            </Col>
          </Row>
  
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Create Class
            </Button>
            <Button
              style={{ marginLeft: 8 }}
              onClick={() => navigate(`${effectiveBasePath}/classInfo`)}
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

export default CreateClass;