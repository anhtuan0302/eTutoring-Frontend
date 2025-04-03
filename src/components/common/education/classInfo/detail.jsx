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
} from "antd";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import { getClassById } from "../../../../api/education/classInfo";
import { unenrollStudent } from "../../../../api/education/enrollment";
import { removeTutor } from "../../../../api/education/classTutor";
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
    const validGrades = enrollments
      .filter((e) => e.grade != null)
      .map((e) => e.grade);

    return {
      total_students: enrollments.length,
      active_students: enrollments.filter((e) => e.status === "active").length,
      total_tutors: tutors.length,
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

  const handleUnenrollStudent = useCallback(
    async (enrollmentId) => {
      try {
        await unenrollStudent(enrollmentId);
        message.success("Student unenrolled successfully");
        const response = await getClassById(id);
        setClassInfo(response);
        setSelectedStudentKeys([]);
      } catch (error) {
        message.error(
          error.response?.data?.error || "Error unenrolling student"
        );
      }
    },
    [id]
  );

  const handleBulkUnenroll = useCallback(async () => {
    try {
      await Promise.all(selectedStudentKeys.map((id) => unenrollStudent(id)));
      message.success(
        `Unenrolled ${selectedStudentKeys.length} students successfully`
      );
      const response = await getClassById(id);
      setClassInfo(response);
      setSelectedStudentKeys([]);
    } catch (error) {
      message.error("Error unenrolling students");
    }
  }, [selectedStudentKeys, id]);

  const handleRemoveTutor = useCallback(
    async (tutorId) => {
      try {
        await removeTutor(tutorId);
        message.success("Tutor removed successfully");
        const response = await getClassById(id);
        setClassInfo(response);
        setSelectedTutorKeys([]);
      } catch (error) {
        message.error(error.response?.data?.error || "Error removing tutor");
      }
    },
    [id]
  );

  const handleBulkRemoveTutors = useCallback(async () => {
    try {
      await Promise.all(selectedTutorKeys.map((id) => removeTutor(id)));
      message.success(
        `Removed ${selectedTutorKeys.length} tutors successfully`
      );
      const response = await getClassById(id);
      setClassInfo(response);
      setSelectedTutorKeys([]);
    } catch (error) {
      message.error("Error removing tutors");
    }
  }, [selectedTutorKeys, id]);

  const studentColumns = [
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
      render: (_, record) => (
        <Tag color={record.status === "active" ? "green" : "red"}>
          {record.status?.toUpperCase()}
        </Tag>
      ),
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
            <Button
              icon={<RollbackOutlined />}
              onClick={() => navigate(`${effectiveBasePath}/classInfo`)}
            >
              Back to List
            </Button>
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
            ]}
          />
        </Card>
      </Space>
    </div>
  );
};

export default ClassDetail;
