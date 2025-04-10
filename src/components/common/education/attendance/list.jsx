import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Table,
  Button,
  message,
  Input,
  Empty,
  Space,
  Tag,
  Radio,
  Avatar,
  Card,
  Row,
  Col,
  Typography,
} from "antd";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import {
  bulkAttendance,
  getAttendanceBySchedule,
} from "../../../../api/education/attendance";
import { getClassById } from "../../../../api/education/classInfo";
import { getScheduleById } from "../../../../api/education/classSchedule";
import {
  SearchOutlined,
  UserOutlined,
  SaveOutlined,
  RollbackOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

const ListAttendance = ({ basePath, customPermissions }) => {
  const params = useParams();
  // Lấy id từ params.id thay vì params.schedule_id
  const schedule_id = params.id;
  const { user } = useAuth();
  const navigate = useNavigate();

  // States
  const [classInfo, setClassInfo] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [studentAttendances, setStudentAttendances] = useState({});
  const [submitting, setSubmitting] = useState(false);
  // Xác định basePath
  const effectiveBasePath = useMemo(() => {
    if (basePath) return basePath;

    switch (user?.role) {
      case "admin":
        return "/admin";
      case "staff":
        return "/staff";
      case "tutor":
        return "/tutor";
      default:
        return "/";
    }
  }, [basePath, user?.role]);

  // Xác định permissions
  const permissions = useMemo(() => {
    if (customPermissions) return customPermissions;

    switch (user?.role) {
      case "admin":
      case "staff":
        return {
          canView: true,
          canCreate: true,
        };
      case "tutor":
        return {
          canView: true,
          canCreate: true,
        };
      default:
        return {
          canView: true,
          canCreate: false,
        };
    }
  }, [customPermissions, user?.role]);

  // Filter data
  const filteredStudents = useMemo(() => {
    console.log("Computing filteredStudents");
    console.log("Current classInfo:", classInfo);
    console.log("Current searchText:", searchText);

    if (!classInfo?.enrollments) {
      console.log("No enrollments found in classInfo");
      return [];
    }

    console.log("Original enrollments:", classInfo.enrollments);
    let result = [...classInfo.enrollments];
    const search = searchText.toLowerCase();

    if (search) {
      console.log("Filtering by search:", search);
      result = result.filter((enrollment) => {
        const studentName =
          `${enrollment.student_id.user_id.first_name} ${enrollment.student_id.user_id.last_name}`.toLowerCase();
        const matches =
          studentName.includes(search) ||
          enrollment.student_id.student_code.toLowerCase().includes(search);
        console.log("Checking student:", studentName, "Matches:", matches);
        return matches;
      });
    }

    console.log("Filtered result:", result);
    return result;
  }, [classInfo, searchText]);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      if (!schedule_id) {
        return;
      }
      setLoading(true);

      // Step 1: Get schedule information
      const scheduleResponse = await getScheduleById(schedule_id);

      if (!scheduleResponse || !scheduleResponse._id) {
        throw new Error("Schedule information not found");
      }

      setSchedule(scheduleResponse);

      // Step 2: Get class information
      let classInfoId;
      if (scheduleResponse.classInfo_id && scheduleResponse.classInfo_id._id) {
        classInfoId = scheduleResponse.classInfo_id._id;
      } else if (scheduleResponse.classInfo_id) {
        classInfoId = scheduleResponse.classInfo_id;
      } else {
        throw new Error("Schedule does not have valid class information");
      }

      const classResponse = await getClassById(classInfoId);

      if (!classResponse || !classResponse._id) {
        throw new Error("Class information not found");
      }

      setClassInfo(classResponse);

      // Step 3: Get current attendance
      const attendanceResponse = await getAttendanceBySchedule(schedule_id);

      // Step 4: Initialize attendance states
      const initialAttendances = {};

      if (attendanceResponse && attendanceResponse.length > 0) {
        attendanceResponse.forEach((attendance) => {
          initialAttendances[attendance.student_id._id] = attendance.status;
        });
      } else {
        classResponse.enrollments.forEach((enrollment) => {
          initialAttendances[enrollment.student_id._id] = "absent";
        });
      }

      setStudentAttendances(initialAttendances);

      // Update pagination
      setPagination((prev) => ({
        ...prev,
        total: classResponse.enrollments.length,
      }));

    } catch (error) {
      message.error(error.message || "Failed to load data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [schedule_id]);

  // Sửa lại useEffect để tránh gọi nhiều lần
  useEffect(() => {
    console.log("UseEffect triggered with schedule_id:", schedule_id);
    const fetchDataPromise = fetchData();
    return () => {
      // Cleanup function
      console.log("Cleaning up fetchData");
    };
  }, [fetchData]);

  // Handle attendance change
  const handleAttendanceChange = useCallback((studentId, value) => {
    setStudentAttendances((prev) => ({
      ...prev,
      [studentId]: value,
    }));
  }, []);

  // Handle submit
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Get tutor_id from user context
      const tutor_id = user?.profile?._id;
      
      if (!tutor_id) {
        throw new Error("Instructor information not found. Please log in again.");
      }

      const attendances = Object.entries(studentAttendances).map(
        ([student_id, status]) => ({
          student_id,
          status,
        })
      );

      const payload = {
        class_schedule_id: schedule_id,
        attendances,
        tutor_id
      };

      const response = await bulkAttendance(payload);

      message.success("Attendance recorded successfully");
      navigate(0);
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || "Failed to record attendance";
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Table columns
  const columns = useMemo(
    () => [
      {
        title: "No.",
        key: "no",
        render: (_, record, index) => index + 1,
      },
      {
        title: "Avatar",
        key: "avatar_path",
        render: (_, record) => (
          <Avatar
            size={60}
            src={
              record.student_id.user_id.avatar_path
                ? `http://localhost:8000/${record.student_id.user_id.avatar_path}`
                : null
            }
            icon={<UserOutlined />}
          />
        ),
      },
      {
        title: "Student Code",
        key: "student_code",
        render: (_, record) => <Text>{record.student_id.student_code}</Text>,
      },
      {
        title: "Student Name",
        key: "student_name",
        render: (_, record) => (
          <Text>{`${record.student_id.user_id.first_name} ${record.student_id.user_id.last_name}`}</Text>
        ),
      },
      {
        title: "Student Email",
        key: "email",
        render: (_, record) => <Text>{record.student_id.user_id.email}</Text>,
      },
      {
        title: () => <Tag color="success">Present</Tag>,
        key: "present",
        width: 100,
        align: "center",
        render: (_, record) => (
          <Radio
            checked={studentAttendances[record.student_id._id] === "present"}
            onChange={() =>
              handleAttendanceChange(record.student_id._id, "present")
            }
          />
        ),
      },
      {
        title: () => <Tag color="error">Absent</Tag>,
        key: "absent",
        width: 100,
        align: "center",
        render: (_, record) => (
          <Radio
            checked={studentAttendances[record.student_id._id] === "absent"}
            onChange={() =>
              handleAttendanceChange(record.student_id._id, "absent")
            }
          />
        ),
      },
      {
        title: () => <Tag color="warning">Late</Tag>,
        key: "late",
        width: 100,
        align: "center",
        render: (_, record) => (
          <Radio
            checked={studentAttendances[record.student_id._id] === "late"}
            onChange={() =>
              handleAttendanceChange(record.student_id._id, "late")
            }
          />
        ),
      },
    ],
    [studentAttendances, handleAttendanceChange]
  );

  // Empty state renderer
  const renderEmpty = useCallback(() => {
    return (
      <Empty
        description={
          <span>
            {searchText ? "No students match your search" : "No students found"}
          </span>
        }
      />
    );
  }, [searchText]);

  return (
    <Card>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Space>
            <Button icon={<RollbackOutlined />} onClick={() => navigate(-1)}>
              Back
            </Button>
            {permissions.canCreate &&
              (user?.role === "admin" ||
                user?.role === "staff" ||
                user?.role === "tutor") && (
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSubmit}
                  loading={submitting}
                >
                  Save Attendance
                </Button>
              )}
          </Space>
        </Col>
        <Col>
          <Space align="center" size="large">
            {schedule && (
              <Space direction="vertical" size={0}>
                <Text strong>Schedule Time:</Text>
                <Text>
                  {new Date(schedule.start_time).toLocaleString()}
                  {" - "}
                  {new Date(schedule.end_time).toLocaleString()}
                </Text>
              </Space>
            )}
            <Input
              placeholder="Search students..."
              prefix={<SearchOutlined />}
              style={{ width: 300 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Space>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={filteredStudents}
        rowKey={(record) => record.student_id._id}
        loading={loading}
        bordered
        pagination={{
          ...pagination,
          showSizeChanger: true,
          pageSizeOptions: ["20", "50", "100"],
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} students`,
        }}
        onChange={(newPagination) => setPagination(newPagination)}
        locale={{
          emptyText: renderEmpty(),
        }}
      />
    </Card>
  );
};

export default ListAttendance;
