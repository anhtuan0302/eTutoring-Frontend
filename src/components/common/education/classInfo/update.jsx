import React, { useState, useMemo } from "react";
import {
  Form,
  Input,
  Button,
  message,
  Modal,
  DatePicker,
  InputNumber,
  Select,
  Row,
  Col,
} from "antd";
import { RollbackOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import { updateClass, getClassById } from "../../../../api/education/classInfo";
import { getAllCourses } from "../../../../api/education/course";
import { useEffect } from "react";
import moment from "moment";

const UpdateClass = ({ basePath, customPermissions }) => {
  const { id } = useParams();
  const [form] = Form.useForm();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [classInfo, setClassInfo] = useState(null);
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
          canEdit: true,
        };
      default:
        return {
          canEdit: false,
        };
    }
  }, [customPermissions, user?.role]);

  // Fetch class và courses data
  // Fetch class và courses data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [classData, coursesData] = await Promise.all([
          getClassById(id),
          getAllCourses(),
        ]);

        setClassInfo(classData);
        setCourses(coursesData);

        // Set startDate state với giá trị từ API
        const startDateValue = classData.start_date
          ? moment(classData.start_date)
          : null;
        setStartDate(startDateValue);

        // Cập nhật lại form với giá trị course_id
        form.setFieldsValue({
          code: classData.code,
          name: classData.name,
          course_id: classData.course_id?._id,
          max_students: classData.max_students,
          start_date: startDateValue,
          end_date: classData.end_date ? moment(classData.end_date) : null,
        });
      } catch (error) {
        message.error("Failed to load data");
        console.error("Error fetching data:", error);
        navigate(`${effectiveBasePath}/classInfo`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, form, effectiveBasePath, navigate]);

  // Kiểm tra quyền
  useEffect(() => {
    if (!permissions.canEdit) {
      message.error("You don't have permission to edit classes");
      navigate(`${effectiveBasePath}/classInfo`);
    }
  }, [permissions, effectiveBasePath, navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await updateClass(id, values);
      message.success("Class updated successfully!");
      setTimeout(() => {
        navigate(`${effectiveBasePath}/classInfo/${id}`);
      }, 1000);
    } catch (error) {
      const apiError = error.response?.data?.error || "Failed to update class";
      setErrorMessage(apiError);
      setIsModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  if (!classInfo && !loading) {
    return <div>Class not found</div>;
  }

  // Thêm hàm xử lý khi start_date thay đổi
  const handleStartDateChange = (date) => {
    form.setFieldValue("start_date", date);
    setStartDate(date);

    // Reset end_date nếu không thỏa mãn điều kiện
    const currentEndDate = form.getFieldValue("end_date");
    if (currentEndDate) {
      const minEndDate = moment(date).add(1, "month");
      const maxEndDate = moment(date).add(6, "months");
      if (
        currentEndDate.isBefore(minEndDate) ||
        currentEndDate.isAfter(maxEndDate)
      ) {
        form.setFieldValue("end_date", null);
      }
    }
  };

  // Thêm hàm để disable các ngày không hợp lệ cho end_date
  const disabledEndDate = (current) => {
    if (!startDate) {
      return false;
    }

    // Không cho phép chọn ngày trước 1 tháng kể từ start_date
    const minDate = moment(startDate).add(1, "month");
    // Không cho phép chọn ngày sau 6 tháng kể từ start_date
    const maxDate = moment(startDate).add(6, "months");

    return current && (current < minDate || current > maxDate);
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
          onClick={() => navigate(`${effectiveBasePath}/classInfo`)}
        >
          Back to List
        </Button>
      </div>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Class Code"
              name="code"
              rules={[{ required: true, message: "Please enter class code!" }]}
            >
              <Input placeholder="Enter the class code" />
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
                options={courses.map((course) => ({
                  value: course._id,
                  label: `${course.code} - ${course.name}`,
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
                { type: "number", min: 10, message: "Minimum students is 10" },
                { type: "number", max: 50, message: "Maximum students is 50" },
              ]}
            >
              <InputNumber
                min={10}
                max={50}
                placeholder="Enter maximum number of students (10-50)"
                style={{ width: "100%" }}
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
                style={{ width: "100%" }}
                onChange={handleStartDateChange}
                disabledDate={(current) => {
                  // Không cho phép chọn ngày trong quá khứ
                  return current && current < moment().startOf("day");
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
                    const startDate = getFieldValue("start_date");
                    if (!startDate || !value) {
                      return Promise.resolve();
                    }

                    const minEndDate = moment(startDate).add(1, "month");
                    const maxEndDate = moment(startDate).add(6, "months");

                    if (value.isBefore(minEndDate)) {
                      return Promise.reject(
                        "End date must be at least 1 month after start date"
                      );
                    }
                    if (value.isAfter(maxEndDate)) {
                      return Promise.reject(
                        "End date cannot be more than 6 months after start date"
                      );
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
              dependencies={["start_date"]}
            >
              <DatePicker
                style={{ width: "100%" }}
                disabledDate={disabledEndDate}
                disabled={!startDate}
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Update Class
          </Button>
          <Button
            style={{ marginLeft: 8 }}
            onClick={() => navigate(`${effectiveBasePath}/classInfo/${id}`)}
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

export default UpdateClass;
