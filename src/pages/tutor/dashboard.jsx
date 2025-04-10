import React, { useState, useEffect } from 'react';
import AppLayout from "../../components/layouts/layout";
import { 
  Row, Col, Card, Typography, Table, Progress, Tag, Avatar, 
  Timeline, Statistic, Spin, Empty, Tabs, List, Badge, Button,
  Divider, Calendar, Alert
} from 'antd';
import { 
  UserOutlined, BookOutlined, TeamOutlined, BankOutlined,
  FileTextOutlined, ClockCircleOutlined, CheckCircleOutlined, 
  CalendarOutlined, FormOutlined, NotificationOutlined, ReloadOutlined,
  CheckSquareOutlined, ScheduleOutlined, MessageOutlined, 
  BarChartOutlined, DashboardOutlined
} from '@ant-design/icons';
import { staticURL } from "../../api/config";
import { 
  ResponsiveContainer, LineChart as ReLineChart, Line, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

// API imports
import { getTutorById } from "../../api/organization/tutor";
import { getTutorByUserId } from "../../api/auth/user";
import { getClassTutors, getClassStudents } from "../../api/education/classInfo";
import { getClassesByTutor } from "../../api/education/classTutor";
import { getSchedulesForTutorById } from "../../api/education/classSchedule";
import { getAllCourses } from "../../api/education/course";
import { getContentByClassId } from "../../api/education/classContent";
import { getAttendanceBySchedule } from "../../api/education/attendance";

import { useAuth } from "../../AuthContext";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Helper function to extract data from API responses
const extractData = (response) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  if (response.result && Array.isArray(response.result)) return response.result;
  if (response.items && Array.isArray(response.items)) return response.items;
  if (typeof response === 'object' && response.id) return [response];
  return [];
};

const TutorDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  // State for tutor dashboard
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tutorInfo, setTutorInfo] = useState({});
  const [stats, setStats] = useState({
    totalClasses: 0,
    activeClasses: 0,
    totalStudents: 0,
    assignmentsCount: 0,
    materialsCount: 0,
    hours: 0,
    completedSessions: 0
  });
  
  // Data lists
  const [classesList, setClassesList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState([]);
  const [monthlyHours, setMonthlyHours] = useState([]);
  const [classStudents, setClassStudents] = useState([]);
  
  // Get the current user and tutor ID
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentTutorId, setCurrentTutorId] = useState(null);

  // Set currentTutorId based on authenticated user
  useEffect(() => {
    if (isAuthenticated && user) {
      setCurrentUserId(user.id || user._id);
      if (user.role === 'tutor') {
        // Fetch the tutor record to get the tutor_id
        const fetchTutorId = async () => {
          try {
            const tutorResponse = await getTutorByUserId(user.id || user._id);
            const tutor = tutorResponse.data || tutorResponse;
            setCurrentTutorId(tutor._id); // Set the currentTutorId to the tutor's _id
          } catch (error) {
            console.error("Error fetching tutor record:", error);
          }
        };
        fetchTutorId();
      } else {
        console.warn("User is not a tutor, role:", user.role);
      }
    }
  }, [isAuthenticated, user]);

  // Then modify the main data fetching useEffect to depend on currentTutorId
  // and only run when it's available
  useEffect(() => {
    if (!currentTutorId) {
      return;
    }

    const fetchTutorData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch tutor info and classes in parallel
        const [tutorResponse, tutorClassesResponse] = await Promise.all([
          getTutorById(currentTutorId),
          getClassesByTutor(currentTutorId)
        ]);

        const tutor = tutorResponse.data || tutorResponse;
        if (tutor.user_id) {
          setTutorInfo(tutor.user_id);
        }

        const tutorClasses = tutorClassesResponse.data || tutorClassesResponse;
        const enrichedClasses = [];
        const studentsMap = new Map();
        let totalStudents = 0;
        let assignmentsCount = 0;
        let materialsCount = 0;
        let totalHours = 0;
        let completedSessions = 0;

        // Process each class in parallel
        const classPromises = tutorClasses.map(async (classTutor) => {
          try {
            const classId = classTutor.classInfo_id?._id || classTutor.classInfo_id;
            if (!classId) {
              return null;
            }

            // Fetch class details, enrollments, tutors, content and schedules in parallel
            const [
              enrollmentsResponse,
              tutorsResponse,
              contentResponse,
              schedulesResponse
            ] = await Promise.all([
              getClassStudents(classId),
              getClassTutors(classId),
              getContentByClassId(classId),
              getSchedulesForTutorById(currentTutorId, classId)
            ]);

            const enrollments = extractData(enrollmentsResponse);
            const tutors = extractData(tutorsResponse);
            const classContents = extractData(contentResponse);
            const schedules = extractData(schedulesResponse);

            const classAssignments = classContents.filter(c => c.content_type === 'assignment');
            const classMaterials = classContents.filter(c => c.content_type === 'material');

            // Process students
            const students = enrollments.map(enrollment => {
              const student = enrollment.student_id || {};
              const userData = student.user_id || {};
              return {
                id: student._id || student.id,
                student_code: student.student_code,
                department: student.department_id,
                first_name: userData.first_name,
                last_name: userData.last_name,
                email: userData.email,
                avatar_path: userData.avatar_path,
                status: userData.status
              };
            });

            // Add students to map
            students.forEach(student => {
              if (student.id && !studentsMap.has(student.id)) {
                studentsMap.set(student.id, student);
              }
            });

            // Calculate hours and completed sessions
            schedules.forEach(schedule => {
              const startTime = new Date(schedule.start_time);
              const endTime = new Date(schedule.end_time);
              const hours = (endTime - startTime) / (1000 * 60 * 60);
              totalHours += hours;
              if (schedule.status === 'completed') {
                completedSessions++;
              }
            });

            assignmentsCount += classAssignments.length;
            materialsCount += classMaterials.length;

            return {
              id: classId,
              _id: classId,
              name: classTutor.classInfo_id?.course_id?.name || "Unnamed Class",
              code: classTutor.classInfo_id?.code,
              status: classTutor.classInfo_id?.status,
              course_id: classTutor.classInfo_id?.course_id?._id,
              course_name: classTutor.classInfo_id?.course_id?.name,
              course_code: classTutor.classInfo_id?.course_id?.code,
              studentsCount: students.length,
              assignmentsCount: classAssignments.length,
              materialsCount: classMaterials.length,
              tutorsCount: tutors.length,
              schedules: schedules
            };
          } catch (error) {
            console.error(`Error processing class:`, error);
            return null;
          }
        });

        // Wait for all class processing to complete
        const processedClasses = await Promise.all(classPromises);
        const validClasses = processedClasses.filter(cls => cls !== null);
        enrichedClasses.push(...validClasses);

        // Update state with initial data
        setClassesList(enrichedClasses);
        setClassStudents(Array.from(studentsMap.values()));
        setStats({
          totalClasses: enrichedClasses.length,
          activeClasses: enrichedClasses.filter(c => c.status === 'in progress').length,
          totalStudents: studentsMap.size,
          assignmentsCount,
          materialsCount,
          hours: Math.round(totalHours * 10) / 10,
          completedSessions
        });

        // Fetch additional data in the background
        const fetchAdditionalData = async () => {
          try {
            // Fetch courses
            const coursesResponse = await getAllCourses();
            let courses = extractData(coursesResponse);
            const courseIds = new Set(enrichedClasses.map(cls => cls.course_id));
            courses = courses.filter(course => courseIds.has(course._id) || courseIds.has(course.id));
            courses = courses.map(course => ({
              ...course,
              classesCount: enrichedClasses.filter(cls => cls.course_id === (course._id || course.id)).length
            }));
            setCoursesList(courses);

            // Fetch attendance data
            const attendancePromises = enrichedClasses.flatMap(cls => 
              cls.schedules.map(schedule => getAttendanceBySchedule(schedule._id))
            );
            const attendanceResponses = await Promise.all(attendancePromises);
            const attendanceData = attendanceResponses.flatMap(response => extractData(response));
            
            const attendanceCounts = {
              present: 0,
              absent: 0,
              late: 0
            };
            
            attendanceData.forEach(attendance => {
              if (attendanceCounts[attendance.status] !== undefined) {
                attendanceCounts[attendance.status]++;
              }
            });

            const total = attendanceCounts.present + attendanceCounts.absent + attendanceCounts.late;
            const attendanceStats = total > 0 ? [
              { name: 'Present', value: attendanceCounts.present },
              { name: 'Absent', value: attendanceCounts.absent },
              { name: 'Late', value: attendanceCounts.late }
            ] : [
              { name: 'Present', value: 0 },
              { name: 'Absent', value: 0 },
              { name: 'Late', value: 0 }
            ];
            setAttendanceStats(attendanceStats);

            // Calculate monthly hours
            const monthlyTeachingHours = new Map();
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            months.forEach(month => monthlyTeachingHours.set(month, 0));

            enrichedClasses.forEach(cls => {
              cls.schedules.forEach(schedule => {
                const startTime = new Date(schedule.start_time);
                const month = months[startTime.getMonth()];
                const endTime = new Date(schedule.end_time);
                const hours = (endTime - startTime) / (1000 * 60 * 60);
                monthlyTeachingHours.set(
                  month,
                  (monthlyTeachingHours.get(month) || 0) + hours
                );
              });
            });

            const monthlyData = months.map(month => ({
              name: month,
              hours: parseFloat(monthlyTeachingHours.get(month).toFixed(1)) || 0
            }));
            setMonthlyHours(monthlyData);
          } catch (error) {
            console.error("Error fetching additional data:", error);
          }
        };

        // Start fetching additional data
        fetchAdditionalData();

      } catch (error) {
        console.error("Error fetching tutor dashboard data:", error);
        setError("Unable to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTutorData();
  }, [currentTutorId]);

  // Render pie chart
  const renderPieChart = (data) => {
    if (!data || data.length === 0) {
      return <Empty description="No data available" />;
    }
    
    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);

      return (
        <text 
          x={x} 
          y={y} 
          fill="white" 
          textAnchor={x > cx ? 'start' : 'end'} 
          dominantBaseline="central"
          fontSize={12}
        >
          {data[index].name} ({(percent * 100).toFixed(0)}%)
        </text>
      );
    };

    return (
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // Format date for display
  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  // Status tag renderer
  const renderStatusTag = (status) => {
    const statusColors = {
      online: 'success',
      offline: 'default',
      open: 'success',
      'in progress': 'processing',
      closed: 'default',
      scheduled: 'processing',
      completed: 'success',
      canceled: 'error',
      pending: 'warning',
      approved: 'success',
      rejected: 'error',
      present: 'success',
      absent: 'error',
      late: 'warning'
    };
    return <Tag color={statusColors[status] || 'default'}>{status}</Tag>;
  };

  // Display dashboard
  return (
    <AppLayout title="Dashboard">
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <Spin size="large" tip="Loading data..." />
        </div>
      ) : error ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <Empty description={error} />
        </div>
      ) : (
        <div>
          {/* Stats Summary */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={12} lg={6}>
              <Card hoverable>
                <Statistic
                  title="Total Classes"
                  value={stats.totalClasses}
                  prefix={<BookOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ color: '#1890ff' }}
                />
                <div style={{ marginTop: '10px' }}>
                  <Progress 
                    percent={stats.activeClasses > 0 ? Math.round((stats.activeClasses / stats.totalClasses) * 100) : 0} 
                    showInfo={true} 
                    strokeColor="#1890ff" 
                    format={() => `${stats.activeClasses} active classes`}
                  />
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={12} lg={6}>
              <Card hoverable>
                <Statistic
                  title="Total Students"
                  value={stats.totalStudents}
                  prefix={<UserOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a' }}
                />
                <div style={{ marginTop: '10px' }}>
                  <Text type="secondary">
                    {stats.totalClasses > 0 
                      ? `Average ${Math.round(stats.totalStudents / stats.totalClasses)} students/class` 
                      : 'No assigned classes yet'}
                  </Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={12} lg={6}>
              <Card hoverable>
                <Statistic
                  title="Teaching Hours"
                  value={stats.hours}
                  prefix={<ClockCircleOutlined style={{ color: '#722ed1' }} />}
                  valueStyle={{ color: '#722ed1' }}
                  suffix="hrs"
                />
                <div style={{ marginTop: '10px' }}>
                  <Text type="secondary">{stats.completedSessions} completed sessions</Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={12} lg={6}>
              <Card hoverable>
                <Statistic
                  title="Materials & Assignments"
                  value={stats.assignmentsCount + stats.materialsCount}
                  prefix={<FileTextOutlined style={{ color: '#fa8c16' }} />}
                  valueStyle={{ color: '#fa8c16' }}
                />
                <div style={{ marginTop: '10px' }}>
                  <Text>{stats.materialsCount} materials, {stats.assignmentsCount} assignments</Text>
                </div>
              </Card>
            </Col>
          </Row>
          
          {/* Main Dashboard */}
          <Card style={{ marginTop: '16px' }}>
            <Tabs defaultActiveKey="overview" size="large">
              {/* Overview Tab */}
              <TabPane tab={<span><DashboardOutlined /> Overview</span>} key="overview">
                <Row gutter={[16, 16]}>
                  {/* Attendance Statistics and Monthly Teaching Hours on the same row */}
                  <Col xs={24} md={12} lg={8}>
                    <Card title="Attendance Statistics" bordered={false}>
                      {renderPieChart(attendanceStats)}
                    </Card>
                  </Col>
                  
                  <Col xs={24} md={12} lg={16}>
                    <Card title="Monthly Teaching Hours" bordered={false}>
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart
                          data={monthlyHours}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="hours" name="Teaching Hours" fill="#1890ff" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>
                  </Col>
                </Row>
              </TabPane>
              
              {/* Classes Tab */}
              <TabPane tab={<span><BookOutlined /> Classes</span>} key="classes">
                <Card bordered={false}>
                  <Table
                    columns={[
                      {
                        title: 'Class Name',
                        key: 'name',
                        render: (_, record) => (
                          <span>
                            {record.course_name || record.name || 'Unnamed Class'} - {record.code}
                          </span>
                        ),
                      },
                      {
                        title: 'Class Code',
                        dataIndex: 'code',
                        key: 'code',
                      },
                      {
                        title: 'Status',
                        dataIndex: 'status',
                        key: 'status',
                        render: renderStatusTag,
                      },
                      {
                        title: 'Students',
                        dataIndex: 'studentsCount',
                        key: 'studentsCount',
                        render: (count) => count || 0,
                      },
                      {
                        title: 'Materials',
                        key: 'materials',
                        render: (_, record) => (
                          <span>
                            <Badge count={record.materialsCount || 0} style={{ backgroundColor: '#52c41a' }} /> materials
                          </span>
                        ),
                      },
                      {
                        title: 'Assignments',
                        key: 'assignments',
                        render: (_, record) => (
                          <span>
                            <Badge count={record.assignmentsCount || 0} style={{ backgroundColor: '#1890ff' }} /> assignments
                          </span>
                        ),
                      },
                      {
                        title: 'Actions',
                        key: 'actions',
                        render: () => (
                          <>
                            <Button type="link">Details</Button>
                            <Button type="link">Take Attendance</Button>
                          </>
                        ),
                      }
                    ]}
                    dataSource={classesList}
                    rowKey={(record) => record._id || record.id}
                    pagination={{ pageSize: 5 }}
                    locale={{ emptyText: <Empty description="No assigned classes" /> }}
                  />
                </Card>
              </TabPane>
              
              {/* Courses Tab */}
              <TabPane tab={<span><BankOutlined /> Courses</span>} key="courses">
                <Card bordered={false}>
                  <Table
                    columns={[
                      {
                        title: 'Course Name',
                        dataIndex: 'name',
                        key: 'name',
                        render: (text) => <a>{text}</a>,
                      },
                      {
                        title: 'Course Code',
                        dataIndex: 'code',
                        key: 'code',
                      },
                      {
                        title: 'Department',
                        key: 'department',
                        dataIndex: 'department_id',
                        render: (dept) => dept?.name || 'Not specified',
                      },
                      {
                        title: 'Classes',
                        key: 'classes',
                        dataIndex: 'classesCount',
                        render: (count) => count || 0,
                      },
                      {
                        title: 'Actions',
                        key: 'actions',
                        render: () => (
                          <Button type="link">View Details</Button>
                        ),
                      }
                    ]}
                    dataSource={coursesList}
                    rowKey={(record) => record._id || record.id}
                    pagination={{ pageSize: 5 }}
                    locale={{ emptyText: <Empty description="No courses available" /> }}
                  />
                </Card>
              </TabPane>
              
              {/* Students Tab */}
              <TabPane tab={<span><UserOutlined /> Students</span>} key="students">
                <Card bordered={false}>
                  <Table
                    columns={[
                      {
                        title: 'Student',
                        key: 'student',
                        render: (_, record) => (
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar 
                              src={record.avatar_path ? `${staticURL}/${record.avatar_path}` : null} 
                              icon={!record.avatar_path && <UserOutlined />}
                              size="large"
                              style={{ marginRight: '10px' }}
                            />
                            <div>
                              <div>
                                <strong>
                                  {(record.first_name && record.last_name) 
                                    ? `${record.first_name} ${record.last_name}` 
                                    : (record.name || 'No name provided')}
                                </strong>
                              </div>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {record.student_code || ''}
                              </Text>
                            </div>
                          </div>
                        ),
                      },
                      {
                        title: 'Email',
                        dataIndex: 'email',
                        key: 'email',
                      },
                      {
                        title: 'Department',
                        key: 'department',
                        render: (_, record) => record.department?.name || 'Not specified',
                      },
                      {
                        title: 'Status',
                        dataIndex: 'status',
                        key: 'status',
                        render: renderStatusTag,
                      },
                      {
                        title: 'Actions',
                        key: 'actions',
                        render: () => (
                          <>
                            <Button type="link">Profile</Button>
                            <Button type="link">Contact</Button>
                          </>
                        ),
                      }
                    ]}
                    dataSource={classStudents}
                    rowKey={(record) => record._id || record.id}
                    pagination={{ pageSize: 8 }}
                    locale={{ emptyText: <Empty description="No students found" /> }}
                  />
                </Card>
              </TabPane>
            </Tabs>
          </Card>
        </div>
      )}
    </AppLayout>
  );
};

export default TutorDashboard;
