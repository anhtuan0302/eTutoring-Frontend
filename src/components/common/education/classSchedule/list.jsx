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
  Col
} from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import {
  getAllSchedules,
  deleteSchedule,
} from "../../../../api/education/classSchedule";
import { getAllClasses } from "../../../../api/education/classInfo";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import dayjs from 'dayjs';

const ListClassSchedules = ({ basePath, customPermissions }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // States
  const [schedules, setSchedules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState('month');
  const [selectedDate, setSelectedDate] = useState(dayjs());


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

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [schedulesResponse, classesResponse] = await Promise.all([
        getAllSchedules(),
        getAllClasses(),
      ]);

      if (Array.isArray(schedulesResponse)) {
        setSchedules(schedulesResponse);
      }

      if (Array.isArray(classesResponse)) {
        setClasses(classesResponse);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle delete
  const handleDelete = useCallback(async (id) => {
    try {
      await deleteSchedule(id);
      message.success("Schedule deleted successfully");
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.error || "Error deleting schedule");
    }
  }, [fetchData]);

  // Filter schedules
  const filteredSchedules = useMemo(() => {
    let result = [...schedules];

    if (selectedClass) {
      result = result.filter(
        (schedule) => schedule.classInfo_id?._id === selectedClass
      );
    }

    if (selectedStatus) {
      result = result.filter((schedule) => schedule.status === selectedStatus);
    }

    return result;
  }, [schedules, selectedClass, selectedStatus]);

  // Calendar cell render
  const dateCellRender = useCallback((date) => {
    const scheduleList = filteredSchedules.filter((schedule) => {
      const scheduleDate = dayjs(schedule.start_time);
      return date.isSame(scheduleDate, 'day');
    });

    if (scheduleList.length === 0) return null;

    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {scheduleList.map((schedule) => (
          <li
            key={schedule._id}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedSchedule(schedule);
              setIsModalVisible(true);
            }}
            style={{ cursor: 'pointer', marginBottom: '3px' }}
          >
            <Badge
              status={schedule.status === 'completed' ? 'success' : 'processing'}
              text={
                <Tooltip title={`${schedule.classInfo_id?.code} - ${dayjs(schedule.start_time).format('HH:mm')} to ${dayjs(schedule.end_time).format('HH:mm')}`}>
                  <span style={{ 
                    fontSize: '12px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: 'block'
                  }}>
                    {schedule.classInfo_id?.code} ({dayjs(schedule.start_time).format('HH:mm')} - {dayjs(schedule.end_time).format('HH:mm')})
                  </span>
                </Tooltip>
              }
            />
          </li>
        ))}
      </ul>
    );
  }, [filteredSchedules]);

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
                navigate(`${effectiveBasePath}/classSchedule/${selectedSchedule._id}/edit`);
              }}
            >
              Edit
            </Button>
          ),
        ].filter(Boolean)}
      >
        <div style={{ marginBottom: '20px' }}>
          <p>
            <strong>Class:</strong> {selectedSchedule.classInfo_id?.code} - {selectedSchedule.classInfo_id?.course_id?.code}
          </p>
          <p>
            <strong>Time:</strong>{' '}
            {dayjs(selectedSchedule.start_time).format('DD/MM/YYYY HH:mm')} -{' '}
            {dayjs(selectedSchedule.end_time).format('HH:mm')}
          </p>
          <p>
            <strong>Type:</strong>{' '}
            <Tag color={selectedSchedule.is_online ? "blue" : "green"}>
              {selectedSchedule.is_online ? "Online" : "Offline"}
            </Tag>
          </p>
          <p>
            <strong>{selectedSchedule.is_online ? "Link" : "Location"}:</strong>{' '}
            {selectedSchedule.is_online
              ? selectedSchedule.online_link || "No link provided"
              : selectedSchedule.location || "No location specified"}
          </p>
          <p>
            <strong>Status:</strong>{' '}
            <Tag color={selectedSchedule.status === "scheduled" ? "processing" : "success"}>
              {selectedSchedule.status?.toUpperCase()}
            </Tag>
          </p>
        </div>
      </Modal>
    );
  }, [selectedSchedule, isModalVisible, permissions, effectiveBasePath, navigate, handleDelete]);

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
              onClick={() => navigate(`${effectiveBasePath}/classSchedule/create`)}
            >
              Add Schedule
            </Button>
          )}
        </Space>

        <Space>
          <Select
            placeholder="Select Class"
            style={{ width: 200 }}
            value={selectedClass}
            onChange={setSelectedClass}
            allowClear
            options={classes.map((cls) => ({
              label: `${cls.code} - ${cls.course_id?.code || "N/A"}`,
              value: cls._id,
            }))}
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
            value={viewMode} 
            onChange={(e) => setViewMode(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="month">Month</Radio.Button>
            <Radio.Button value="year">Year</Radio.Button>
          </Radio.Group>
        </Space>
      </div>

      <Calendar 
        dateCellRender={dateCellRender}
        loading={loading}
        mode={viewMode}
        value={selectedDate}
        onChange={(newDate) => setSelectedDate(newDate)}
        style={{ 
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px'
        }}
        // Loại bỏ headerRender để không hiển thị controls mặc định
        headerRender={() => null}
      />
      
      <ScheduleDetailModal />
    </div>
  );
};

export default ListClassSchedules;