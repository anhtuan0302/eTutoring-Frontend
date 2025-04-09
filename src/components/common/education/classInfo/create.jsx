import React, { useState, useMemo, useEffect } from "react";
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
  Transfer,
  Steps,
} from "antd";
import { RollbackOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import { createClass } from "../../../../api/education/classInfo";
import { getAllCourses } from "../../../../api/education/course";
import { getAllStudents } from "../../../../api/organization/student";
import { getAllTutors } from "../../../../api/organization/tutor";
import { assignTutor } from "../../../../api/education/classTutor";
import { enrollStudent } from "../../../../api/education/enrollment";
import firebaseNotificationService from "../../../../api/firebaseNotification";
import moment from "moment";

const CreateClass = ({ basePath, customPermissions }) => {
  const [form] = Form.useForm();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedTutors, setSelectedTutors] = useState([]);
  const [primaryTutor, setPrimaryTutor] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});

  const effectiveBasePath = useMemo(() => {
    if (basePath) return basePath;
    switch (user?.role) {
      case "admin": return "/admin";
      case "staff": return "/staff";
      case "tutor": return "/tutor";
      case "student": return "/student";
      default: return "/";
    }
  }, [basePath, user?.role]);

  const permissions = useMemo(() => {
    if (customPermissions) return customPermissions;
    return {
      canCreate: ["admin", "staff"].includes(user?.role),
      canEdit: ["admin", "staff"].includes(user?.role),
    };
  }, [customPermissions, user?.role]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesData, studentsData, tutorsData] = await Promise.all([
          getAllCourses(),
          getAllStudents(),
          getAllTutors(),
        ]);

        setCourses(coursesData.map(course => ({
          ...course,
          department_id: course.department_id?._id || course.department_id,
        })));

        setStudents(studentsData.map(student => ({
          key: student._id,
          user_id: student.user_id?._id,
          title: `${student.student_code} - ${student.user_id?.first_name} ${student.user_id?.last_name}`,
          department: student.department_id?._id || student.department_id,
          description: student.student_code,
        })));

        setTutors(tutorsData.map(tutor => ({
          key: tutor._id,
          user_id: tutor.user_id?._id,
          title: `${tutor.tutor_code} - ${tutor.user_id?.first_name} ${tutor.user_id?.last_name}`,
          department: tutor.department_id?._id || tutor.department_id,
          description: tutor.tutor_code,
        })));
      } catch (error) {
        message.error("Failed to load initial data");
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!permissions.canCreate) {
      message.error("You don't have permission to access this page");
      navigate(`${effectiveBasePath}/classInfo`);
    }
  }, [permissions, effectiveBasePath, navigate]);

  const handleCourseChange = (value) => {
    const course = courses.find(c => c._id === value);
    setSelectedCourse(course);
    form.setFieldValue("course_id", value);
    setSelectedStudents([]);
    setSelectedTutors([]);
    setPrimaryTutor(null);
  };

  const filteredStudents = useMemo(() => {
    if (!selectedCourse) return students;
    return students.filter(student => student.department === selectedCourse.department_id);
  }, [students, selectedCourse]);

  const filteredTutors = useMemo(() => {
    if (!selectedCourse) return tutors;
    return tutors.filter(tutor => tutor.department === selectedCourse.department_id);
  }, [tutors, selectedCourse]);

  const handleStartDateChange = (date) => {
    form.setFieldValue("start_date", date);
    setStartDate(date);
    
    // Tự động set end_date là 1 tháng sau start_date
    if (date) {
      const defaultEndDate = moment(date).add(1, "month");
      form.setFieldValue("end_date", defaultEndDate);
    }
  };

  const disabledEndDate = (current) => {
    if (!startDate) return false;
    const minDate = moment(startDate).add(1, "month");
    const maxDate = moment(startDate).add(6, "months");
    return current && (current < minDate || current > maxDate);
  };

    const onFinish = async (submitData) => {
    if (!submitData.code || !submitData.course_id || !submitData.max_students || 
        !submitData.start_date || !submitData.end_date) {
      message.error('Please fill in all required fields in Basic Information');
      setCurrentStep(0);
      return;
    }

    if (selectedStudents.length === 0) {
      message.error('Please select at least one student');
      setCurrentStep(1);
      return;
    }

    if (selectedTutors.length === 0) {
      message.error('Please select at least one tutor');
      setCurrentStep(2);
      return;
    }

    if (!primaryTutor) {
      message.error('Please select a primary tutor');
      setCurrentStep(2);
      return;
    }

    setLoading(true);
    try {
      const formattedValues = {
        code: submitData.code,
        course_id: submitData.course_id,
        max_students: submitData.max_students,
        start_date: moment(submitData.start_date).startOf('day').toISOString(),
        end_date: moment(submitData.end_date).startOf('day').toISOString()
      };
  
      const newClass = await createClass(formattedValues);
      
      if (!newClass?._id) {
        throw new Error('Failed to create class: No class ID returned');
      }
  
      const classId = newClass._id;
      const className = `${submitData.code} - ${courses.find(c => c._id === submitData.course_id)?.name}`;
  
      // Assign tutors và tạo notifications
      for (const tutorId of selectedTutors) {
        try {
          await assignTutor({
            classInfo_id: classId,
            tutor_id: tutorId,
            is_primary: tutorId === primaryTutor
          });
      
          // Lấy thông tin tutor để có user_id
          const tutorData = tutors.find(t => t.key === tutorId);
          if (tutorData && tutorData.user_id) {
            const notificationContent = tutorId === primaryTutor
              ? `You are the main tutor for ${className}`
              : `You are a tutor for ${className}`;
      
            await firebaseNotificationService.createNotification(
              tutorData.user_id,  // Sử dụng user_id thay vì tutor_id
              {
                content: notificationContent,
                notification_type: 'class_enrolled',
                reference_type: 'class',
                reference_id: classId,
                created_at: Date.now(),
                updated_at: Date.now(),
                is_read: false
              }
            );
          }
        } catch (error) {
          message.warning(`Failed to assign tutor: ${error.response?.data?.error || error.message}`);
        }
      }
  
      // Enroll students và tạo notifications
      let enrollmentSuccess = 0;
      let enrollmentErrors = [];
  
      for (const studentId of selectedStudents) {
        try {
          await enrollStudent({
            classInfo_id: classId,
            student_id: studentId
          });
      
          // Lấy thông tin student để có user_id
          const studentData = students.find(s => s.key === studentId);
          if (studentData && studentData.user_id) {
            await firebaseNotificationService.createNotification(
              studentData.user_id,
              {
                content: `You enrolled in ${className}`,
                notification_type: 'class_enrolled',
                reference_type: 'class',
                reference_id: classId,
                created_at: Date.now(),
                updated_at: Date.now(),
                is_read: false
              }
            );
          }
      
          enrollmentSuccess++;
        } catch (error) {
          enrollmentErrors.push({
            student: students.find(s => s.key === studentId)?.title,
            error: error.response?.data?.error || error.message
          });
        }
      }

      if (enrollmentSuccess > 0) {
        message.success(`Successfully enrolled ${enrollmentSuccess} students`);
      }

      if (enrollmentErrors.length > 0) {
        Modal.error({
          title: 'Enrollment Errors',
          content: (
            <div>
              <p>Failed to enroll some students:</p>
              <ul>
                {enrollmentErrors.map((error, index) => (
                  <li key={index} style={{ color: 'red' }}>
                    <strong>{error.student}</strong>: {error.error}
                  </li>
                ))}
              </ul>
            </div>
          ),
          width: 500
        });
      }

      message.success('Class created successfully!');
      setTimeout(() => {
        navigate(`${effectiveBasePath}/classInfo`);
      }, 1000);

    } catch (error) {
      const apiError = error.response?.data?.error || error.message || "Failed to create class";
      setErrorMessage(apiError);
      setIsModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const BasicInfoStep = () => (
    <>
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
              onChange={handleCourseChange}
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
              disabledDate={(current) => current && current < moment().startOf("day")}
              format="DD/MM/YYYY"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="End Date"
            name="end_date"
            rules={[{ required: true, message: "Please select end date!" }]}
          >
            <DatePicker
              style={{ width: "100%" }}
              disabledDate={disabledEndDate}
              disabled={!startDate}
              format="DD/MM/YYYY"
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  );

  const StudentsStep = () => (
    <Transfer
      dataSource={filteredStudents}
      titles={["Available Students", "Selected Students"]}
      targetKeys={selectedStudents}
      onChange={setSelectedStudents}
      render={item => item.title}
      disabled={!selectedCourse}
      showSearch
      filterOption={(inputValue, item) =>
        item.title.toLowerCase().includes(inputValue.toLowerCase()) ||
        item.description.toLowerCase().includes(inputValue.toLowerCase())
      }
      listStyle={{
        width: 500,
        height: 400,
      }}
      style={{ marginTop: 20 }}
    />
  );

  const TutorsStep = () => (
    <>
      <Transfer
        dataSource={filteredTutors}
        titles={["Available Tutors", "Selected Tutors"]}
        targetKeys={selectedTutors}
        onChange={setSelectedTutors}
        render={item => item.title}
        disabled={!selectedCourse}
        showSearch
        filterOption={(inputValue, item) =>
          item.title.toLowerCase().includes(inputValue.toLowerCase()) ||
          item.description.toLowerCase().includes(inputValue.toLowerCase())
        }
        listStyle={{
          width: 500,
          height: 400,
        }}
        style={{ marginTop: 20 }}
      />

      {selectedTutors.length > 0 && (
        <Form.Item
          label="Primary Tutor"
          name="primary_tutor"
          rules={[{ required: true, message: "Please select a primary tutor!" }]}
          style={{ marginTop: 20 }}
        >
          <Select
            placeholder="Select primary tutor"
            onChange={setPrimaryTutor}
            options={selectedTutors.map(tutorId => ({
              value: tutorId,
              label: filteredTutors.find(t => t.key === tutorId)?.title
            }))}
          />
        </Form.Item>
      )}
    </>
  );

  const steps = [
    {
      title: "Basic Information",
      content: <BasicInfoStep />,
    },
    {
      title: "Select Students",
      content: <StudentsStep />,
    },
    {
      title: "Assign Tutors",
      content: <TutorsStep />,
    },
  ];

  const next = async () => {
    try {
      if (currentStep === 0) {
        const basicInfo = await form.validateFields([
          'code',
          'course_id',
          'max_students',
          'start_date',
          'end_date'
        ]);
        setFormData(prev => ({
          ...prev,
          ...basicInfo
        }));
      } else if (currentStep === 1 && selectedStudents.length === 0) {
        message.error('Please select at least one student');
        return;
      }
      setCurrentStep(currentStep + 1);
    } catch (error) {
      // Form validation error
    }
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          icon={<RollbackOutlined />}
          onClick={() => navigate(`${effectiveBasePath}/classInfo`)}
        >
          Back to List
        </Button>
      </div>

      <Steps current={currentStep} items={steps} style={{ marginBottom: 40 }} />

      <Form
        form={form}
        layout="vertical"
        initialValues={formData}
      >
        <div style={{ minHeight: "300px" }}>
          {steps[currentStep].content}
        </div>

        <div style={{ marginTop: 24 }}>
          {currentStep > 0 && (
            <Button style={{ margin: "0 8px" }} onClick={prev}>
              Previous
            </Button>
          )}
          {currentStep < steps.length - 1 && (
            <Button type="primary" onClick={next}>
              Next
            </Button>
          )}
          {currentStep === steps.length - 1 && (
            <Button
              type="primary"
              onClick={async () => {
                try {
                  const finalValues = await form.validateFields();
                  const submitData = {
                    ...formData,
                    ...finalValues
                  };
                  onFinish(submitData);
                } catch (error) {
                  // Form validation error
                }
              }}
              loading={loading}
            >
              Create Class
            </Button>
          )}
        </div>
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