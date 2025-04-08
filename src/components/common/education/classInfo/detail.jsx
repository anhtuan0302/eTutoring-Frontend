import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  Descriptions,
  Button,
  Space,
  message,
  Tag,
  Tabs,
  Table,
  Avatar,
  Row,
  Col,
  Statistic,
  Progress,
  Typography,
  Divider,
  Popconfirm,
  Tooltip,
  Calendar,
  Menu,
  Dropdown,
  Modal,
  List,
  Empty,
  Badge,
  Image,
} from "antd";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import { getClassById } from "../../../../api/education/classInfo";
import { unenrollStudent } from "../../../../api/education/enrollment";
import { removeTutor } from "../../../../api/education/classTutor";
import firebaseNotificationService from "../../../../api/firebaseNotification";
import {
  deleteSchedule,
  updateSchedule,
} from "../../../../api/education/classSchedule";
import {
  RollbackOutlined,
  EditOutlined,
  UserOutlined,
  TeamOutlined,
  BookOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StarOutlined,
  TrophyOutlined,
  EyeOutlined,
  DeleteOutlined,
  FileOutlined,
  FileTextOutlined,
  TableOutlined,
  PlusOutlined,
  EllipsisOutlined,
  DownloadOutlined,
  LinkOutlined,
  ClockCircleOutlined,
  PaperClipOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const ClassDetail = ({ basePath, customPermissions }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("1");
  const [selectedStudentKeys, setSelectedStudentKeys] = useState([]);
  const [selectedTutorKeys, setSelectedTutorKeys] = useState([]);
  const [selectedScheduleKeys, setSelectedScheduleKeys] = useState([]);
  const [scheduleViewMode, setScheduleViewMode] = useState("table");

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
          canView: true,
          canEdit: true,
        };
      default:
        return {
          canView: true,
          canEdit: false,
        };
    }
  }, [customPermissions, user?.role]);

  useEffect(() => {
    const fetchClassDetail = async () => {
      try {
        setLoading(true);
        const response = await getClassById(id);
        setClassInfo(response);
      } catch (error) {
        message.error("Failed to load class details");
        console.error("Error fetching class:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClassDetail();
  }, [id]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return "green";
      case "closed":
        return "red";
      case "in progress":
        return "blue";
      default:
        return "default";
    }
  };

  // Tính toán các thống kê
  const statistics = useMemo(() => {
    if (!classInfo) return null;

    const enrollments = classInfo.enrollments || [];
    const tutors = classInfo.tutors || [];
    const schedules = classInfo.schedules || [];
    const validGrades = enrollments
      .filter((e) => e.grade != null)
      .map((e) => e.grade);

    return {
      total_students: enrollments.length,
      active_students: enrollments.filter((e) => e.status === "active").length,
      total_tutors: tutors.length,
      total_schedules: schedules.length,
      primary_tutors: tutors.filter((t) => t.is_primary).length,
      grade_statistics: {
        highest_grade: validGrades.length ? Math.max(...validGrades) : 0,
        lowest_grade: validGrades.length ? Math.min(...validGrades) : 0,
        average_grade: validGrades.length
          ? validGrades.reduce((a, b) => a + b, 0) / validGrades.length
          : 0,
      },
    };
  }, [classInfo]);

  // Thêm hàm tính tỷ lệ vắng mặt
const calculateAbsentRate = useCallback((studentId) => {
  // Lấy tổng số buổi học
  const totalSchedules = classInfo.schedules?.length || 0;
  if (totalSchedules === 0) return 0;

  // Đếm số buổi vắng mặt
  const absentCount = classInfo.schedules?.reduce((count, schedule) => {
    // Tìm attendance của sinh viên trong buổi học này
    const attendance = schedule.attendances?.find(
      (a) => a.student_id === studentId
    );
    // Nếu không có attendance hoặc status là absent thì tính là vắng
    return count + ((!attendance || attendance.status === 'absent') ? 1 : 0);
  }, 0) || 0;

  // Tính tỷ lệ phần trăm
  return Math.round((absentCount / totalSchedules) * 100);
}, [classInfo]);

const handleUnenrollStudent = useCallback(
  async (enrollmentId) => {
    try {
      // Tìm thông tin enrollment trước khi unenroll
      const enrollment = classInfo.enrollments.find(e => e._id === enrollmentId);
      if (!enrollment) {
        throw new Error("Enrollment not found");
      }

      // Unenroll sinh viên
      await unenrollStudent(enrollmentId);
      
      // Gửi thông báo cho sinh viên
      await firebaseNotificationService.createNotification(
        enrollment.student_id.user_id._id, // user_id của sinh viên
        {
          content: `You unenrolled from ${classInfo.code} - ${classInfo.course_id?.name}`,
          notification_type: "class_unenrolled",
          reference_type: "class",
          reference_id: classInfo._id
        }
      );

      message.success("Student unenrolled successfully");
      
      // Refresh lại dữ liệu lớp học
      const response = await getClassById(id);
      setClassInfo(response);
      setSelectedStudentKeys([]);
    } catch (error) {
      message.error(error.response?.data?.error || "Error unenrolling student");
    }
  },
  [id, classInfo]
);


const handleBulkUnenroll = useCallback(async () => {
  try {
    // Lấy danh sách các enrollment được chọn
    const selectedEnrollments = classInfo.enrollments.filter(e => 
      selectedStudentKeys.includes(e._id)
    );

    // Unenroll từng sinh viên và gửi thông báo
    await Promise.all(selectedEnrollments.map(async (enrollment) => {
      await unenrollStudent(enrollment._id);
      
      // Gửi thông báo cho sinh viên
      await firebaseNotificationService.createNotification(
        enrollment.student_id.user_id._id,
        {
          content: `You unenrolled from ${classInfo.code} - ${classInfo.course_id?.name}`,
          notification_type: "class_unenrolled",
          reference_type: "class",
          reference_id: classInfo._id
        }
      );
    }));

    message.success(`Unenrolled ${selectedStudentKeys.length} students successfully`);
    
    // Refresh lại dữ liệu lớp học
    const response = await getClassById(id);
    setClassInfo(response);
    setSelectedStudentKeys([]);
  } catch (error) {
    message.error("Error unenrolling students");
  }
}, [selectedStudentKeys, id, classInfo]);

const handleRemoveTutor = useCallback(
  async (tutorId) => {
    try {
      // Tìm thông tin tutor trước khi xóa
      const tutorRecord = classInfo.tutors.find(t => t._id === tutorId);
      if (!tutorRecord) {
        throw new Error("Tutor record not found");
      }

      // Xóa tutor khỏi lớp
      await removeTutor(tutorId);
      
      // Gửi thông báo cho tutor
      await firebaseNotificationService.createNotification(
        tutorRecord.tutor_id.user_id._id, // user_id của tutor
        {
          content: `You unenrolled from ${classInfo.code} - ${classInfo.course_id?.name}`,
          notification_type: "class_unenrolled",
          reference_type: "class",
          reference_id: classInfo._id
        }
      );
      
      message.success("Tutor removed successfully");
      
      // Refresh lại dữ liệu lớp học
      const response = await getClassById(id);
      setClassInfo(response);
      setSelectedTutorKeys([]);
    } catch (error) {
      message.error(error.response?.data?.error || "Error removing tutor");
    }
  },
  [id, classInfo]
);

const handleBulkRemoveTutors = useCallback(async () => {
  try {
    // Lấy danh sách các tutor record được chọn
    const selectedTutorRecords = classInfo.tutors.filter(t => 
      selectedTutorKeys.includes(t._id)
    );

    // Xóa từng tutor và gửi thông báo
    await Promise.all(selectedTutorRecords.map(async (tutorRecord) => {
      await removeTutor(tutorRecord._id);
      
      // Gửi thông báo cho tutor
      await firebaseNotificationService.createNotification(
        tutorRecord.tutor_id.user_id._id,
        {
          content: `You unenrolled from ${classInfo.code} - ${classInfo.course_id?.name}`,
          notification_type: "class_unenrolled",
          reference_type: "class",
          reference_id: classInfo._id
        }
      );
    }));

    message.success(`Removed ${selectedTutorKeys.length} tutors successfully`);
    
    // Refresh lại dữ liệu lớp học
    const response = await getClassById(id);
    setClassInfo(response);
    setSelectedTutorKeys([]);
  } catch (error) {
    message.error("Error removing tutors");
  }
}, [selectedTutorKeys, id, classInfo]);

  const handleDeleteSchedule = async (scheduleId) => {
    try {
      await deleteSchedule(scheduleId);
      message.success("Schedule deleted successfully");
      // Refresh lại data
      const response = await getClassById(id);
      setClassInfo(response);
      setSelectedScheduleKeys([]);
    } catch (error) {
      message.error(error.response?.data?.error || "Error deleting schedule");
    }
  };

  const handleBulkDeleteSchedules = async () => {
    try {
      await Promise.all(selectedScheduleKeys.map((id) => deleteSchedule(id)));
      message.success(
        `Deleted ${selectedScheduleKeys.length} schedules successfully`
      );
      // Refresh lại data
      const response = await getClassById(id);
      setClassInfo(response);
      setSelectedScheduleKeys([]);
    } catch (error) {
      message.error("Error deleting schedules");
    }
  };

  const materials = useMemo(() => {
    return (
      classInfo?.contents?.filter(
        (content) => content.content_type === "material"
      ) || []
    );
  }, [classInfo]);

  const assignments = useMemo(() => {
    return (
      classInfo?.contents?.filter(
        (content) => content.content_type === "assignment"
      ) || []
    );
  }, [classInfo]);

  // Hàm format dung lượng file
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Component hiển thị attachments
  const AttachmentsList = ({ attachments }) => {
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewMedia, setPreviewMedia] = useState(null);

    // Hàm kiểm tra loại file
    const getFileType = (fileName) => {
      const extension = fileName.split(".").pop().toLowerCase();
      if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension))
        return "image";
      if (["mp4", "webm", "ogg"].includes(extension)) return "video";
      if (["mp3", "wav"].includes(extension)) return "audio";
      return "other";
    };

    // Hàm xử lý preview
    const handlePreview = (attachment) => {
      setPreviewMedia(attachment);
      setPreviewVisible(true);
    };

    // Component render preview content
    const PreviewContent = ({ media }) => {
      const fileType = getFileType(media.file_name);
      const fileUrl = `http://localhost:8000/${media.file_path}`;

      switch (fileType) {
        case "image":
          return <Image src={fileUrl} style={{ maxWidth: "100%" }} />;
        case "video":
          return (
            <video controls style={{ maxWidth: "100%" }}>
              <source
                src={fileUrl}
                type={`video/${media.file_name.split(".").pop()}`}
              />
              Your browser does not support the video tag.
            </video>
          );
        case "audio":
          return (
            <audio controls style={{ width: "100%" }}>
              <source
                src={fileUrl}
                type={`audio/${media.file_name.split(".").pop()}`}
              />
              Your browser does not support the audio tag.
            </audio>
          );
        default:
          return null;
      }
    };

    return (
      <>
        <List
          size="small"
          dataSource={attachments}
          renderItem={(attachment) => {
            const fileType = getFileType(attachment.file_name);
            const isPreviewable = ["image", "video", "audio"].includes(
              fileType
            );

            return (
              <List.Item
                actions={[
                  isPreviewable && (
                    <Button
                      type="link"
                      icon={
                        fileType === "video" ? (
                          <PlayCircleOutlined />
                        ) : (
                          <EyeOutlined />
                        )
                      }
                      onClick={() => handlePreview(attachment)}
                    >
                      Preview
                    </Button>
                  ),
                  <Button
                    type="link"
                    icon={<DownloadOutlined />}
                    href={`http://localhost:8000/${attachment.file_path}`}
                    target="_blank"
                  >
                    Download
                  </Button>,
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={
                    fileType === "image" ? (
                      <Image
                        src={`http://localhost:8000/${attachment.file_path}`}
                        width={40}
                        height={40}
                        style={{ objectFit: "cover" }}
                        preview={false}
                      />
                    ) : (
                      <PaperClipOutlined />
                    )
                  }
                  title={attachment.file_name}
                  description={formatFileSize(attachment.file_size)}
                />
              </List.Item>
            );
          }}
        />

        <Modal
          open={previewVisible}
          title={previewMedia?.file_name}
          footer={null}
          onCancel={() => setPreviewVisible(false)}
          width={800}
          centered
        >
          {previewMedia && <PreviewContent media={previewMedia} />}
        </Modal>
      </>
    );
  };

  const studentColumns = [
    {
      title: "No.",
      key: "no",
      render: (_, record, index) => index + 1,
    },
    {
      title: "Student",
      key: "student",
      render: (_, record) => (
        <Space>
          <Avatar
            size={60}
            src={
              record.student_id.user_id.avatar_path
                ? `http://localhost:8000/${record.student_id.user_id.avatar_path}`
                : "/default-avatar.png"
            }
            icon={<UserOutlined />}
          />
          <Space direction="vertical" size={0}>
            <Text
              strong
            >{`${record.student_id.user_id.first_name} ${record.student_id.user_id.last_name}`}</Text>
            <Text type="secondary">{record.student_id.student_code}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: "Contact",
      key: "contact",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>Email: {record.student_id.user_id.email}</Text>
          <Text>Phone: {record.student_id.user_id.phone_number || "N/A"}</Text>
        </Space>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => {
        const absentRate = calculateAbsentRate(record.student_id._id);
        let color = 'green';
        if (absentRate > 30) {
          color = 'red';
        } else if (absentRate > 20) {
          color = 'orange';
        } else if (absentRate > 10) {
          color = 'gold';
        }
  
        return (
          <Space direction="vertical" size={0}>
            <Tag color={record.status === "active" ? "green" : "red"}>
              {record.status?.toUpperCase()}
            </Tag>
            <Tag color={color}>
              {absentRate}% Absent
            </Tag>
          </Space>
        );
      },
    },
    {
      title: "Grade",
      dataIndex: "grade",
      render: (grade) => (
        <Tag color={grade >= 5 ? "green" : "red"}>
          {grade?.toFixed(1) || "N/A"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Student">
            <Button
              type="default"
              icon={<EyeOutlined />}
              size="small"
              onClick={() =>
                navigate(
                  `${effectiveBasePath}/student/${record.student_id._id}`
                )
              }
            />
          </Tooltip>
          <Tooltip title="Unenroll">
            <Popconfirm
              title="Are you sure you want to unenroll this student?"
              onConfirm={() => handleUnenrollStudent(record._id)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="primary"
                icon={<DeleteOutlined />}
                size="small"
                danger
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const tutorColumns = [
    {
      title: "Tutor",
      key: "tutor",
      render: (_, record) => (
        <Space>
          <Avatar
            size={60}
            src={
              record.tutor_id.user_id.avatar_path
                ? `http://localhost:8000/${record.tutor_id.user_id.avatar_path}`
                : "/default-avatar.png"
            }
            icon={<UserOutlined />}
          />
          <Space direction="vertical" size={0}>
            <Text
              strong
            >{`${record.tutor_id.user_id.first_name} ${record.tutor_id.user_id.last_name}`}</Text>
            <Text type="secondary">{record.tutor_id.tutor_code}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: "Contact",
      key: "contact",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>Email: {record.tutor_id.user_id.email}</Text>
          <Text>Phone: {record.tutor_id.user_id.phone_number || "N/A"}</Text>
        </Space>
      ),
    },
    {
      title: "Role",
      key: "role",
      render: (_, record) => (
        <Tag color={record.is_primary ? "blue" : "default"}>
          {record.is_primary ? "Primary Tutor" : "Assistant Tutor"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Tutor">
            <Button
              type="default"
              icon={<EyeOutlined />}
              size="small"
              onClick={() =>
                navigate(`${effectiveBasePath}/tutor/${record.tutor_id._id}`)
              }
            />
          </Tooltip>
          <Tooltip title="Remove">
            <Popconfirm
              title="Are you sure you want to remove this tutor?"
              onConfirm={() => handleRemoveTutor(record._id)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="primary"
                icon={<DeleteOutlined />}
                size="small"
                danger
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const scheduleColumns = [
    {
      title: "No.",
      key: "no",
      render: (_, __, index) => <Text>{index + 1}</Text>,
    },
    {
      title: "Date & Time",
      key: "datetime",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>
            {new Date(record.start_time).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
          <Text type="secondary">
            {new Date(record.start_time).toLocaleTimeString().slice(0, 5)} -{" "}
            {new Date(record.end_time).toLocaleTimeString().slice(0, 5)}
          </Text>
        </Space>
      ),
    },
    {
      title: "Location",
      key: "location",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Tag color={record.is_online ? "blue" : "green"}>
            {record.is_online ? "Online" : "Offline"}
          </Tag>
          <Text>{record.is_online ? record.online_link : record.location}</Text>
        </Space>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => (
        <Tag color={record.status === "completed" ? "green" : "blue"}>
          {record.status?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
        <Tooltip title="View Attendance">
          <Button
            type="default"
            icon={<EyeOutlined />}
            size="small"
            onClick={() =>
              navigate(`${effectiveBasePath}/attendance/schedule/${record._id}`)
            }
          />
        </Tooltip>
        <Tooltip title="Edit Schedule">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            style={{ backgroundColor: "#faad14" }}
            onClick={() =>
              navigate(
                `${effectiveBasePath}/classInfo/${id}/schedule/${record._id}/edit`
              )
            }
          />
        </Tooltip>
        <Tooltip title="Delete">
          <Popconfirm
            title="Are you sure you want to delete this schedule?"
            onConfirm={() => handleDeleteSchedule(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              icon={<DeleteOutlined />}
              size="small"
              danger
            />
          </Popconfirm>
        </Tooltip>
      </Space>
      ),
    },
  ];

  if (loading) {
    return <Card loading={true} />;
  }

  if (!classInfo) {
    return (
      <Card>
        <div>Class not found</div>
      </Card>
    );
  }

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Row justify="space-between" align="middle">
          <Space>
            {selectedStudentKeys.length > 0 && (
              <Popconfirm
                title={`Are you sure you want to unenroll ${selectedStudentKeys.length} selected students?`}
                onConfirm={handleBulkUnenroll}
                okText="Yes"
                cancelText="No"
              >
                <Button type="primary" danger icon={<DeleteOutlined />}>
                  Unenroll Selected ({selectedStudentKeys.length})
                </Button>
              </Popconfirm>
            )}
            {selectedTutorKeys.length > 0 && (
              <Popconfirm
                title={`Are you sure you want to remove ${selectedTutorKeys.length} selected tutors?`}
                onConfirm={handleBulkRemoveTutors}
                okText="Yes"
                cancelText="No"
              >
                <Button type="primary" danger icon={<DeleteOutlined />}>
                  Remove Tutors ({selectedTutorKeys.length})
                </Button>
              </Popconfirm>
            )}
          </Space>
        </Row>

        {/* Detailed Info Tabs */}
        <Card>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: "1",
                label: (
                  <span>
                    <BookOutlined style={{ marginRight: 3 }} />
                    Class Details
                  </span>
                ),
                children: (
                  <div>
                    <div style={{ margin: "16px 0" }}>
                      <Row gutter={[24, 24]}>
                        <Col span={18}>
                          <Space align="center" size="large">
                            <Title level={3}>{classInfo.code}</Title>
                            <Tag color={getStatusColor(classInfo.status)}>
                              {classInfo.status?.toUpperCase()}
                            </Tag>
                          </Space>
                          <Text type="secondary">
                            {classInfo.course_id?.name} (
                            {classInfo.course_id?.code})
                          </Text>
                        </Col>
                        <Col span={6}>
                          {permissions.canEdit && (
                            <Button
                              type="primary"
                              style={{ float: "right" }}
                              icon={<EditOutlined />}
                              onClick={() =>
                                navigate(
                                  `${effectiveBasePath}/classInfo/${id}/edit`
                                )
                              }
                            >
                              Edit Class
                            </Button>
                          )}
                        </Col>
                      </Row>

                      <Divider />

                      <Row gutter={[24, 24]}>
                        <Col span={4}>
                          <Statistic
                            title="Students"
                            value={statistics.total_students}
                            suffix={`/ ${classInfo.max_students}`}
                            prefix={<TeamOutlined />}
                          />
                        </Col>
                        <Col span={4}>
                          <Statistic
                            title="Tutors"
                            value={statistics.total_tutors}
                            prefix={<UserOutlined />}
                          />
                        </Col>
                        <Col span={4}>
                          <Statistic
                            title="Average Grade"
                            value={statistics.grade_statistics.average_grade.toFixed(
                              1
                            )}
                            prefix={<TrophyOutlined />}
                          />
                        </Col>
                        <Col span={4}>
                          <Statistic
                            title="Highest Grade"
                            value={statistics.grade_statistics.highest_grade.toFixed(
                              1
                            )}
                            valueStyle={{ color: "#3f8600" }}
                          />
                        </Col>
                        <Col span={4}>
                          <Statistic
                            title="Lowest Grade"
                            value={statistics.grade_statistics.lowest_grade.toFixed(
                              1
                            )}
                            valueStyle={{ color: "#cf1322" }}
                          />
                        </Col>
                      </Row>
                    </div>
                    <Descriptions bordered column={2}>
                      <Descriptions.Item label="Department">
                        {classInfo.course_id?.department_id?.name}
                      </Descriptions.Item>
                      <Descriptions.Item label="Course">
                        {classInfo.course_id?.code} -{" "}
                        {classInfo.course_id?.name}
                      </Descriptions.Item>
                      <Descriptions.Item label="Start Date">
                        {new Date(classInfo.start_date).toLocaleDateString()}
                      </Descriptions.Item>
                      <Descriptions.Item label="End Date">
                        {new Date(classInfo.end_date).toLocaleDateString()}
                      </Descriptions.Item>
                      <Descriptions.Item label="Maximum Students">
                        {classInfo.max_students}
                      </Descriptions.Item>
                      <Descriptions.Item label="Current Students">
                        {statistics.total_students}
                      </Descriptions.Item>
                      <Descriptions.Item label="Created At">
                        {new Date(classInfo.createdAt).toLocaleString()}
                      </Descriptions.Item>
                      <Descriptions.Item label="Updated At">
                        {new Date(classInfo.updatedAt).toLocaleString()}
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                ),
              },
              {
                key: "2",
                label: (
                  <span>
                    <TeamOutlined style={{ marginRight: 3 }} />
                    Students ({statistics.total_students})
                  </span>
                ),
                children: (
                  <Table
                    columns={studentColumns}
                    dataSource={classInfo.enrollments}
                    rowKey={(record) => record._id}
                    pagination={{
                      showSizeChanger: true,
                      showTotal: (total) => `Total ${total} students`,
                    }}
                    rowSelection={{
                      selectedRowKeys: selectedStudentKeys,
                      onChange: (selectedRowKeys) => {
                        setSelectedStudentKeys(selectedRowKeys);
                      },
                    }}
                  />
                ),
              },
              {
                key: "3",
                label: (
                  <span>
                    <UserOutlined style={{ marginRight: 3 }} />
                    Tutors ({statistics.total_tutors})
                  </span>
                ),
                children: (
                  <Table
                    columns={tutorColumns}
                    dataSource={classInfo.tutors}
                    rowKey={(record) => record._id}
                    pagination={false}
                    rowSelection={{
                      selectedRowKeys: selectedTutorKeys,
                      onChange: (selectedRowKeys) => {
                        setSelectedTutorKeys(selectedRowKeys);
                      },
                    }}
                  />
                ),
              },
              {
                key: "4",
                label: (
                  <span>
                    <CalendarOutlined style={{ marginRight: 3 }} />
                    Schedules ({classInfo.schedules?.length || 0})
                  </span>
                ),
                children: (
                  <div>
                    <Row justify="space-between" style={{ marginBottom: 16 }}>
                      <Col>
                        <Space>
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() =>
                              navigate(
                                `${effectiveBasePath}/classInfo/${id}/schedule/create`
                              )
                            }
                          >
                            Add Schedule
                          </Button>
                          {scheduleViewMode === "table" &&
                            selectedScheduleKeys.length > 0 && (
                              <Popconfirm
                                title={`Are you sure you want to delete ${selectedScheduleKeys.length} selected schedules?`}
                                onConfirm={handleBulkDeleteSchedules}
                                okText="Yes"
                                cancelText="No"
                              >
                                <Button
                                  type="primary"
                                  danger
                                  icon={<DeleteOutlined />}
                                >
                                  Delete Selected ({selectedScheduleKeys.length}
                                  )
                                </Button>
                              </Popconfirm>
                            )}
                        </Space>
                      </Col>
                      <Col>
                        <Space>
                          <Button.Group>
                            <Button
                              type={
                                scheduleViewMode === "table"
                                  ? "primary"
                                  : "default"
                              }
                              icon={<TableOutlined />}
                              onClick={() => setScheduleViewMode("table")}
                            >
                              Table View
                            </Button>
                            <Button
                              type={
                                scheduleViewMode === "calendar"
                                  ? "primary"
                                  : "default"
                              }
                              icon={<CalendarOutlined />}
                              onClick={() => setScheduleViewMode("calendar")}
                            >
                              Calendar View
                            </Button>
                          </Button.Group>
                        </Space>
                      </Col>
                    </Row>

                    {scheduleViewMode === "table" ? (
                      <Table
                        columns={scheduleColumns}
                        dataSource={classInfo.schedules}
                        rowKey={(record) => record._id}
                        pagination={{
                          showSizeChanger: true,
                          showTotal: (total) => `Total ${total} schedules`,
                        }}
                        rowSelection={{
                          selectedRowKeys: selectedScheduleKeys,
                          onChange: (selectedRowKeys) => {
                            setSelectedScheduleKeys(selectedRowKeys);
                          },
                        }}
                      />
                    ) : (
                      <Calendar
                        mode="month"
                        dateCellRender={(date) => {
                          const scheduleEvents = classInfo.schedules?.filter(
                            (schedule) => {
                              const scheduleDate = new Date(
                                schedule.start_time
                              );
                              return (
                                scheduleDate.getDate() === date.date() &&
                                scheduleDate.getMonth() === date.month() &&
                                scheduleDate.getFullYear() === date.year()
                              );
                            }
                          );

                          return (
                            <ul
                              style={{
                                listStyle: "none",
                                padding: 0,
                                margin: 0,
                              }}
                            >
                              {scheduleEvents?.map((schedule) => (
                                <li
                                  key={schedule._id}
                                  style={{ marginBottom: "4px" }}
                                >
                                  <Tooltip
                                    title={
                                      <div>
                                        <div>
                                          Time:{" "}
                                          {new Date(schedule.start_time)
                                            .toLocaleTimeString()
                                            .slice(0, 5)}{" "}
                                          -{" "}
                                          {new Date(schedule.end_time)
                                            .toLocaleTimeString()
                                            .slice(0, 5)}
                                        </div>
                                        <div>
                                          Location:{" "}
                                          {schedule.is_online
                                            ? "Online"
                                            : schedule.location}
                                        </div>
                                        <div>
                                          {schedule.is_online && (
                                            <div>
                                              Online Link:{" "}
                                              <a
                                                href={schedule.online_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                              >
                                                {schedule.online_link}
                                              </a>
                                            </div>
                                          )}
                                        </div>
                                        <div>Status: {schedule.status}</div>
                                      </div>
                                    }
                                  >
                                    <Card
                                      size="small"
                                      style={{
                                        backgroundColor: schedule.is_online
                                          ? "#e6f7ff"
                                          : "#f6ffed",
                                        cursor: "pointer",
                                        marginBottom: 4,
                                      }}
                                    >
                                      <Space
                                        direction="vertical"
                                        size={0}
                                        style={{ width: "100%" }}
                                      >
                                        <Text
                                          strong
                                          style={{ fontSize: "12px" }}
                                        >
                                          {new Date(
                                            schedule.start_time
                                          ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}{" "}
                                          -{" "}
                                          {new Date(
                                            schedule.end_time
                                          ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </Text>
                                        <Tag
                                          color={
                                            schedule.is_online
                                              ? "blue"
                                              : "green"
                                          }
                                          style={{
                                            margin: 0,
                                            fontSize: "10px",
                                          }}
                                        >
                                          {schedule.is_online
                                            ? "Online"
                                            : "Offline"}
                                        </Tag>
                                      </Space>
                                    </Card>
                                  </Tooltip>
                                  <Dropdown
                                    overlay={
                                      <Menu>
                                        <Menu.Item
                                          icon={<EditOutlined />}
                                          onClick={() =>
                                            navigate(
                                              `${effectiveBasePath}/classInfo/${id}/schedule/${schedule._id}/edit`
                                            )
                                          }
                                        >
                                          Edit
                                        </Menu.Item>
                                        <Menu.Item
                                          danger
                                          icon={<DeleteOutlined />}
                                          onClick={() => {
                                            Modal.confirm({
                                              title: "Delete Schedule",
                                              content:
                                                "Are you sure you want to delete this schedule?",
                                              okText: "Yes",
                                              okType: "danger",
                                              cancelText: "No",
                                              onOk: () =>
                                                handleDeleteSchedule(
                                                  schedule._id
                                                ),
                                            });
                                          }}
                                        >
                                          Delete
                                        </Menu.Item>
                                      </Menu>
                                    }
                                    trigger={["click"]}
                                  >
                                    <Button
                                      type="text"
                                      size="small"
                                      icon={<EllipsisOutlined />}
                                      style={{
                                        position: "absolute",
                                        right: 0,
                                        top: 0,
                                        padding: 0,
                                      }}
                                    />
                                  </Dropdown>
                                </li>
                              ))}
                            </ul>
                          );
                        }}
                      />
                    )}
                  </div>
                ),
              },
              {
                key: "5",
                label: (
                  <span>
                    <FileOutlined style={{ marginRight: 3 }} />
                    Materials ({materials.length})
                  </span>
                ),
                children: (
                  <div style={{ padding: "24px 0" }}>
                    {materials.length > 0 ? (
                      <List
                        grid={{ gutter: 16, column: 2 }}
                        dataSource={materials}
                        renderItem={(material) => (
                          <List.Item>
                            <Card
                              title={material.title}
                              extra={
                                <Text type="secondary">
                                  {new Date(material.createdAt)
                                    .toLocaleTimeString()
                                    .slice(0, 5) +
                                    " - " +
                                    new Date(
                                      material.createdAt
                                    ).toLocaleDateString()}
                                </Text>
                              }
                            >
                              <Space
                                direction="vertical"
                                style={{ width: "100%" }}
                              >
                                {material.description && (
                                  <Typography.Paragraph>
                                    {material.description}
                                  </Typography.Paragraph>
                                )}

                                {material.attachments?.length > 0 && (
                                  <div style={{ marginTop: 16 }}>
                                    <Divider orientation="left">
                                      <PaperClipOutlined /> Attachments
                                    </Divider>
                                    <AttachmentsList
                                      attachments={material.attachments}
                                    />
                                  </div>
                                )}
                              </Space>
                            </Card>
                          </List.Item>
                        )}
                      />
                    ) : (
                      <Empty description="No materials available" />
                    )}
                  </div>
                ),
              },
              {
                key: "6",
                label: (
                  <span>
                    <FileTextOutlined style={{ marginRight: 3 }} />
                    Assignments ({assignments.length})
                  </span>
                ),
                children: (
                  <div style={{ padding: "24px 0" }}>
                    {assignments.length > 0 ? (
                      <List
                        grid={{ gutter: 16, column: 2 }}
                        dataSource={assignments}
                        renderItem={(assignment) => (
                          <List.Item>
                            <Badge.Ribbon
                              text={
                                new Date(assignment.duedate) < new Date()
                                  ? "Expired"
                                  : "Active"
                              }
                              color={
                                new Date(assignment.duedate) < new Date()
                                  ? "red"
                                  : "green"
                              }
                            >
                              <Card
                                title={assignment.title}
                                extra={
                                  <Space>
                                    <ClockCircleOutlined />
                                    <Text type="secondary">
                                      Due:{" "}
                                      {new Date(
                                        assignment.duedate
                                      ).toLocaleDateString()}
                                    </Text>
                                  </Space>
                                }
                              >
                                <Space
                                  direction="vertical"
                                  style={{ width: "100%" }}
                                >
                                  {assignment.description && (
                                    <Typography.Paragraph>
                                      {assignment.description}
                                    </Typography.Paragraph>
                                  )}

                                  {assignment.attachments?.length > 0 && (
                                    <div style={{ marginTop: 16 }}>
                                      <Divider orientation="left">
                                        <PaperClipOutlined /> Attachments
                                      </Divider>
                                      <AttachmentsList
                                        attachments={assignment.attachments}
                                      />
                                    </div>
                                  )}
                                </Space>
                              </Card>
                            </Badge.Ribbon>
                          </List.Item>
                        )}
                      />
                    ) : (
                      <Empty description="No assignments available" />
                    )}
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </Space>
    </div>
  );
};

export default ClassDetail;
