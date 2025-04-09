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
  Upload,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Breadcrumb,
} from "antd";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import { getClassById } from "../../../../api/education/classInfo";
import { unenrollStudent } from "../../../../api/education/enrollment";
import { removeTutor } from "../../../../api/education/classTutor";
import {
  createSubmission,
  getSubmissionsByAssignment,
} from "../../../../api/education/submission";
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
  UploadOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { getStudentAttendance } from "../../../../api/education/attendance";
import { createClassContent } from "../../../../api/education/classContent";

import { staticURL } from "../../../../api/config";

const { Title, Text } = Typography;

// Material Modal Component
const MaterialModal = ({ 
  isVisible, 
  onCancel, 
  classId,
  onSuccess 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('classInfo_id', classId);
      formData.append('title', values.title);
      formData.append('description', values.description || '');
      formData.append('content_type', 'material');
      
      // Append all files - using the correct file property from antd Upload component
      fileList.forEach((file, index) => {
        console.log(`File ${index}:`, file);
        
        // Get the right file object - antd Upload adds the original file in originFileObj
        const fileObj = file.originFileObj || file;
        
        if (fileObj && fileObj instanceof File) {
          formData.append('files', fileObj);
          console.log(`Appended file ${index} to FormData: ${fileObj.name}`);
        } else {
          console.warn(`File ${index} is not a valid File object`, fileObj);
        }
      });

      // Log final FormData entries
      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value instanceof File ? `File: ${value.name}` : value);
      }
      
      const response = await createClassContent(formData);
      console.log('Upload response:', response);
      message.success('Thêm tài liệu thành công');
      onSuccess();
      onCancel();
      // Reset form and file list
      form.resetFields();
      setFileList([]);
    } catch (error) {
      console.error('Upload error:', error);
      message.error('Thêm tài liệu thất bại: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      console.log('Before upload file:', file);
      setFileList(prev => [...prev, file]);
      return false;
    },
    onChange: ({ fileList: newFileList }) => {
      console.log('onChange fileList:', newFileList);
      setFileList(newFileList);
    },
    customRequest: ({ file, onSuccess }) => {
      console.log('Custom request file:', file);
      setTimeout(() => {
        onSuccess("ok");
      }, 0);
    },
    fileList,
    multiple: true,
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.webm'
  };

  return (
    <Modal
      title="Thêm tài liệu"
      open={isVisible}
      onCancel={onCancel}
      footer={null}
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item
          name="title"
          label="Tiêu đề"
          rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Mô tả">
          <Input.TextArea />
        </Form.Item>
        <Form.Item label="Tệp đính kèm">
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />}>Chọn tệp</Button>
          </Upload>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Thêm
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

// Assignment Modal Component
const AssignmentModal = ({ 
  isVisible, 
  onCancel, 
  classId,
  onSuccess 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('classInfo_id', classId);
      formData.append('title', values.title);
      formData.append('description', values.description || '');
      formData.append('content_type', 'assignment');
      formData.append('duedate', values.duedate.format('YYYY-MM-DD HH:mm:ss'));
      
      // Append all files - using the correct file property from antd Upload component
      fileList.forEach((file, index) => {
        console.log(`File ${index}:`, file);
        
        // Get the right file object - antd Upload adds the original file in originFileObj
        const fileObj = file.originFileObj || file;
        
        if (fileObj && fileObj instanceof File) {
          formData.append('files', fileObj);
          console.log(`Appended file ${index} to FormData: ${fileObj.name}`);
        } else {
          console.warn(`File ${index} is not a valid File object`, fileObj);
        }
      });

      // Log final FormData entries
      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value instanceof File ? `File: ${value.name}` : value);
      }
      
      const response = await createClassContent(formData);
      console.log('Upload response:', response);
      message.success('Thêm bài tập thành công');
      onSuccess();
      onCancel();
    } catch (error) {
      console.error('Upload error:', error);
      message.error('Thêm bài tập thất bại: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      console.log('Before upload file:', file);
      setFileList(prev => [...prev, file]);
      return false;
    },
    onChange: ({ fileList: newFileList }) => {
      console.log('onChange fileList:', newFileList);
      setFileList(newFileList);
    },
    customRequest: ({ file, onSuccess }) => {
      console.log('Custom request file:', file);
      setTimeout(() => {
        onSuccess("ok");
      }, 0);
    },
    fileList,
    multiple: true,
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.webm'
  };

  return (
    <Modal
      title="Thêm bài tập"
      open={isVisible}
      onCancel={onCancel}
      footer={null}
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item
          name="title"
          label="Tiêu đề"
          rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Mô tả">
          <Input.TextArea />
        </Form.Item>
        <Form.Item
          name="duedate"
          label="Hạn nộp"
          rules={[{ required: true, message: 'Vui lòng chọn hạn nộp' }]}
        >
          <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" />
        </Form.Item>
        <Form.Item label="Tệp đính kèm">
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />}>Chọn tệp</Button>
          </Upload>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Thêm
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

