import React, { useState, useMemo } from "react";
import { Form, Button, message, Modal, Select, Row, Col } from "antd";
import { RollbackOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import {
  assignTutor,
  getTutorsByClass,
} from "../../../../api/education/classTutor";
import { getAllClasses } from "../../../../api/education/classInfo";
import { getAllTutors } from "../../../../api/organization/tutor";
import { useEffect } from "react";

const CreateClassTutor = ({ basePath, customPermissions }) => {
  const [form] = Form.useForm();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [assignedTutors, setAssignedTutors] = useState({});

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

  // Fetch classes và tutors data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classesData, tutorsData] = await Promise.all([
          getAllClasses(),
          getAllTutors()
        ]);
        console.log('Classes loaded:', classesData); // Thêm log này
        console.log('Tutors loaded:', tutorsData);   // Thêm log này
        setClasses(classesData);
        setTutors(tutorsData);
      } catch (error) {
        console.error("Failed to load data:", error); // Log chi tiết lỗi
        message.error("Failed to load data");
      }
    };
  
    fetchData();
  }, []);

  // Kiểm tra quyền
  useEffect(() => {
    if (!permissions.canCreate) {
      message.error("You don't have permission to access this page");
      navigate(`${effectiveBasePath}/classTutor`);
    }
  }, [permissions, effectiveBasePath, navigate]);

  const handleClassChange = async (classId) => {
    try {
      const assignedData = await getTutorsByClass(classId);
      const assignedMap = {};
      assignedData.forEach((assignment) => {
        assignedMap[assignment.tutor_id._id] = true;
      });
      setAssignedTutors(assignedMap);
    } catch (error) {
      console.error("Failed to fetch assigned tutors:", error);
      message.error("Failed to load assigned tutors");
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const tutorIds = values.tutor_ids || [];

      // Kiểm tra giảng viên đã được phân công
      const alreadyAssignedTutors = tutorIds.filter((id) => assignedTutors[id]);

      if (alreadyAssignedTutors.length > 0) {
        // Tìm tên của các giảng viên đã được phân công
        const assignedNames = alreadyAssignedTutors
          .map((id) => {
            const tutor = tutors.find((t) => t._id === id);
            return `${tutor.tutor_code} - ${tutor.user_id?.first_name} ${tutor.user_id?.last_name}`;
          })
          .join("\n");

        setErrorMessage(
          `The following tutors are already assigned to this class:\n${assignedNames}`
        );
        setIsModalVisible(true);
        setLoading(false);
        return;
      }

      // Nếu có primary tutor, chỉ cho phép một người
      if (values.is_primary && tutorIds.length > 1) {
        setErrorMessage("Only one tutor can be assigned as primary tutor");
        setIsModalVisible(true);
        setLoading(false);
        return;
      }

      // Nếu không có giảng viên nào đã được phân công, tiến hành assign
      const assignmentPromises = tutorIds.map(tutorId => 
        assignTutor({
          classInfo_id: values.classInfo_id,  // Sửa từ class_id thành classInfo_id
          tutor_id: tutorId,
          is_primary: values.is_primary || false
        })
      );

      await Promise.all(assignmentPromises);
      message.success("Tutors assigned successfully!");
      setTimeout(() => {
        navigate(`${effectiveBasePath}/classTutor`);
      }, 1000);
    } catch (error) {
      const apiError = error.response?.data?.error || "Failed to assign tutors";
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
          onClick={() => navigate(`${effectiveBasePath}/classTutor`)}
        >
          Back to List
        </Button>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Class"
              name="classInfo_id" // Sửa từ class_id thành classInfo_id
              rules={[{ required: true, message: "Please select a class!" }]}
            >
              <Select
                placeholder="Select a class"
                options={classes.map((c) => ({
                  value: c._id,
                  label: ` ${c.name} (${c.code}) - ${c.course_id?.name}`,
                }))}
                showSearch
                optionFilterProp="label"
                onChange={handleClassChange}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Tutors"
              name="tutor_ids"
              rules={[
                {
                  required: true,
                  message: "Please select at least one tutor!",
                },
              ]}
            >
              <Select
                mode="multiple"
                placeholder="Select tutors"
                options={tutors.map((tutor) => ({
                  value: tutor._id,
                  label: `${tutor.tutor_code} - ${tutor.user_id?.first_name} ${tutor.user_id?.last_name} - ${tutor.department_id?.name}`,
                  disabled: assignedTutors[tutor._id], // Disable các giảng viên đã được phân công
                }))}
                showSearch
                optionFilterProp="label"
                filterOption={(input, option) =>
                  option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="is_primary"
          valuePropName="checked"
          style={{ marginBottom: 24 }}
        >
          <Select
            placeholder="Select role"
            options={[
              { value: true, label: "Primary Tutor" },
              { value: false, label: "Secondary Tutor" },
            ]}
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Assign Tutor
          </Button>
          <Button
            style={{ marginLeft: 8 }}
            onClick={() => navigate(`${effectiveBasePath}/classTutor`)}
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
        <pre style={{ whiteSpace: "pre-wrap" }}>{errorMessage}</pre>
      </Modal>
    </div>
  );
};

export default CreateClassTutor;
