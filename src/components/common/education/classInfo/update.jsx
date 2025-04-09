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
  Grid,
} from "antd";
import { RollbackOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import { updateClass, getClassById, getClassStudents, getClassTutors } from "../../../../api/education/classInfo";
import { getAllCourses } from "../../../../api/education/course";
import { getAllStudents } from "../../../../api/organization/student";
import { getAllTutors } from "../../../../api/organization/tutor";
import { assignTutor, removeTutor, updateTutorRole } from "../../../../api/education/classTutor";
import { enrollStudent, unenrollStudent } from "../../../../api/education/enrollment";
import firebaseNotificationService from "../../../../api/firebaseNotification";
import moment from "moment";

const { useBreakpoint } = Grid;

const UpdateClass = ({ basePath, customPermissions }) => {
  const { id } = useParams();
  const [form] = Form.useForm();
  const { user } = useAuth();
  const navigate = useNavigate();
  const screens = useBreakpoint();

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
  const [classInfo, setClassInfo] = useState(null);

  // Determine basePath based on user role
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

  // Determine permissions based on user role
  const permissions = useMemo(() => {
    if (customPermissions) return customPermissions;
    return {
      canEdit: ["admin", "staff"].includes(user?.role),
    };
  }, [customPermissions, user?.role]);

  // Fetch initial data including class info, courses, students, and tutors
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [classData, coursesData, studentsData, tutorsData, enrolledStudents, assignedTutors] = await Promise.all([
          getClassById(id),
          getAllCourses(),
          getAllStudents(),
          getAllTutors(),
          getClassStudents(id),
          getClassTutors(id)
        ]);

        console.log('Fetched class data:', classData);
        console.log('Fetched courses data:', coursesData);
        console.log('Fetched students data:', studentsData);
        console.log('Fetched tutors data:', tutorsData);
        console.log('Fetched enrolled students:', enrolledStudents);
        console.log('Fetched assigned tutors:', assignedTutors);

        setClassInfo(classData);
        setCourses(coursesData.map(course => ({
          ...course,
          department_id: course.department_id?._id || course.department_id,
        })));

        // Map students data with proper format for Transfer component
        const mappedStudents = studentsData.map(student => ({
          key: student._id,
          user_id: student.user_id?._id,
          title: `${student.student_code} - ${student.user_id?.first_name} ${student.user_id?.last_name}`,
          department: student.department_id?._id || student.department_id,
          description: student.student_code,
        }));
        console.log('Mapped students:', mappedStudents);
        setStudents(mappedStudents);

        // Map tutors data with proper format for Transfer component
        const mappedTutors = tutorsData.map(tutor => ({
          key: tutor._id,
          user_id: tutor.user_id?._id,
          title: `${tutor.tutor_code} - ${tutor.user_id?.first_name} ${tutor.user_id?.last_name}`,
          department: tutor.department_id?._id || tutor.department_id,
          description: tutor.tutor_code,
        }));
        console.log('Mapped tutors:', mappedTutors);
        setTutors(mappedTutors);

        // Set initial form values
        if (classData) {
          const startDateValue = classData.start_date ? moment(classData.start_date) : null;
          setStartDate(startDateValue);
          setSelectedCourse(classData.course_id);
          console.log('Selected course:', classData.course_id);
          
          // Set selected students from enrolled students
          const enrolledStudentIds = enrolledStudents.map(s => s.student_id._id);
          console.log('Enrolled student IDs:', enrolledStudentIds);
          setSelectedStudents(enrolledStudentIds);
          
          // Set selected tutors and primary tutor from assigned tutors
          const assignedTutorIds = assignedTutors.map(t => t.tutor_id._id);
          console.log('Assigned tutor IDs:', assignedTutorIds);
          setSelectedTutors(assignedTutorIds);
          
          const primaryTutorData = assignedTutors.find(t => t.is_primary);
          if (primaryTutorData) {
            setPrimaryTutor(primaryTutorData.tutor_id._id);
          }

          form.setFieldsValue({
            code: classData.code,
            name: classData.name,
            course_id: classData.course_id?._id,
            max_students: classData.max_students,
            start_date: startDateValue,
            end_date: classData.end_date ? moment(classData.end_date) : null,
          });
        }
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

  // Check permissions
  useEffect(() => {
    if (!permissions.canEdit) {
      message.error("You don't have permission to edit classes");
      navigate(`${effectiveBasePath}/classInfo`);
    }
  }, [permissions, effectiveBasePath, navigate]);

  // Handle course selection change
  const handleCourseChange = (value) => {
    const course = courses.find(c => c._id === value);
    setSelectedCourse(course);
    form.setFieldValue("course_id", value);
  };

  // Filter students and tutors based on selected course
  const filteredStudents = useMemo(() => {
    if (!selectedCourse) return students;
    return students.filter(student => student.department === selectedCourse.department_id._id);
  }, [students, selectedCourse]);

  const filteredTutors = useMemo(() => {
    if (!selectedCourse) return tutors;
    return tutors.filter(tutor => tutor.department === selectedCourse.department_id._id);
  }, [tutors, selectedCourse]);

  // Handle start date change
  const handleStartDateChange = (date) => {
    form.setFieldValue("start_date", date);
    setStartDate(date);
    
    // Reset end_date if it doesn't meet the conditions
    const currentEndDate = form.getFieldValue("end_date");
    if (currentEndDate) {
      const minEndDate = moment(date).add(1, "month");
      const maxEndDate = moment(date).add(6, "months");
      if (currentEndDate.isBefore(minEndDate) || currentEndDate.isAfter(maxEndDate)) {
        form.setFieldValue("end_date", null);
      }
    }
  };

  // Disable invalid dates for end date picker
  const disabledEndDate = (current) => {
    if (!startDate) return false;
    const minDate = moment(startDate).add(1, "month");
    const maxDate = moment(startDate).add(6, "months");
    return current && (current < minDate || current > maxDate);
  };

  // Handle form submission
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

      await updateClass(id, formattedValues);
      
      const className = `${submitData.code} - ${courses.find(c => c._id === submitData.course_id)?.name}`;

      // Get current enrolled students and assigned tutors
      const [currentEnrollments, currentAssignments] = await Promise.all([
        getClassStudents(id),
        getClassTutors(id)
      ]);

      const currentEnrolledStudentIds = currentEnrollments.map(s => s.student_id._id);
      const currentAssignedTutorIds = currentAssignments.map(t => t.tutor_id._id);

      // Handle student enrollments
      const studentsToAdd = selectedStudents.filter(id => !currentEnrolledStudentIds.includes(id));
      const studentsToRemove = currentEnrollments.filter(e => !selectedStudents.includes(e.student_id._id));

      // Enroll new students
      for (const studentId of studentsToAdd) {
        try {
          await enrollStudent({
            classInfo_id: id,
            student_id: studentId
          });

          const studentData = students.find(s => s.key === studentId);
          if (studentData && studentData.user_id) {
            await firebaseNotificationService.createNotification(
              studentData.user_id,
              {
                content: `You have been enrolled in ${className}`,
                notification_type: 'class_enrolled',
                reference_type: 'class',
                reference_id: id,
                created_at: Date.now(),
                updated_at: Date.now(),
                is_read: false
              }
            );
          }
        } catch (error) {
          message.warning(`Failed to enroll student: ${error.response?.data?.error || error.message}`);
        }
      }

      // Unenroll removed students
      for (const enrollment of studentsToRemove) {
        try {
          await unenrollStudent(enrollment._id);
        } catch (error) {
          message.warning(`Failed to unenroll student: ${error.response?.data?.error || error.message}`);
        }
      }

      // Handle tutor assignments
      const tutorsToAdd = selectedTutors.filter(id => !currentAssignedTutorIds.includes(id));
      const tutorsToRemove = currentAssignments.filter(a => !selectedTutors.includes(a.tutor_id._id));

      // Assign new tutors
      for (const tutorId of tutorsToAdd) {
        try {
          await assignTutor({
            classInfo_id: id,
            tutor_id: tutorId,
            is_primary: tutorId === primaryTutor
          });

          const tutorData = tutors.find(t => t.key === tutorId);
          if (tutorData && tutorData.user_id) {
            const notificationContent = tutorId === primaryTutor
              ? `You are now the main tutor for ${className}`
              : `You are now a tutor for ${className}`;

            await firebaseNotificationService.createNotification(
              tutorData.user_id,
              {
                content: notificationContent,
                notification_type: 'class_assigned',
                reference_type: 'class',
                reference_id: id,
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

      // Remove unassigned tutors
      for (const assignment of tutorsToRemove) {
        try {
          await removeTutor(assignment._id);
        } catch (error) {
          message.warning(`Failed to remove tutor assignment: ${error.response?.data?.error || error.message}`);
        }
      }

      // Update primary tutor if changed
      const currentPrimaryTutor = currentAssignments.find(t => t.is_primary);
      if (currentPrimaryTutor && currentPrimaryTutor.tutor_id._id !== primaryTutor) {
        try {
          await updateTutorRole(currentPrimaryTutor._id, { is_primary: false });
          const newPrimaryAssignment = currentAssignments.find(t => t.tutor_id._id === primaryTutor);
          if (newPrimaryAssignment) {
            await updateTutorRole(newPrimaryAssignment._id, { is_primary: true });
          }
        } catch (error) {
          message.warning(`Failed to update primary tutor: ${error.response?.data?.error || error.message}`);
        }
      }

      message.success('Class updated successfully!');
      setTimeout(() => {
        navigate(`${effectiveBasePath}/classInfo/${id}`);
      }, 1000);

    } catch (error) {
      const apiError = error.response?.data?.error || error.message || "Failed to update class";
      setErrorMessage(apiError);
      setIsModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  // Basic Information Step Component
  const BasicInfoStep = () => (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={24} lg={24} xl={24}>
          <Form.Item
            label="Class Code"
            name="code"
            rules={[{ required: true, message: "Please enter class code!" }]}
          >
            <Input placeholder="Enter the class code" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
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
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
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

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
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
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
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

  // Students Step Component
  const StudentsStep = () => (
    <Transfer
      dataSource={filteredStudents}
      targetKeys={selectedStudents}
      onChange={setSelectedStudents}
      render={item => item.title}
      showSearch
      listStyle={{
        width: 500,
        height: 400,
      }}
    />
  );

  // Tutors Step Component
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
          width: screens.xs ? '100%' : 500,
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

  // Define steps for the multi-step form
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

  // Handle next step
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

  // Handle previous step
  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  if (!classInfo && !loading) {
    return <div>Class not found</div>;
  }

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
              Update Class
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

export default UpdateClass;