const ClassDetail = ({ basePath, customPermissions }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Main states
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("1");
  
  // Student and Tutor states
  const [selectedStudentKeys, setSelectedStudentKeys] = useState([]);
  const [selectedTutorKeys, setSelectedTutorKeys] = useState([]);
  
  // Schedule states
  const [selectedScheduleKeys, setSelectedScheduleKeys] = useState([]);
  const [scheduleViewMode, setScheduleViewMode] = useState("table");
  
  // Submission states
  const [submissionModalVisible, setSubmissionModalVisible] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState(null);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState({});
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [allSubmissions, setAllSubmissions] = useState({});
  const [selectedAssignmentFilter, setSelectedAssignmentFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  
  // Attendance states
  const [attendanceStats, setAttendanceStats] = useState({});
  
  // Material and Assignment states
  const [materialModalVisible, setMaterialModalVisible] = useState(false);
  const [assignmentModalVisible, setAssignmentModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

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
          canViewStatistics: true,
          canViewAttendance: true,
          canCreateSchedule: true,
          canEdit: true,
          canDelete: true,
          canSubmitAssignment: false,
        };
      case "tutor":
        return {
          canView: true,
          canViewStatistics: true,
          canViewAttendance: true,
          canCreateSchedule: false,
          canEdit: false,
          canDelete: false,
          canSubmitAssignment: false,
        };
      case "student":
        return {
          canView: true,
          canViewStatistics: false,
          canViewAttendance: false,
          canCreateSchedule: false,
          canEdit: false,
          canDelete: false,
          canSubmitAssignment: true,
        };
      default:
        return {
          canView: false,
          canViewStatistics: false,
          canViewAttendance: false,
          canCreateSchedule: false,
          canEdit: false,
          canDelete: false,
          canSubmitAssignment: false,
        };
    }
  }, [customPermissions, user?.role]);

  const isStudentandTutorEnrolled = useMemo(() => {
    if (user?.role === "admin" || user?.role === "staff") return true;

    if (user?.role === "student") {
      return classInfo?.enrollments?.some(
        (enrollment) => enrollment.student_id.user_id._id === user?._id
      );
    }

    if (user?.role === "tutor") {
      return classInfo?.tutors?.some(
        (tutor) => tutor.tutor_id.user_id._id === user?._id
      );
    }

    return false;
  }, [user, classInfo]);

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

  // Thêm useEffect để load attendance stats
  useEffect(() => {
    const loadAttendanceStats = async () => {
      if (!classInfo?.enrollments) return;

      try {
        const stats = {};
        for (const enrollment of classInfo.enrollments) {
          const response = await getStudentAttendance(
            classInfo._id,
            enrollment.student_id._id
          );
          if (response && response.stats) {
            stats[enrollment.student_id._id] = response.stats;
          }
        }
        setAttendanceStats(stats);
      } catch (error) {
        console.error("Error loading attendance stats:", error);
      }
    };

    loadAttendanceStats();
  }, [classInfo]);

  // Cập nhật hàm tính tỷ lệ vắng mặt
  const calculateAbsentRate = useCallback(
    (studentId) => {
      const stats = attendanceStats[studentId];
      if (!stats) return 0;
      return stats.absentRate || 0;
    },
    [attendanceStats]
  );

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

    // Tính toán điểm số từ submissions
    const allGrades = [];
    const studentAverages = new Map(); // Map để lưu điểm trung bình của mỗi sinh viên

    // Duyệt qua tất cả assignments
    classInfo.contents?.forEach(content => {
      if (content.content_type === 'assignment') {
        // Lấy tất cả submissions của assignment này
        const submissions = Object.values(allSubmissions)
          .flat()
          .filter(sub => 
            sub.assignment_id?._id === content._id && 
            sub.grade?.score != null
          );

        // Cập nhật điểm số cho từng sinh viên
        submissions.forEach(submission => {
          const studentId = submission.student_id?._id;
          if (studentId) {
            const currentGrades = studentAverages.get(studentId) || [];
            currentGrades.push(submission.grade.score);
            studentAverages.set(studentId, currentGrades);
          }
        });
      }
    });

    // Tính điểm trung bình cho mỗi sinh viên
    studentAverages.forEach((grades) => {
      if (grades.length > 0) {
        const average = grades.reduce((a, b) => a + b, 0) / grades.length;
        allGrades.push(average);
      }
    });

    return {
      total_students: enrollments.length,
      active_students: enrollments.filter((e) => e.status === "active").length,
      total_tutors: tutors.length,
      total_schedules: schedules.length,
      primary_tutors: tutors.filter((t) => t.is_primary).length,
      grade_statistics: {
        highest_grade: allGrades.length ? Math.max(...allGrades) : 0,
        lowest_grade: allGrades.length ? Math.min(...allGrades) : 0,
        average_grade: allGrades.length 
          ? allGrades.reduce((a, b) => a + b, 0) / allGrades.length 
          : 0,
        graded_students: allGrades.length // Số sinh viên đã có điểm
      },
    };
  }, [classInfo, allSubmissions]);

  const handleUnenrollStudent = useCallback(
    async (enrollmentId) => {
      try {
        // Tìm thông tin enrollment trước khi unenroll
        const enrollment = classInfo.enrollments.find(
          (e) => e._id === enrollmentId
        );
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
            reference_id: classInfo._id,
          }
        );

        message.success("Student unenrolled successfully");

        // Refresh lại dữ liệu lớp học
        const response = await getClassById(id);
        setClassInfo(response);
        setSelectedStudentKeys([]);
      } catch (error) {
        message.error(
          error.response?.data?.error || "Error unenrolling student"
        );
      }
    },
    [id, classInfo]
  );

  const handleBulkUnenroll = useCallback(async () => {
    try {
      // Lấy danh sách các enrollment được chọn
      const selectedEnrollments = classInfo.enrollments.filter((e) =>
        selectedStudentKeys.includes(e._id)
      );

      // Unenroll từng sinh viên và gửi thông báo
      await Promise.all(
        selectedEnrollments.map(async (enrollment) => {
          await unenrollStudent(enrollment._id);

          // Gửi thông báo cho sinh viên
          await firebaseNotificationService.createNotification(
            enrollment.student_id.user_id._id,
            {
              content: `You unenrolled from ${classInfo.code} - ${classInfo.course_id?.name}`,
              notification_type: "class_unenrolled",
              reference_type: "class",
              reference_id: classInfo._id,
            }
          );
        })
      );

      message.success(
        `Unenrolled ${selectedStudentKeys.length} students successfully`
      );

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
        const tutorRecord = classInfo.tutors.find((t) => t._id === tutorId);
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
            reference_id: classInfo._id,
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
      const selectedTutorRecords = classInfo.tutors.filter((t) =>
        selectedTutorKeys.includes(t._id)
      );

      // Xóa từng tutor và gửi thông báo
      await Promise.all(
        selectedTutorRecords.map(async (tutorRecord) => {
          await removeTutor(tutorRecord._id);

          // Gửi thông báo cho tutor
          await firebaseNotificationService.createNotification(
            tutorRecord.tutor_id.user_id._id,
            {
              content: `You unenrolled from ${classInfo.code} - ${classInfo.course_id?.name}`,
              notification_type: "class_unenrolled",
              reference_type: "class",
              reference_id: classInfo._id,
            }
          );
        })
      );

      message.success(
        `Removed ${selectedTutorKeys.length} tutors successfully`
      );

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

  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        const submissionsData = {};

        for (const assignment of assignments) {
          try {
            const response = await getSubmissionsByAssignment(assignment._id);


            // Nếu response là một object (không phải null)
            if (response && typeof response === "object") {
              // Kiểm tra xem response có phải là submission object không
              if (response._id && response.assignment_id) {
                // Trường hợp API trả về submission trực tiếp
                submissionsData[assignment._id] = response;
              } else if (response.data) {
                // Trường hợp API trả về wrapped object với data
                submissionsData[assignment._id] = response.data;
              }
            } else {
              submissionsData[assignment._id] = null;
            }

          } catch (error) {
            console.error(
              `Error loading submission for assignment ${assignment._id}:`,
              error
            );
            submissionsData[assignment._id] = null;
          }
        }

        setAssignmentSubmissions(submissionsData);
      } catch (error) {
        console.error("Error loading submissions:", error);
      }
    };

    if (assignments.length > 0) {
      loadSubmissions();
    }
  }, [assignments]);

  // Thêm hàm để lấy tất cả submissions
  const loadAllSubmissions = useCallback(async () => {
    try {
      setLoadingSubmissions(true);
      const submissionsData = {};

      for (const assignment of assignments) {
        try {
          const response = await getSubmissionsByAssignment(assignment._id);
          if (response?.data) {
            // Đảm bảo mỗi submission có thông tin sinh viên và assignment
            submissionsData[assignment._id] = response.data.map(
              (submission) => ({
                ...submission,
                assignment_id: {
                  _id: assignment._id, // Đảm bảo gán đúng assignment_id
                  title: assignment.title,
                },
              })
            );
          }
        } catch (error) {
          console.error(
            `Error loading submissions for assignment ${assignment._id}:`,
            error
          );
        }
      }

      setAllSubmissions(submissionsData);
    } catch (error) {
      console.error("Error loading all submissions:", error);
    } finally {
      setLoadingSubmissions(false);
    }
  }, [assignments]);

  // Thêm hàm để lọc submissions
  const filteredSubmissions = useMemo(() => {
    const allSubs = Object.values(allSubmissions).flat();

    // Lọc theo assignment
    let filtered = allSubs;
    if (selectedAssignmentFilter !== "all") {
      filtered = filtered.filter((sub) => {
        return sub.assignment_id?._id === selectedAssignmentFilter;
      });
    }

    // Lọc theo tìm kiếm
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter((sub) => {
        const studentName = `${sub.student_id?.user_id?.first_name || ""} ${
          sub.student_id?.user_id?.last_name || ""
        }`.toLowerCase();
        const studentCode = sub.student_id?.student_code?.toLowerCase() || "";
        return (
          studentName.includes(searchLower) || studentCode.includes(searchLower)
        );
      });
    }
    return filtered;
  }, [allSubmissions, selectedAssignmentFilter, searchText]);

  // Thêm useEffect để load submissions khi assignments thay đổi
  useEffect(() => {
    if (
      assignments.length > 0 &&
      (user?.role === "admin" ||
        user?.role === "staff" ||
        classInfo?.tutors?.some(
          (tutor) => tutor.tutor_id.user_id._id === user?._id
        ))
    ) {
      loadAllSubmissions();
    }
  }, [assignments, user, classInfo, loadAllSubmissions]);

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
      const fileUrl = `${staticURL}/${media.file_path}`;

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
          return <Text>Không thể hiển thị trước tệp này.</Text>;
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
                      Xem trước
                    </Button>
                  ),
                  <Button
                    type="link"
                    icon={<DownloadOutlined />}
                    href={`${staticURL}/${attachment.file_path}`}
                    target="_blank"
                  >
                    Tải xuống
                  </Button>,
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={
                    fileType === "image" ? (
                      <Image
                        src={`${staticURL}/${attachment.file_path}`}
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

  // Xử lý gốc cho submission
  const handleSubmissionClick = async (assignment) => {
    setCurrentSubmission(assignment);
    try {
      // Lấy submission hiện tại của assignment này nếu có
      const response = await getSubmissionsByAssignment(assignment._id);
      
      if (response && response.data) {
        setCurrentSubmission({
          ...assignment,
          submission: response.data
        });
        
        // Nếu đã có file đính kèm, hiển thị lên UI
        if (response.data.attachments && response.data.attachments.length > 0) {
          const existingFiles = response.data.attachments.map(file => ({
            uid: file._id,
            name: file.file_name,
            status: 'done',
            url: `${staticURL}/${file.file_path}`,
            size: file.file_size,
            type: file.file_type
          }));
          setUploadedFiles(existingFiles);
        } else {
          setUploadedFiles([]);
        }
      } else {
        // Nếu chưa có submission
        setCurrentSubmission(assignment);
        setUploadedFiles([]);
      }
    } catch (error) {
      console.error("Error fetching submission:", error);
      setCurrentSubmission(assignment);
      setUploadedFiles([]);
    }
    
    setSubmissionModalVisible(true);
  };

  const handleSubmissionUpload = async () => {
    try {
      if (uploadedFiles.length === 0) {
        message.error("Please upload a file first");
        return;
      }

      setSubmissionLoading(true);
      const formData = new FormData();
      formData.append("assignment_id", currentSubmission._id);

      if (user?.role === "student") {
        const studentEnrollment = classInfo.enrollments.find(
          enrollment => enrollment.student_id.user_id._id === user._id
        );

        if (studentEnrollment) {
          formData.append("student_id", studentEnrollment.student_id._id);
        } else {
          throw new Error("Student enrollment not found");
        }
      }

      // Thêm file vào formData
      const newFile = uploadedFiles[0];
      if (newFile?.originFileObj) {
        formData.append("file", newFile.originFileObj);
      } else if (newFile instanceof File) {
        formData.append("file", newFile);
      } else {
        message.error("No valid file found");
        setSubmissionLoading(false);
        return;
      }

      const response = await createSubmission(formData);

      if (response?.data) {
        message.success("Submission created successfully");
        
        // Cập nhật state
        setAssignmentSubmissions(prev => ({
          ...prev,
          [currentSubmission._id]: response.data
        }));
        
        setSubmissionModalVisible(false);
        setUploadedFiles([]);
        
        // Refresh lại data
        const refreshSubmissions = async () => {
          try {
            const updatedSubmissions = {...assignmentSubmissions};
            
            for (const assignment of assignments) {
              try {
                const refreshResponse = await getSubmissionsByAssignment(assignment._id);
                if (refreshResponse?.data) {
                  updatedSubmissions[assignment._id] = refreshResponse.data;
                }
              } catch (error) {
                console.error(`Error refreshing assignment ${assignment._id}:`, error);
              }
            }
            
            setAssignmentSubmissions(updatedSubmissions);
          } catch (error) {
            console.error("Error refreshing submissions:", error);
          }
        };
        
        refreshSubmissions();
      }
    } catch (error) {
      console.error("Error submitting assignment:", error);
      message.error(error.response?.data?.error || error.message || "Error submitting assignment");
    } finally {
      setSubmissionLoading(false);
    }
  };

  // Component cho Modal submission
  const SubmissionModal = ({
    visible,
    assignment,
    submission,
    onCancel,
    onSubmit,
    loading,
  }) => {
    const [form] = Form.useForm();
    const isExpired = assignment && new Date(assignment?.duedate) < new Date();

    const uploadProps = {
      accept: ".pdf",
      multiple: false,
      maxCount: 1,
      fileList: uploadedFiles,
      onChange: ({ fileList }) => {
        const latestFile = fileList[fileList.length - 1];
        if (latestFile) {
          if (latestFile.size && latestFile.size > 10 * 1024 * 1024) {
            message.error("File size must be less than 10MB");
            return;
          }
          setUploadedFiles([latestFile]);
        } else {
          setUploadedFiles([]);
        }
      },
      beforeUpload: (file) => {
        const isPDF = file.type === "application/pdf";
        if (!isPDF) {
          message.error("You can only upload PDF files!");
          return Upload.LIST_IGNORE;
        }
        return false;
      },
      onRemove: () => {
        setUploadedFiles([]);
      },
    };

    // Determine if there's already a submission
    const existingSubmission = assignment?.submission;

    return (
      <Modal
        title={`${existingSubmission ? "Update" : "Create"} Submission`}
        open={visible}
        onCancel={onCancel}
        footer={null}
        width={800}
      >
        <Form form={form} onFinish={onSubmit} layout="vertical">
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            {/* Assignment Info */}
            <Card size="small">
              <Descriptions column={1}>
                <Descriptions.Item label="Assignment">
                  {assignment?.title}
                </Descriptions.Item>
                <Descriptions.Item label="Due Date">
                  {assignment?.duedate && new Date(assignment.duedate).toLocaleString()}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Current Submission Info */}
            {existingSubmission && (
              <Card size="small" title="Current Submission">
                <Descriptions column={1}>
                  <Descriptions.Item label="Submitted At">
                    {existingSubmission.submitted_at && new Date(existingSubmission.submitted_at).toLocaleString()}
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color={existingSubmission.status === "graded" ? "green" : "blue"}>
                      {existingSubmission.status ? existingSubmission.status.toUpperCase() : "PENDING"}
                    </Tag>
                  </Descriptions.Item>
                  {existingSubmission.grade && (
                    <Descriptions.Item label="Grade">
                      <Tag color={existingSubmission.grade.score >= 5 ? "green" : "red"}>
                        {existingSubmission.grade.score}/10
                      </Tag>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            )}

            {/* File Upload */}
            {!isExpired && (
              <Form.Item
                label={existingSubmission ? "Upload New File (PDF only)" : "Upload File (PDF only)"}
                required
                rules={[{ required: true, message: "Please upload a file" }]}
              >
                <Upload {...uploadProps}>
                  <Button icon={<UploadOutlined />} disabled={uploadedFiles.length > 0}>
                    {uploadedFiles.length > 0 ? "File Selected" : "Select File"}
                  </Button>
                </Upload>
              </Form.Item>
            )}

            {/* Current Files */}
            {existingSubmission?.attachments?.length > 0 && (
              <div>
                <Divider orientation="left">Current Submitted File</Divider>
                <List
                  size="small"
                  dataSource={existingSubmission.attachments}
                  renderItem={(file) => (
                    <List.Item
                      actions={[
                        <Button
                          type="link"
                          icon={<DownloadOutlined />}
                          onClick={() =>
                            window.open(`${staticURL}/${file.file_path}`, "_blank")
                          }
                        >
                          Download
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<FileOutlined />}
                        title={file.file_name}
                        description={
                          <>
                            <Text type="secondary">
                              {formatFileSize(file.file_size)}
                            </Text>
                            <br />
                            <Text type="secondary">
                              Submitted:{" "}
                              {existingSubmission.submitted_at && 
                                new Date(existingSubmission.submitted_at).toLocaleString()}
                            </Text>
                          </>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}

            {/* Submit Button */}
            {!isExpired && (
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  disabled={uploadedFiles.length === 0}
                  block
                >
                  {existingSubmission ? "Update Submission" : "Create Submission"}
                </Button>
              </Form.Item>
            )}
          </Space>
        </Form>
      </Modal>
    );
  };

  const studentColumns = useMemo(() => [
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
                ? `${staticURL}/${record.student_id.user_id.avatar_path}`
                : "/default-avatar.png"
            }
            icon={<UserOutlined />}
          />
          <Space direction="vertical" size={0}>
            <Text
              style={{ cursor: "pointer", color: "#1890ff" }}
              onClick={() =>
                navigate(
                  `${effectiveBasePath}/user/${record.student_id.user_id._id}`
                )
              }
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
        const canViewStatus =
          permissions.canViewStatistics ||
          (user?.role === "student" &&
            user?._id === record.student_id.user_id._id);

        if (!canViewStatus) return <Text type="secondary">Restricted</Text>;

        const stats = attendanceStats[record.student_id._id] || {
          totalSchedules: 0,
          absentCount: 0,
          presentCount: 0,
          lateCount: 0,
          notRecordedCount: 0,
          absentRate: 0
        };

        const absentRate = stats.absentRate;

        return (
          <Space direction="vertical" size={0}>
            <Tag color={absentRate > 30 ? "red" : "green"}>{absentRate}% Absent</Tag>
          </Space>
        );
      },
    },
    {
      title: "Average Grade",
      key: "grade",
      render: (_, record) => {
        const canViewGrade =
          permissions.canViewStatistics ||
          (user?.role === "student" &&
            user?._id === record.student_id.user_id._id);

        if (!canViewGrade) return <Text type="secondary">Restricted</Text>;

        // Calculate average grade from submissions
        const studentSubmissions = Object.values(allSubmissions)
          .flat()
          .filter(
            (sub) =>
              sub.student_id?._id === record.student_id._id &&
              sub.grade?.score != null
          );

        const averageGrade = studentSubmissions.length
          ? studentSubmissions.reduce(
              (sum, sub) => sum + sub.grade.score,
              0
            ) / studentSubmissions.length
          : null;

        return (
          <Tag color={averageGrade >= 5 ? "green" : averageGrade ? "red" : "default"}>
            {averageGrade ? averageGrade.toFixed(1) : "N/A"}
          </Tag>
        );
      },
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
                  `${effectiveBasePath}/user/${record.student_id.user_id._id}`
                )
              }
            />
          </Tooltip>
          {permissions.canDelete && (
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
          )}
        </Space>
      ),
    },
  ], [permissions, user, attendanceStats]);

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
                ? `${staticURL}/${record.tutor_id.user_id.avatar_path}`
                : "/default-avatar.png"
            }
            icon={<UserOutlined />}
          />
          <Space direction="vertical" size={0}>
            <Text
              style={{ cursor: "pointer", color: "#1890ff" }}
              onClick={() =>
                navigate(
                  `${effectiveBasePath}/user/${record.tutor_id.user_id._id}`
                )
              }
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
                navigate(`${effectiveBasePath}/user/${record.tutor_id.user_id._id}`)
              }
            />
          </Tooltip>
          {permissions.canDelete && (
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
          )}
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
          {permissions.canViewAttendance && (
            <Tooltip title="View Attendance">
              <Button
                type="default"
                icon={<EyeOutlined />}
                size="small"
                onClick={() =>
                  navigate(
                    `${effectiveBasePath}/attendance/schedule/${record._id}`
                  )
                }
              />
            </Tooltip>
          )}
          {permissions.canEdit && (
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
          )}
          {permissions.canDelete && (
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
          )}
        </Space>
      ),
    },
  ];

  // Thêm columns cho bảng submissions
  const submissionColumns = [
    {
      title: "Student",
      key: "student",
      render: (_, record) => (
        <Space>
          <Avatar
            size={40}
            src={
              record.student_id?.user_id?.avatar_path
                ? `${staticURL}/${record.student_id.user_id.avatar_path}`
                : "/default-avatar.png"
            }
            icon={<UserOutlined />}
          />
          <Space direction="vertical" size={0}>
            <Text
              style={{ cursor: "pointer", color: "#1890ff" }}
              onClick={() =>
                navigate(
                  `${effectiveBasePath}/user/${record.student_id.user_id._id}`
                )
              }
            >
              {record.student_id?.user_id?.first_name}{" "}
              {record.student_id?.user_id?.last_name}
            </Text>
            <Text type="secondary">{record.student_id?.student_code}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: "Assignment",
      key: "assignment",
      render: (_, record) => <Text strong>{record.assignment_id?.title}</Text>,
    },
    {
      title: "Submitted At",
      key: "submitted_at",
      render: (_, record) => (
        <Text>
          {record.submitted_at
            ? new Date(record.submitted_at).toLocaleString()
            : "Not submitted"}
        </Text>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => (
        <Tag color={record.status === "graded" ? "green" : "blue"}>
          {record.status?.toUpperCase() || "-"}
        </Tag>
      ),
    },
    {
      title: "Grade",
      key: "grade",
      render: (_, record) =>
        record.grade ? (
          <Tag color={record.grade.score >= 50 ? "green" : "red"}>
            {record.grade.score}/100
          </Tag>
        ) : (
          <Text type="secondary">Not graded</Text>
        ),
    },
    {
      title: "Graded At",
      key: "graded_at",
      render: (_, record) =>
        record.grade?.graded_at ? (
          <Text>{new Date(record.grade.graded_at).toLocaleString()}</Text>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Graded By",
      key: "graded_by",
      render: (_, record) =>
        record.grade?.graded_by ? (
          <Space>
            <Avatar
              size={24}
              src={
                record.grade?.graded_by?.tutor_id?.user_id?.avatar_path
                  ? `${staticURL}/${record.grade.graded_by.tutor_id.user_id.avatar_path}`
                  : "/default-avatar.png"
              }
              icon={<UserOutlined />}
            />
            <Text>
              {record.grade?.graded_by?.tutor_id?.user_id?.first_name}{" "}
              {record.grade?.graded_by?.tutor_id?.user_id?.last_name}
            </Text>
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          {record.attachments?.length > 0 && (
            <Tooltip title="View Submission">
              <Button
                type="link"
                icon={<EyeOutlined />}
                onClick={() =>
                  navigate(`${effectiveBasePath}/submission/${record._id}`)
                }
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // Thêm hàm kiểm tra xem user có phải là tutor của lớp không
  const isClassTutor = useMemo(() => {
    if (!classInfo || !user) return false;
    return classInfo.tutors?.some(tutor => tutor.tutor_id.user_id._id === user._id);
  }, [classInfo, user]);

  const tabItems = useMemo(() => {
    if (!classInfo) return [];

    const baseItems = [
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
                    {classInfo.course_id?.name} ({classInfo.course_id?.code})
                  </Text>
                </Col>
                <Col span={6}>
                  {permissions.canEdit && (
                    <Button
                      type="primary"
                      style={{ float: "right" }}
                      icon={<EditOutlined />}
                      onClick={() =>
                        navigate(`${effectiveBasePath}/classInfo/${id}/edit`)
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
                {permissions.canViewStatistics && (
                  <>
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
                  </>
                )}
              </Row>
            </div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Department">
                {classInfo.course_id?.department_id?.name}
              </Descriptions.Item>
              <Descriptions.Item label="Course">
                {classInfo.course_id?.code} - {classInfo.course_id?.name}
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
                  {permissions.canCreateSchedule && (
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
                  )}
                  {scheduleViewMode === "table" &&
                    selectedScheduleKeys.length > 0 && (
                      <Popconfirm
                        title={`Are you sure you want to delete ${selectedScheduleKeys.length} selected schedules?`}
                        onConfirm={handleBulkDeleteSchedules}
                        okText="Yes"
                        cancelText="No"
                      >
                        <Button type="primary" danger icon={<DeleteOutlined />}>
                          Delete Selected ({selectedScheduleKeys.length})
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
                        scheduleViewMode === "table" ? "primary" : "default"
                      }
                      icon={<TableOutlined />}
                      onClick={() => setScheduleViewMode("table")}
                    >
                      Table View
                    </Button>
                    <Button
                      type={
                        scheduleViewMode === "calendar" ? "primary" : "default"
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
                      const scheduleDate = new Date(schedule.start_time);
                      return (
                        scheduleDate.getDate() === date.date() &&
                        scheduleDate.getMonth() === date.month() &&
                        scheduleDate.getFullYear() === date.year()
                      );
                    }
                  );

                  return (
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {scheduleEvents?.map((schedule) => (
                        <li key={schedule._id} style={{ marginBottom: "4px" }}>
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
                                <Text strong style={{ fontSize: "12px" }}>
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
                                  color={schedule.is_online ? "blue" : "green"}
                                  style={{ margin: 0, fontSize: "10px" }}
                                >
                                  {schedule.is_online ? "Online" : "Offline"}
                                </Tag>
                              </Space>
                            </Card>
                          </Tooltip>
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
    ];

    const additionalItems = isStudentandTutorEnrolled
      ? [
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
                <Row justify="space-between" style={{ marginBottom: 16 }}>
                  <Col>
                    {isClassTutor && (
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          setMaterialModalVisible(true);
                        }}
                      >
                        Add Material
                      </Button>
                    )}
                  </Col>
                </Row>
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
                          <Space direction="vertical" style={{ width: "100%" }}>
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
                <Row justify="space-between" style={{ marginBottom: 16 }}>
                  <Col>
                    {isClassTutor && (
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          setAssignmentModalVisible(true);
                        }}
                      >
                        Add Assignment
                      </Button>
                    )}
                  </Col>
                </Row>
                {assignments.length > 0 ? (
                  <List
                    grid={{ gutter: 16, column: 1 }}
                    dataSource={assignments}
                    renderItem={(assignment) => (
                      <List.Item>
                        <Card
                          title={
                            <Space>
                              {assignment.title}
                              <Tag
                                color={
                                  new Date(assignment.duedate) < new Date()
                                    ? "red"
                                    : "green"
                                }
                              >
                                {new Date(assignment.duedate) < new Date()
                                  ? "EXPIRED"
                                  : "ACTIVE"}
                              </Tag>
                            </Space>
                          }
                          extra={
                            <Space>
                              <ClockCircleOutlined />
                              <Text type="secondary">
                                Due:{" "}
                                {new Date(assignment.duedate).toLocaleString()}
                              </Text>
                            </Space>
                          }
                        >
                          <Space direction="vertical" style={{ width: "100%" }}>
                            {assignment.description && (
                              <Typography.Paragraph>
                                {assignment.description}
                              </Typography.Paragraph>
                            )}

                            {/* Assignment Files Section */}
                            {assignment.attachments?.length > 0 && (
                              <div>
                                <Title level={5}>
                                  <PaperClipOutlined /> Assignment Files
                                </Title>
                                <AttachmentsList
                                  attachments={assignment.attachments}
                                />
                              </div>
                            )}

                            {/* Submission Status Section - Chỉ hiển thị cho student */}
                            {user?.role === "student" && (
                              <Row justify="space-between" align="middle">
                                <Col>
                                  {assignmentSubmissions[assignment._id] ? (
                                    <Space direction="vertical" size="small">
                                      <Space>
                                        <Text type="secondary">Submitted at:</Text>
                                        <Text strong>
                                          {assignmentSubmissions[assignment._id].submitted_at && 
                                            new Date(assignmentSubmissions[assignment._id].submitted_at).toLocaleString()}
                                        </Text>
                                        <Tag 
                                          color={assignmentSubmissions[assignment._id].status === "graded" ? "green" : "blue"}
                                        >
                                          {assignmentSubmissions[assignment._id].status || "PENDING"}
                                        </Tag>
                                      </Space>
                                      {assignmentSubmissions[assignment._id].attachments?.length > 0 && (
                                        <Button
                                          type="link"
                                          icon={<DownloadOutlined />}
                                          onClick={() =>
                                            window.open(
                                              `${staticURL}/${assignmentSubmissions[assignment._id].attachments[0].file_path}`,
                                              "_blank"
                                            )
                                          }
                                        >
                                          Download Submission ({assignmentSubmissions[assignment._id].attachments[0].file_name})
                                        </Button>
                                      )}
                                    </Space>
                                  ) : (
                                    <Text type="secondary">Not submitted yet</Text>
                                  )}
                                </Col>
                                <Col>
                                  {permissions.canSubmitAssignment && (
                                    <Button
                                      type="primary"
                                      onClick={() => handleSubmissionClick(assignment)}
                                      disabled={new Date(assignment.duedate) < new Date()}
                                    >
                                      {assignmentSubmissions[assignment._id]
                                        ? "Update Submission"
                                        : "Create Submission"}
                                    </Button>
                                  )}
                                </Col>
                              </Row>
                            )}
                          </Space>
                        </Card>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="No assignments available" />
                )}
              </div>
            ),
          },
        ]
      : [];

    // Kiểm tra quyền xem submissions
    const canViewSubmissions =
      user?.role === "admin" ||
      user?.role === "staff" ||
      classInfo?.tutors?.some(
        (tutor) => tutor.tutor_id.user_id._id === user?._id
      );

    // Thêm tab Submissions nếu có quyền
    if (canViewSubmissions) {
      const ungradedCount = filteredSubmissions.filter(
        (sub) => sub.status !== "graded"
      ).length;
      additionalItems.push({
        key: "7",
        label: (
          <span>
            <FileTextOutlined style={{ marginRight: 3 }} />
            Submissions ({ungradedCount})
          </span>
        ),
        children: (
          <div style={{ padding: "24px 0" }}>
            <Space direction="vertical" style={{ width: "100%" }} size="large">
              <Space>
                <Text strong>Filter by Assignment:</Text>
                <Select
                  style={{ width: 200 }}
                  value={selectedAssignmentFilter}
                  onChange={setSelectedAssignmentFilter}
                  popupMatchSelectWidth={false}
                >
                  <Select.Option value="all">All Assignments</Select.Option>
                  {assignments.map((assignment) => (
                    <Select.Option key={assignment._id} value={assignment._id}>
                      {assignment.title}
                    </Select.Option>
                  ))}
                </Select>
                <Input.Search
                  placeholder="Search by student name or code"
                  style={{ width: 300 }}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
              </Space>

              {/* Thêm phần hiển thị học viên chưa nộp bài */}
              {selectedAssignmentFilter !== "all" && (
                <Card
                  title={
                    <Space>
                      <WarningOutlined style={{ color: "#faad14" }} />
                      <Text strong>Students Who Haven't Submitted</Text>
                    </Space>
                  }
                  size="small"
                >
                  <Table
                    columns={[
                      {
                        title: "Student",
                        key: "student",
                        render: (_, record) => (
                          <Space>
                            <Avatar
                              size={40}
                              src={
                                record.student_id?.user_id?.avatar_path
                                  ? `${staticURL}/${record.student_id.user_id.avatar_path}`
                                  : "/default-avatar.png"
                              }
                              icon={<UserOutlined />}
                            />
                            <Space direction="vertical" size={0}>
                              <Text strong>
                                {record.student_id?.user_id?.first_name}{" "}
                                {record.student_id?.user_id?.last_name}
                              </Text>
                              <Text type="secondary">
                                {record.student_id?.student_code}
                              </Text>
                            </Space>
                          </Space>
                        ),
                      },
                      {
                        title: "Email",
                        key: "email",
                        render: (_, record) => (
                          <Text>{record.student_id?.user_id?.email}</Text>
                        ),
                      },
                      {
                        title: "Status",
                        key: "status",
                        render: () => <Tag color="warning">Not Submitted</Tag>,
                      },
                    ]}
                    dataSource={classInfo.enrollments.filter((enrollment) => {
                      // Lọc ra những học viên chưa nộp bài cho assignment được chọn
                      const hasSubmission = filteredSubmissions.some(
                        (sub) =>
                          sub.student_id._id === enrollment.student_id._id &&
                          sub.assignment_id._id === selectedAssignmentFilter
                      );
                      return !hasSubmission;
                    })}
                    rowKey={(record) => record.student_id._id}
                    pagination={{
                      showSizeChanger: true,
                      showTotal: (total) =>
                        `Total ${total} students haven't submitted`,
                    }}
                  />
                </Card>
              )}

              <Table
                columns={submissionColumns}
                dataSource={filteredSubmissions}
                rowKey="_id"
                loading={loadingSubmissions}
                pagination={{
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} submissions`,
                }}
              />
            </Space>
          </div>
        ),
      });
    }

    return [...baseItems, ...additionalItems];
  }, [
    statistics,
    materials,
    assignments,
    isStudentandTutorEnrolled,
    classInfo,
    permissions,
    selectedStudentKeys,
    selectedTutorKeys,
    selectedScheduleKeys,
    scheduleViewMode,
    effectiveBasePath,
    id,
    assignmentSubmissions,
    user,
    allSubmissions,
    loadingSubmissions,
    selectedAssignmentFilter,
    filteredSubmissions,
    searchText,
    isClassTutor,
  ]);

  // Thêm các Modal vào phần return
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
            items={tabItems}
          />
        </Card>
      </Space>

      <SubmissionModal
        visible={submissionModalVisible}
        assignment={currentSubmission}
        submission={currentSubmission}
        onCancel={() => {
          setSubmissionModalVisible(false);
          setCurrentSubmission(null);
          setUploadedFiles([]);
        }}
        onSubmit={handleSubmissionUpload}
        loading={submissionLoading}
      />

      <MaterialModal
        isVisible={materialModalVisible}
        onCancel={() => setMaterialModalVisible(false)}
        classId={id}
        onSuccess={() => {
          // Handle refresh logic
        }}
      />
      <AssignmentModal
        isVisible={assignmentModalVisible}
        onCancel={() => setAssignmentModalVisible(false)}
        classId={id}
        onSuccess={() => {
          // Handle refresh logic
        }}
      />
    </div>
  );
};

export default ClassDetail;
