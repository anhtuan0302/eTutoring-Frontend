import React, { useState, useEffect } from 'react';
import AppLayout from "../../components/layouts/layout";
import { 
  Row, Col, Card, Typography, Table, Progress, Tag, Avatar, 
  Timeline, Statistic, Spin, Empty, Tabs, List, Badge, Button,
  Divider, Calendar, Alert, Grid
} from 'antd';
import { 
  UserOutlined, BookOutlined, TeamOutlined, BankOutlined,
  FileTextOutlined, ClockCircleOutlined, CheckCircleOutlined, 
  CalendarOutlined, FormOutlined, NotificationOutlined, ReloadOutlined,
  CheckSquareOutlined, ScheduleOutlined, MessageOutlined, 
  BarChartOutlined, DashboardOutlined, StarOutlined
} from '@ant-design/icons';
import { staticURL } from "../../api/config";
import { 
  ResponsiveContainer, LineChart as ReLineChart, Line, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

// API imports
import { getStudentById } from "../../api/organization/student";
import { getStudentByUserId } from "../../api/auth/user";
import { getClassStudents, getClassTutors } from "../../api/education/classInfo";
import { getStudentsByClass, getClassesByStudent } from "../../api/education/enrollment";
import { getSchedulesForStudentById } from "../../api/education/classSchedule";
import { getContentByClassId } from "../../api/education/classContent";
import { getAttendanceBySchedule, getStudentAttendance } from "../../api/education/attendance";
import { getSubmissionById, getSubmissionsByAssignment } from "../../api/education/submission";

import { useAuth } from "../../AuthContext";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { useBreakpoint } = Grid;

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

const StudentDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const screens = useBreakpoint();
  
  // State for student dashboard
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentInfo, setStudentInfo] = useState({});
  const [stats, setStats] = useState({
    totalClasses: 0,
    activeClasses: 0,
    assignmentsDue: 0,
    materialsCount: 0,
    attendanceRate: 0,
    averageGrade: 0
  });
  
  // Data lists
  const [classesList, setClassesList] = useState([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [recentGrades, setRecentGrades] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState([]);

  // Get the current user and student ID
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentStudentId, setCurrentStudentId] = useState(null);

  // Set currentStudentId based on authenticated user
  useEffect(() => {
    if (isAuthenticated && user) {
      setCurrentUserId(user.id || user._id);
      if (user.role === 'student') {
        const fetchStudentId = async () => {
          try {
            const studentResponse = await getStudentByUserId(user.id || user._id);
            const student = studentResponse.data || studentResponse;
            setCurrentStudentId(student._id);
          } catch (error) {
            console.error("Error fetching student record:", error);
          }
        };
        fetchStudentId();
      }
    }
  }, [isAuthenticated, user]);

  // Fetch student data
  useEffect(() => {
    if (!currentStudentId) {
      return;
    }

    const fetchStudentData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch student info and classes in parallel
        const [studentResponse, classesResponse] = await Promise.all([
          getStudentById(currentStudentId),
          getClassesByStudent(currentStudentId)
        ]);

        if (!studentResponse || !classesResponse) {
          throw new Error('Failed to fetch student data');
        }

        const student = studentResponse.data || studentResponse;
        if (student.user_id) {
          setStudentInfo(student.user_id);
        }

        const enrollments = extractData(classesResponse);
        if (!enrollments || !Array.isArray(enrollments)) {
          throw new Error('Invalid classes data received');
        }

        const enrichedClasses = [];
        let assignmentsDue = 0;
        let materialsCount = 0;
        let totalAttendance = 0;
        let totalSchedules = 0;
        let totalGrades = 0;
        let gradedAssignments = 0;
        let allAssignments = [];

        // Process each class in parallel
        const classPromises = enrollments.map(async (enrollment) => {
          try {
            const classInfo = enrollment.classInfo_id;
            if (!classInfo || !classInfo._id) return null;

            // Fetch class details, content, and schedules in parallel
            const [
              tutorsResponse,
              contentResponse,
              schedulesResponse
            ] = await Promise.all([
              getClassTutors(classInfo._id),
              getContentByClassId(classInfo._id),
              getSchedulesForStudentById(currentStudentId, classInfo._id)
            ]);

            const tutors = extractData(tutorsResponse);
            const classContents = extractData(contentResponse);
            const schedules = extractData(schedulesResponse);

            if (!classContents || !Array.isArray(classContents)) return null;

            const classAssignments = classContents.filter(c => c.content_type === 'assignment');
            const classMaterials = classContents.filter(c => c.content_type === 'material');

            // Count upcoming assignments
            const now = new Date();
            const upcoming = classAssignments.filter(assignment => {
              const dueDate = new Date(assignment.duedate);
              return dueDate > now;
            });
            assignmentsDue += upcoming.length;
            materialsCount += classMaterials.length;

            // Calculate attendance from schedules
            const completedSchedules = schedules.filter(s => s.status === 'completed');

            // Fetch attendance for completed schedules in parallel
            const attendancePromises = completedSchedules.map(schedule => 
              getAttendanceBySchedule(schedule._id)
            );
            const attendanceResponses = await Promise.all(attendancePromises);
            
            const presentCount = attendanceResponses.reduce((count, response) => {
              const attendances = extractData(response);
              const studentAttendance = attendances.find(a => a.student_id._id === currentStudentId);
              return count + (studentAttendance?.status === 'present' ? 1 : 0);
            }, 0);

            totalSchedules += completedSchedules.length;
            totalAttendance += presentCount;

            // Calculate grades for this class
            let classTotalGrade = 0;
            let classGradedAssignments = 0;
            
            // Fetch submissions for assignments in parallel
            const submissionPromises = classAssignments.map(assignment => 
              getSubmissionsByAssignment(assignment._id)
            );
            const submissionResponses = await Promise.all(submissionPromises);
            
            const enrichedAssignments = submissionResponses.map((response, index) => {
              const assignment = classAssignments[index];
              let studentSubmission = null;
              
              if (response && response.data) {
                if (response.data.student_id && 
                    response.data.student_id._id === currentStudentId) {
                  studentSubmission = response.data;
                }
                else if (Array.isArray(response.data)) {
                  studentSubmission = response.data.find(
                    sub => sub.student_id && 
                          (sub.student_id._id === currentStudentId || 
                           sub.student_id === currentStudentId)
                  );
                }
                else if (Array.isArray(response.data.data)) {
                  studentSubmission = response.data.data.find(
                    sub => sub.student_id && 
                          (sub.student_id._id === currentStudentId || 
                           sub.student_id === currentStudentId)
                  );
                }
              }
              
              if (studentSubmission && studentSubmission.status === 'graded' && studentSubmission.grade) {
                classTotalGrade += studentSubmission.grade.score;
                classGradedAssignments++;
              }
              
              return {
                ...assignment,
                submission: studentSubmission,
                grade: studentSubmission?.grade,
                class_name: classInfo.course_id?.code || "Unnamed Class",
                class_code: classInfo.code || "No Code",
                course_name: classInfo.course_id?.code || "Unnamed Course",
                course_code: classInfo.course_id?.code || "No Code"
              };
            });

            allAssignments.push(...enrichedAssignments);
            totalGrades += classTotalGrade;
            gradedAssignments += classGradedAssignments;

            return {
              id: classInfo._id,
              _id: classInfo._id,
              name: classInfo.course_id?.code || "Unnamed Class",
              code: classInfo.code || "No Code",
              status: classInfo.status || "unknown",
              course_id: classInfo.course_id?._id,
              course_name: classInfo.course_id?.code || "Unnamed Course",
              course_code: classInfo.course_id?.code || "No Code",
              tutors: tutors || [],
              assignments: enrichedAssignments || [],
              materials: classMaterials || [],
              schedules: schedules || [],
              averageGrade: classGradedAssignments > 0 ? Math.round(classTotalGrade / classGradedAssignments) : 0,
              attendance: {
                presentCount: presentCount,
                totalSchedules: totalSchedules
              }
            };
          } catch (error) {
            return null;
          }
        });

        // Wait for all class processing to complete
        const processedClasses = await Promise.all(classPromises);
        const validClasses = processedClasses.filter(c => c !== null);
        enrichedClasses.push(...validClasses);

        // Calculate overall average grade
        const averageGrade = gradedAssignments > 0 ? Math.round(totalGrades / gradedAssignments) : 0;
        const attendanceRate = totalSchedules > 0 ? Math.round((totalAttendance / totalSchedules) * 100) : 0;

        // Update state with initial data
        setClassesList(enrichedClasses);
        setStats({
          totalClasses: enrichedClasses.length,
          activeClasses: enrichedClasses.filter(c => c.status === 'in progress').length,
          assignmentsDue,
          materialsCount,
          attendanceRate,
          averageGrade
        });

        // Get upcoming assignments
        const upcoming = allAssignments
          .filter(assignment => new Date(assignment.duedate) > new Date())
          .sort((a, b) => new Date(a.duedate) - new Date(b.duedate))
          .slice(0, 5);
        setUpcomingAssignments(upcoming);

        // Get recent grades
        const recentGradedAssignments = allAssignments
          .filter(assignment => {
            const submission = assignment.submission;
            return submission && 
                   submission.status === 'graded' && 
                   submission.grade && 
                   submission.grade.score !== undefined;
          })
          .sort((a, b) => {
            const dateA = new Date(a.submission.grade.graded_at);
            const dateB = new Date(b.submission.grade.graded_at);
            return dateB - dateA;
          })
          .slice(0, 5);
        setRecentGrades(recentGradedAssignments);

        // Get attendance stats
        const attendanceData = [
          { name: 'Present', value: totalAttendance },
          { name: 'Absent', value: totalSchedules - totalAttendance }
        ];
        setAttendanceStats(attendanceData);

      } catch (error) {
        setError("Unable to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [currentStudentId]);

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
                  title="Enrolled Classes"
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
                  title="Assignments Due"
                  value={stats.assignmentsDue}
                  prefix={<FileTextOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a' }}
                />
                <div style={{ marginTop: '10px' }}>
                  <Text type="secondary">
                    {stats.materialsCount} learning materials available
                  </Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={12} lg={6}>
              <Card hoverable>
                <Statistic
                  title="Attendance Rate"
                  value={stats.attendanceRate}
                  prefix={<CheckCircleOutlined style={{ color: '#722ed1' }} />}
                  valueStyle={{ color: '#722ed1' }}
                  suffix="%"
                />
                <div style={{ marginTop: '10px' }}>
                  <Text type="secondary">Based on {stats.totalClasses} classes</Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={12} lg={6}>
              <Card hoverable>
                <Statistic
                  title="Average Grade"
                  value={stats.averageGrade}
                  prefix={<StarOutlined style={{ color: '#fa8c16' }} />}
                  valueStyle={{ color: '#fa8c16' }}
                />
                <div style={{ marginTop: '10px' }}>
                  <Text type="secondary">Based on graded assignments</Text>
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
                  <Col xs={24} md={12} lg={8}>
                    <Card title="Attendance Statistics" bordered={false}>
                      {renderPieChart(attendanceStats)}
                    </Card>
                  </Col>
                  <Col xs={24} md={12} lg={16}>
                    <Card title="Recent Grades" bordered={false}>
                      <List
                        dataSource={recentGrades}
                        renderItem={item => (
                          <List.Item>
                            <List.Item.Meta
                              avatar={<StarOutlined style={{ fontSize: '24px', color: '#faad14' }} />}
                              title={`${item.title} - ${item.course_name} - ${item.class_code}`}
                              description={
                                <div>
                                  <div>Score: {item.grade.score}%</div>
                                  <div>Feedback: {item.grade.feedback}</div>
                                  <div>Graded on: {formatDateTime(item.grade.graded_at)}</div>
                                </div>
                              }
                            />
                            <div>
                              {renderStatusTag(item.status)}
                            </div>
                          </List.Item>
                        )}
                      />
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
                            {record.course_name} - {record.code}
                          </span>
                        ),
                      },
                      {
                        title: 'Status',
                        dataIndex: 'status',
                        key: 'status',
                        render: renderStatusTag,
                      },
                      {
                        title: 'Tutors',
                        key: 'tutors',
                        render: (_, record) => (
                          <span>
                            {record.tutors.length} tutors
                          </span>
                        ),
                      },
                      {
                        title: 'Assignments',
                        key: 'assignments',
                        render: (_, record) => (
                          <span>
                            <Badge count={record.assignments.length} style={{ backgroundColor: '#1890ff' }} /> assignments
                          </span>
                        ),
                      },
                      {
                        title: 'Actions',
                        key: 'actions',
                        render: () => (
                          <>
                            <Button type="link">View Details</Button>
                            <Button type="link">View Materials</Button>
                          </>
                        ),
                      }
                    ]}
                    dataSource={classesList}
                    rowKey={(record) => record._id || record.id}
                    pagination={{ pageSize: 5 }}
                    locale={{ emptyText: <Empty description="No enrolled classes" /> }}
                  />
                </Card>
              </TabPane>
              
              {/* Assignments Tab */}
              <TabPane tab={<span><FileTextOutlined /> Assignments</span>} key="assignments">
                <Card bordered={false}>
                  <Table
                    columns={[
                      {
                        title: 'Assignment',
                        dataIndex: 'title',
                        key: 'title',
                      },
                      {
                        title: 'Class',
                        key: 'class',
                        render: (_, record) => (
                          <span>
                            {record.course_name} - {record.class_code}
                          </span>
                        ),
                      },
                      {
                        title: 'Due Date',
                        key: 'duedate',
                        render: (_, record) => formatDateTime(record.duedate),
                      },
                      {
                        title: 'Status',
                        key: 'status',
                        render: (_, record) => {
                          if (!record.submission) return <Tag color= "default">Not Submitted</Tag>;
                          return renderStatusTag(record.submission.status);
                        },
                      },
                      {
                        title: 'Grade',
                        key: 'grade',
                        render: (_, record) => {
                          if (!record.submission?.grade) return '-';
                          return `${record.submission.grade.score}%`;
                        },
                      },
                      {
                        title: 'Actions',
                        key: 'actions',
                        render: (_, record) => (
                          <Button type="link">View Details</Button>
                        ),
                      }
                    ]}
                    dataSource={upcomingAssignments}
                    rowKey={(record) => record._id || record.id}
                    pagination={{ pageSize: 5 }}
                    locale={{ emptyText: <Empty description="No assignments" /> }}
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

export default StudentDashboard;