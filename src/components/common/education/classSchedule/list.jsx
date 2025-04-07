import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Calendar,
  Button,
  Space,
  Tag,
  message,
  Select,
  Modal,
  Popconfirm,
  Tooltip,
  Badge,
  Radio,
  Row,
  Col,
  Table,
  Typography,
} from "antd";
import {
  TableOutlined,
  CalendarOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import {
  getAllSchedules,
  deleteSchedule,
  getSchedulesForStudentById,
  getSchedulesForTutorById,
} from "../../../../api/education/classSchedule";
import {
  getStudentByUserId,
  getTutorByUserId,
} from "../../../../api/auth/user";
import { getAllClasses } from "../../../../api/education/classInfo";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
dayjs.extend(isSameOrAfter);

const { Text } = Typography;

const ListClassSchedules = ({ basePath, customPermissions }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [studentInfo, setStudentInfo] = useState(null);
  const [tutorInfo, setTutorInfo] = useState(null);

  // States
  const [schedules, setSchedules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [studentClasses, setStudentClasses] = useState([]);
  const [tutorClasses, setTutorClasses] = useState([]);
  const [viewMode, setViewMode] = useState("calendar");
  const [calendarMode, setCalendarMode] = useState("month");
  const [showAllSchedules, setShowAllSchedules] = useState(false);

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

  // Xác định permissions
  const permissions = useMemo(() => {
    if (customPermissions) return customPermissions;
    switch (user?.role) {
      case "admin":
      case "staff":
        return {
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true,
        };
      case "tutor":
        return {
          canView: true,
          canCreate: false,
          canEdit: false,
          canDelete: false,
        };
      default:
        return {
          canView: true,
          canCreate: false,
          canEdit: false,
          canDelete: false,
        };
    }
  }, [customPermissions, user?.role]);

  useEffect(() => {
    const fetchStudentInfo = async () => {
      if (user?.role === "student") {
        try {
          const response = await getStudentByUserId(user._id);
          // Response trực tiếp là data
          if (response) {
            console.log("Student info:", response);
            setStudentInfo(response);
          } else {
            console.error("Invalid student info response:", response);
            message.error(
              "Failed to load student information - Invalid response"
            );
          }
        } catch (error) {
          console.error("Error fetching student info:", error);
          message.error("Failed to load student information");
        }
      }
    };

    fetchStudentInfo();
  }, [user]);

  useEffect(() => {
    const fetchTutorInfo = async () => {
      if (user?.role === "tutor") {
        try {
          const response = await getTutorByUserId(user._id);
          if (response) {
            console.log("Tutor info:", response);
            setTutorInfo(response);
          } else {
            console.error("Invalid tutor info response:", response);
            message.error(
              "Failed to load tutor information - Invalid response"
            );
          }
        } catch (error) {
          console.error("Error fetching tutor info:", error);
          message.error("Failed to load tutor information");
        }
      }
    };

    fetchTutorInfo();
  }, [user]);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      let schedulesData = [];
      let classesData = [];

      if (user?.role === "admin" || user?.role === "staff") {
        const [schedulesResponse, classesResponse] = await Promise.all([
          getAllSchedules(),
          getAllClasses(),
        ]);
        schedulesData = schedulesResponse || [];
        classesData = classesResponse || [];
        setStudentClasses([]); // Reset student classes
        setTutorClasses([]); // Reset tutor classes
      } else if (user?.role === "student" && studentInfo?._id) {
        const [schedulesResponse, classesResponse] = await Promise.all([
          getSchedulesForStudentById(studentInfo._id),
          getAllClasses(),
        ]);
        schedulesData = schedulesResponse || [];
        classesData = classesResponse || [];

        const studentClassIds = [
          ...new Set(
            schedulesData.map((schedule) => schedule.classInfo_id?._id)
          ),
        ];
        const studentClassesData = classesData.filter((cls) =>
          studentClassIds.includes(cls._id)
        );
        setStudentClasses(studentClassesData);
        setTutorClasses([]); // Reset tutor classes
      } else if (user?.role === "tutor" && tutorInfo?._id) {
        const [schedulesResponse, classesResponse] = await Promise.all([
          getSchedulesForTutorById(tutorInfo._id),
          getAllClasses(),
        ]);
        console.log("Tutor schedules response:", schedulesResponse);
        schedulesData = schedulesResponse || [];
        classesData = classesResponse || [];

        // Lọc ra các lớp của tutor từ schedules
        const tutorClassIds = [
          ...new Set(
            schedulesData.map((schedule) => schedule.classInfo_id?._id)
          ),
        ];
        const tutorClassesData = classesData.filter((cls) =>
          tutorClassIds.includes(cls._id)
        );
        setTutorClasses(tutorClassesData);
        setStudentClasses([]); // Reset student classes
      }

      console.log("Setting schedules:", schedulesData);
      console.log("Setting classes:", classesData);

      setSchedules(Array.isArray(schedulesData) ? schedulesData : []);
      setClasses(Array.isArray(classesData) ? classesData : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [user?.role, studentInfo?._id, tutorInfo?._id]);

  useEffect(() => {
    const loadData = async () => {
      if (user?.role === "student") {
        if (studentInfo?._id) {
          await fetchData();
        }
      } else if (user?.role === "tutor") {
        if (tutorInfo?._id) {
          await fetchData();
        }
      } else {
        await fetchData();
      }
    };

    loadData();
  }, [fetchData, user?.role, studentInfo, tutorInfo]);

  // Handle delete
  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteSchedule(id);
        message.success("Schedule deleted successfully");
        fetchData();
      } catch (error) {
        message.error(error.response?.data?.error || "Error deleting schedule");
      }
    },
    [fetchData]
  );

  // Filter schedules
  const filteredSchedules = useMemo(() => {
    if (!schedules || !Array.isArray(schedules)) return [];

    let result = [...schedules];

    if (selectedClass) {
      result = result.filter(
        (schedule) => schedule.classInfo_id?._id === selectedClass
      );
    }

    if (selectedStatus) {
      result = result.filter((schedule) => schedule.status === selectedStatus);
    }

    // Nếu là student, không cần filter thêm vì API đã trả về đúng schedules của student
    // if (user?.role === "student" && studentInfo?._id) {
    //   result = result.filter((schedule) =>
    //     schedule.enrollments?.some(enrollment =>
    //       enrollment.student_id === studentInfo._id
    //     )
    //   );
    // }

    return result;
  }, [schedules, selectedClass, selectedStatus]);

  const getFilteredSchedulesByDate = useCallback((schedules) => {
    if (!schedules || !Array.isArray(schedules)) return [];

    const today = dayjs().startOf("day");
    return schedules
      .filter((schedule) => {
        const scheduleDate = dayjs(schedule.start_time).startOf("day");
        return scheduleDate.unix() >= today.unix();
      })
      .sort((a, b) => dayjs(a.start_time).unix() - dayjs(b.start_time).unix());
  }, []);

  // Calendar cell render
  const dateCellRender = useCallback(
    (date) => {
      const scheduleList = filteredSchedules.filter((schedule) => {
        const scheduleDate = dayjs(schedule.start_time);
        return date.isSame(scheduleDate, "day");
      });

      if (scheduleList.length === 0) return null;

      return (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {scheduleList.map((schedule) => (
            <li
              key={schedule._id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedSchedule(schedule);
                setIsModalVisible(true);
              }}
              style={{ cursor: "pointer", marginBottom: "3px" }}
            >
              <Badge
                status={
                  schedule.status === "completed" ? "success" : "processing"
                }
                text={
                  <Tooltip
                    title={`${schedule.classInfo_id?.code} - ${dayjs(
                      schedule.start_time
                    ).format("HH:mm")} to ${dayjs(schedule.end_time).format(
                      "HH:mm"
                    )}`}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "block",
                      }}
                    >
                      {schedule.classInfo_id?.code} (
                      {dayjs(schedule.start_time).format("HH:mm")} -{" "}
                      {dayjs(schedule.end_time).format("HH:mm")})
                    </span>
                  </Tooltip>
                }
              />
            </li>
          ))}
        </ul>
      );
    },
    [filteredSchedules]
  );

  // Schedule Detail Modal
  const ScheduleDetailModal = useCallback(() => {
    if (!selectedSchedule) return null;

    return (
      <Modal
        title="Schedule Details"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedSchedule(null);
        }}
        footer={[
          permissions.canDelete && (
            <Popconfirm
              key="delete"
              title="Are you sure you want to delete this schedule?"
              onConfirm={() => {
                handleDelete(selectedSchedule._id);
                setIsModalVisible(false);
                setSelectedSchedule(null);
              }}
              okText="Yes"
              cancelText="No"
            >
              <Button type="primary" danger icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
          ),
          permissions.canEdit && (
            <Button
              key="edit"
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                navigate(
                  `${effectiveBasePath}/classSchedule/${selectedSchedule._id}/edit`
                );
              }}
            >
              Edit
            </Button>
          ),
        ].filter(Boolean)}
      >
        <div style={{ marginBottom: "20px" }}>
          <p>
            <strong>Class:</strong> {selectedSchedule.classInfo_id?.code} -{" "}
            {selectedSchedule.classInfo_id?.course_id?.code}
          </p>
          <p>
            <strong>Time:</strong>{" "}
            {dayjs(selectedSchedule.start_time).format("DD/MM/YYYY HH:mm")} -{" "}
            {dayjs(selectedSchedule.end_time).format("HH:mm")}
          </p>
          <p>
            <strong>Type:</strong>{" "}
            <Tag color={selectedSchedule.is_online ? "blue" : "green"}>
              {selectedSchedule.is_online ? "Online" : "Offline"}
            </Tag>
          </p>
          <p>
            <strong>{selectedSchedule.is_online ? "Link" : "Location"}:</strong>{" "}
            {selectedSchedule.is_online
              ? selectedSchedule.online_link || "No link provided"
              : selectedSchedule.location || "No location specified"}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            <Tag
              color={
                selectedSchedule.status === "scheduled"
                  ? "processing"
                  : "success"
              }
            >
              {selectedSchedule.status?.toUpperCase()}
            </Tag>
          </p>
        </div>
      </Modal>
    );
  }, [
    selectedSchedule,
    isModalVisible,
    permissions,
    effectiveBasePath,
    navigate,
    handleDelete,
  ]);

  const scheduleColumns = [
    {
      title: "No.",
      key: "no",
      render: (_, __, index) => <Text>{index + 1}</Text>,
    },
    {
      title: "Class",
      key: "class",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.classInfo_id?.code}</Text>
          <Text type="secondary">{record.classInfo_id?.course_id?.code}</Text>
        </Space>
      ),
    },
    {
      title: "Date & Time",
      key: "datetime",
      sorter: (a, b) => dayjs(a.start_time).unix() - dayjs(b.start_time).unix(),
      defaultSortOrder: "ascend",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>
            {dayjs(record.start_time).format("dddd, MMMM D, YYYY")}
          </Text>
          <Text type="secondary">
            {dayjs(record.start_time).format("HH:mm")} -{" "}
            {dayjs(record.end_time).format("HH:mm")}
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
          <Tooltip title="View Class Info">
            <Button
              type="default"
              icon={<EyeOutlined />}
              size="small"
              onClick={() =>
                navigate(
                  `${effectiveBasePath}/classInfo/${record.classInfo_id?._id}`
                )
              }
            />
          </Tooltip>
          {permissions.canEdit && (
            <Tooltip title="Edit Schedule">
              <Button
                type="primary"
                icon={<EditOutlined />}
                size="small"
                style={{ backgroundColor: "#faad14" }}
                onClick={() =>
                  navigate(
                    `${effectiveBasePath}/classSchedule/${record._id}/edit`
                  )
                }
              />
            </Tooltip>
          )}
          {permissions.canDelete && (
            <Tooltip title="Delete">
              <Popconfirm
                title="Are you sure you want to delete this schedule?"
                onConfirm={() => handleDelete(record._id)}
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
        <Space>
          {permissions.canCreate && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() =>
                navigate(`${effectiveBasePath}/classSchedule/create`)
              }
            >
              Add Schedule
            </Button>
          )}
        </Space>

        <Space size="middle">
          {/* Filters */}
          {viewMode === "table" && (
            <Space>
              <Button
                onClick={() => setShowAllSchedules(!showAllSchedules)}
              type={showAllSchedules ? "primary" : "default"}
            >
              {showAllSchedules ? "Show Future Only" : "Show All Schedules"}
            </Button>
            </Space>
          )}
          <Space>
            {(user?.role === "admin" ||
              user?.role === "staff" ||
              classes.length > 0) && (
              <>
                <Select
                  placeholder="Select Class"
                  style={{ width: 200 }}
                  value={selectedClass}
                  onChange={setSelectedClass}
                  allowClear
                  options={
                    user?.role === "student"
                      ? studentClasses.map((cls) => ({
                          label: `${cls.code} - ${
                            cls.course_id?.code || "N/A"
                          }`,
                          value: cls._id,
                        }))
                      : user?.role === "tutor"
                      ? tutorClasses.map((cls) => ({
                          label: `${cls.code} - ${
                            cls.course_id?.code || "N/A"
                          }`,
                          value: cls._id,
                        }))
                      : classes.map((cls) => ({
                          label: `${cls.code} - ${
                            cls.course_id?.code || "N/A"
                          }`,
                          value: cls._id,
                        }))
                  }
                />

                <Select
                  placeholder="Status"
                  style={{ width: 120 }}
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  allowClear
                  options={[
                    { label: "Scheduled", value: "scheduled" },
                    { label: "Completed", value: "completed" },
                  ]}
                />
              </>
            )}

            {/* Calendar controls */}
            {viewMode === "calendar" && (
              <Space>
                <Select
                  size="middle"
                  style={{ width: 100 }}
                  value={selectedDate.year()}
                  onChange={(year) => {
                    setSelectedDate(selectedDate.year(year));
                  }}
                  options={Array.from({ length: 21 }, (_, i) => ({
                    label: selectedDate.year() - 10 + i,
                    value: selectedDate.year() - 10 + i,
                  }))}
                />

                <Select
                  size="middle"
                  style={{ width: 100 }}
                  value={selectedDate.month()}
                  onChange={(month) => {
                    setSelectedDate(selectedDate.month(month));
                  }}
                  options={[
                    { label: "January", value: 0 },
                    { label: "February", value: 1 },
                    { label: "March", value: 2 },
                    { label: "April", value: 3 },
                    { label: "May", value: 4 },
                    { label: "June", value: 5 },
                    { label: "July", value: 6 },
                    { label: "August", value: 7 },
                    { label: "September", value: 8 },
                    { label: "October", value: 9 },
                    { label: "November", value: 10 },
                    { label: "December", value: 11 },
                  ]}
                />

                <Radio.Group
                  value={calendarMode}
                  onChange={(e) => setCalendarMode(e.target.value)}
                  buttonStyle="solid"
                >
                  <Radio.Button value="month">Month</Radio.Button>
                  <Radio.Button value="year">Year</Radio.Button>
                </Radio.Group>
              </Space>
            )}
          </Space>

          {/* View Mode Controls - Always on the right */}
          <Button.Group>
            <Button
              type={viewMode === "table" ? "primary" : "default"}
              icon={<TableOutlined />}
              onClick={() => setViewMode("table")}
            >
              Table View
            </Button>
            <Button
              type={viewMode === "calendar" ? "primary" : "default"}
              icon={<CalendarOutlined />}
              onClick={() => setViewMode("calendar")}
            >
              Calendar View
            </Button>
          </Button.Group>
        </Space>
      </div>

      {viewMode === "table" ? (
        <Table
          columns={scheduleColumns}
          dataSource={
            showAllSchedules
              ? filteredSchedules
              : getFilteredSchedulesByDate(filteredSchedules)
          }
          rowKey={(record) => record._id}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} schedules`,
          }}
          onChange={(pagination, filters, sorter) => {
            console.log("Table change:", { pagination, filters, sorter });
          }}
        />
      ) : (
        <Calendar
          dateCellRender={dateCellRender}
          loading={loading}
          mode={calendarMode}
          value={selectedDate}
          onChange={(newDate) => setSelectedDate(newDate)}
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
          }}
          headerRender={() => null}
        />
      )}

      <ScheduleDetailModal />
    </div>
  );
};

export default ListClassSchedules;
