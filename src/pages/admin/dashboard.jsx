import React, { useState, useEffect } from "react";
import AppLayout from "../../components/layouts/layout";
import { 
  Row, Col, Card, Typography, Table, Progress, Tag, Avatar, 
  Timeline, Statistic, Spin, Empty, Tabs, List, Badge, Button,
  Divider
} from 'antd';
import { 
  UserOutlined, BookOutlined, TeamOutlined, BankOutlined,
  FileTextOutlined, ClockCircleOutlined, CheckCircleOutlined, 
  CalendarOutlined, FormOutlined, NotificationOutlined, ReloadOutlined,
  RiseOutlined, LineChartOutlined, AreaChartOutlined, DashboardOutlined,
  CheckSquareOutlined, ScheduleOutlined, ApartmentOutlined
} from '@ant-design/icons';
import { BarChart, PieChart } from '@mui/x-charts';
import { staticURL } from "../../api/config";
import { 
  ResponsiveContainer, LineChart as ReLineChart, Line, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar,
  Bar
} from 'recharts';

// API imports
import { getAllUsers } from "../../api/auth/user";
import { getAllCourses } from "../../api/education/course";
import { getAllClasses } from "../../api/education/classInfo";
import { getAllStudents } from "../../api/organization/student";
import { getAllTutors } from "../../api/organization/tutor";
import { getAllStaffs } from "../../api/organization/staff";
import { getAllPosts } from "../../api/blog/post";
import { getAllDepartments } from "../../api/organization/department";
import { getAllSchedules } from "../../api/education/classSchedule";
import { getContentByClassId } from "../../api/education/classContent";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const Dashboard = () => {
  // State for all dashboard data
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    students: 0,
    tutors: 0,
    staff: 0,
    courses: 0,
    classes: {
      total: 0,
      open: 0,
      inProgress: 0,
      closed: 0
    },
    schedules: {
      total: 0,
      scheduled: 0, 
      completed: 0,
      canceled: 0
    },
    departments: 0,
    posts: {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    },
    assignments: 0,
    materials: 0
  });
  const [studentsList, setStudentsList] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [scheduleData, setScheduleData] = useState({
    monthNames: [],
    monthlyStudents: []
  });
  const [departmentStats, setDepartmentStats] = useState([]);
  const [upcomingSchedules, setUpcomingSchedules] = useState([]);
  const [error, setError] = useState(null);

  // Fetch all data on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        const [
          usersResponse, 
          coursesResponse, 
          classesResponse, 
          studentsResponse,
          tutorsResponse,
          staffsResponse,
          postsResponse,
          departmentsResponse,
          schedulesResponse
        ] = await Promise.all([
          getAllUsers({}).catch(err => {
            console.error("Error fetching users:", err);
            return { data: [] };
          }),
          getAllCourses().catch(err => {
            console.error("Error fetching courses:", err);
            return { data: [] };
          }),
          getAllClasses().catch(err => {
            console.error("Error fetching classes:", err);
            return { data: [] };
          }),
          getAllStudents().catch(err => {
            console.error("Error fetching students:", err);
            return { data: [] };
          }),
          getAllTutors().catch(err => {
            console.error("Error fetching tutors:", err);
            return { data: [] };
          }),
          getAllStaffs().catch(err => {
            console.error("Error fetching staff:", err);
            return { data: [] };
          }),
          getAllPosts().catch(err => {
            console.error("Error fetching posts:", err);
            return { data: [] };
          }),
          getAllDepartments().catch(err => {
            console.error("Error fetching departments:", err);
            return { data: [] };
          }),
          getAllSchedules().catch(err => {
            console.error("Error fetching schedules:", err);
            return { data: [] };
          })
        ]);

        // Log detailed API response data for debugging
        console.log("API Raw Responses:", {
          users: usersResponse,
          courses: coursesResponse,
          classes: classesResponse,
          students: studentsResponse,
          tutors: tutorsResponse,
          staff: staffsResponse,
          posts: postsResponse,
          departments: departmentsResponse,
          schedules: schedulesResponse
        });

        // Extract actual data arrays
        // Our API might return data in different formats, so we need to handle each possible structure
        const extractData = (response) => {
          if (!response) return [];
          
          // Log the actual response to see its structure
          console.log("Examining response structure:", response);
          
          // Handle case when response is null or undefined
          if (response === null || response === undefined) return [];
          
          // Handle when response is already an array
          if (Array.isArray(response)) return response;
          
          // Handle common response patterns
          if (response.data && Array.isArray(response.data)) return response.data;
          if (response.result && Array.isArray(response.result)) return response.result;
          if (response.results && Array.isArray(response.results)) return response.results;
          if (response.items && Array.isArray(response.items)) return response.items;
          
          // Special case for posts API which returns {posts: [...], total, page, totalPages}
          if (response.posts && Array.isArray(response.posts)) return response.posts;
          
          // Special case for users API which returns {users: [...], pagination: {...}}
          if (response.users && Array.isArray(response.users)) return response.users;
          
          // Handle when data is a single object, not an array
          if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
            console.log("Response contains a single object in data:", response.data);
            return [response.data];
          }
          
          // Last resort: if response itself appears to be an object with typical entity fields
          if (typeof response === 'object' && response.id) {
            console.log("Response itself appears to be an entity:", response);
            return [response];
          }
          
          console.log("Could not extract data from response:", response);
          return [];
        };

        // Normalize data using the extraction function
        const students = extractData(studentsResponse);
        const tutors = extractData(tutorsResponse);
        const staffs = extractData(staffsResponse);
        const courses = extractData(coursesResponse);
        const classes = extractData(classesResponse);
        const posts = extractData(postsResponse);
        const departments = extractData(departmentsResponse);
        const users = extractData(usersResponse);
        const schedules = extractData(schedulesResponse);

        // Debug log the extracted data counts to verify
        console.log("Extracted Data Counts:", {
          students: students.length,
          tutors: tutors.length,
          staffs: staffs.length,
          courses: courses.length,
          classes: classes.length,
          posts: posts.length,
          departments: departments.length,
          users: users.length,
          schedules: schedules.length
        });

        // Debug document structure to understand how to access fields
        if (classes.length > 0) {
          console.log("Sample class document structure:", classes[0]);
        }
        if (students.length > 0) {
          console.log("Sample student document structure:", students[0]);
        }
        if (schedules.length > 0) {
          console.log("Sample schedule document structure:", schedules[0]);
        }

        // Store sample data for debugging and improving extraction logic
        const dataSamples = {
          student: students.length > 0 ? students[0] : null,
          tutor: tutors.length > 0 ? tutors[0] : null,
          class: classes.length > 0 ? classes[0] : null,
          user: users.length > 0 ? users[0] : null,
          post: posts.length > 0 ? posts[0] : null,
          schedule: schedules.length > 0 ? schedules[0] : null
        };
        console.log("Data Structure Samples:", dataSamples);

        // Fetch class contents if there are classes
        let allClassContents = [];
        let assignmentsCount = 0;
        let materialsCount = 0;

        if (classes.length > 0) {
          try {
            // Fetch class contents only for up to 5 classes for performance
            const classesToFetch = classes.slice(0, Math.min(5, classes.length));
            // Only proceed if classes have valid IDs
            const validClasses = classesToFetch.filter(cls => cls.id || cls._id);
            
            if (validClasses.length > 0) {
              const classContentPromises = validClasses.map(cls => 
                getContentByClassId(cls.id || cls._id).catch(() => ({ data: [] }))
              );
              
              const classContentResponses = await Promise.all(classContentPromises);
              allClassContents = classContentResponses.flatMap(response => extractData(response));
              
              // Count assignments and materials
              assignmentsCount = allClassContents.filter(content => 
                content.content_type === 'assignment'
              ).length;
              
              materialsCount = allClassContents.filter(content => 
                content.content_type === 'material'
              ).length;

              console.log("Class Contents:", {
                total: allClassContents.length,
                assignments: assignmentsCount,
                materials: materialsCount,
                sample: allClassContents.length > 0 ? allClassContents[0] : null
              });
            } else {
              console.log("No valid class IDs found for fetching content");
            }
          } catch (error) {
            console.error("Error fetching class contents:", error);
          }
        }

        // Prepare student list with additional data - using proper joins based on ERDiagram
        const enrichedStudents = students.map(student => {
          // Get IDs properly handling MongoDB _id or regular id
          const studentId = student.id || student._id;
          const departmentId = student.department_id?._id || student.department_id;
          const userId = student.user_id?._id || student.user_id;
          
          // Find the associated user record - user and student have 1-1 relationship
          const userInfo = users.find(u => (u.id || u._id) === userId) || {};
          
          // Find the department information - department and student have 1-N relationship
          const departmentInfo = departments.find(d => (d.id || d._id) === departmentId) || {};
          
          return {
            key: studentId || `student-${Math.random()}`,
            id: studentId,
            name: `${userInfo.first_name || ''} ${userInfo.last_name || ''}`,
            email: userInfo.email || '',
            department: departmentInfo.name || '',
            status: userInfo.status || 'offline',
            avatar: userInfo.avatar_path ? `${staticURL}${userInfo.avatar_path}` : null,
            studentCode: student.student_code || ''
          };
        });

        // Count user status - from user table in ERD
        const userStatusStats = {
          total: users.length,
          online: users.filter(u => u.status === 'online').length,
          offline: users.filter(u => u.status === 'offline').length
        };

        // Count user roles - from user table in ERD
        const userRoleStats = {
          total: users.length,
          students: users.filter(u => u.role === 'student').length,
          tutors: users.filter(u => u.role === 'tutor').length,
          staff: users.filter(u => u.role === 'staff').length,
          admin: users.filter(u => u.role === 'admin').length
        };

        // Count class statuses based on actual data - from classInfo table in ERD
        const classStats = {
          total: classes.length,
          open: classes.filter(c => c.status === 'open').length,
          inProgress: classes.filter(c => c.status === 'in progress').length,
          closed: classes.filter(c => c.status === 'closed').length
        };

        // Count schedule statuses based on actual data - from class_schedule table in ERD
        const scheduleStats = {
          total: schedules.length,
          scheduled: schedules.filter(s => s.status === 'scheduled').length,
          completed: schedules.filter(s => s.status === 'completed').length,
          canceled: schedules.filter(s => s.status === 'canceled').length
        };

        // Count post statuses based on actual data - from post table in ERD
        const postStats = {
          total: posts.length,
          pending: posts.filter(p => p.status === 'pending').length,
          approved: posts.filter(p => p.status === 'approved').length,
          rejected: posts.filter(p => p.status === 'rejected').length
        };

        // Get recent posts with real data - from post table
        const recent = [...posts]
          .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
          .slice(0, 5)
          .map(post => {
            // Get IDs properly
            const postId = post.id || post._id;
            const userId = post.user_id || post.user_id?._id;
            
            // Join with user table based on user_id
            const author = users.find(u => (u.id || u._id) === userId) || {};
            
            return {
              id: postId || `post-${Math.random()}`,
              title: post.title || 'Untitled Post',
              author: `${author.first_name || ''} ${author.last_name || ''}`,
              created_at: post.created_at || new Date().toISOString(),
              status: post.status || 'pending',
              view_count: post.view_count || 0
            };
          });

        // Prepare upcoming class schedules - from class_schedule table
        const upcoming = [...schedules]
          .filter(schedule => schedule.status === 'scheduled')
          .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
          .slice(0, 5)
          .map(schedule => {
            // Get IDs properly
            const scheduleId = schedule.id || schedule._id;
            const classInfoId = schedule.classInfo_id?._id || schedule.classInfo_id;
            
            // Join with classInfo table based on classInfo_id
            const classInfo = classes.find(c => (c.id || c._id) === classInfoId) || {};
            
            return {
              id: scheduleId,
              className: classInfo.name || 'Unknown Class',
              startTime: schedule.start_time,
              endTime: schedule.end_time,
              isOnline: schedule.is_online,
              location: schedule.location || schedule.online_link || 'No location specified'
            };
          });

        // Department statistics with student and tutor counts
        const deptStats = departments.map(dept => {
          // Get department ID properly
          const deptId = dept.id || dept._id;
          
          // Count students in this department
          const studentsCount = students.filter(s => {
            const studentDeptId = s.department_id?._id || s.department_id;
            return studentDeptId === deptId;
          }).length;
          
          // Count tutors in this department
          const tutorsCount = tutors.filter(t => {
            const tutorDeptId = t.department_id?._id || t.department_id;
            return tutorDeptId === deptId;
          }).length;
          
          // Count courses in this department
          const associatedCourses = courses.filter(c => {
            const courseDeptId = c.department_id?._id || c.department_id;
            return courseDeptId === deptId;
          }).length;
          
          return {
            id: deptId,
            name: dept.name || 'Unknown Department',
            students: studentsCount,
            tutors: tutorsCount,
            courses: associatedCourses,
            description: dept.description || ''
          };
        });

        // Get top departments by student count
        const topDepartmentsByStudents = [...deptStats]
          .sort((a, b) => b.students - a.students)
          .slice(0, 5);

        // Calculate online status percentage for dashboard
        const onlinePercentage = users.length > 0 
          ? Math.round((userStatusStats.online / users.length) * 100) 
          : 0;

        // Calculate monthly student growth data for the bar chart
        const calculateMonthlyStudentGrowth = () => {
          // Get last 6 months
          const months = [];
          const monthlyCount = [];
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                             "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          
          const today = new Date();
          for (let i = 5; i >= 0; i--) {
            const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
            months.push(month);
            monthlyCount.push(0);
          }
          
          // Count students created in each month
          students.forEach(student => {
            const createdAt = new Date(student.createdAt || student.created_at);
            
            if (isNaN(createdAt.getTime())) {
              console.log("Invalid date found:", student.createdAt || student.created_at);
              return;
            }
            
            for (let i = 0; i < months.length; i++) {
              const monthStart = months[i];
              const monthEnd = i < months.length - 1 
                ? months[i + 1] 
                : new Date(today.getFullYear(), today.getMonth() + 1, 1);
                
              if (createdAt >= monthStart && createdAt < monthEnd) {
                monthlyCount[i]++;
                break;
              }
            }
          });
          
          // Format month names for display
          const formattedMonthNames = months.map(date => monthNames[date.getMonth()]);
          
          return {
            monthNames: formattedMonthNames,
            monthlyStudents: monthlyCount
          };
        };
        
        // Get monthly student growth data
        const studentGrowthData = calculateMonthlyStudentGrowth();

        // Update all state variables with real data
        setStats({
          students: students.length,
          tutors: tutors.length,
          staff: staffs.length,
          courses: courses.length,
          classes: classStats,
          schedules: scheduleStats,
          departments: departments.length,
          posts: postStats,
          userRoles: userRoleStats,
          userStatus: userStatusStats,
          onlinePercentage,
          assignments: assignmentsCount,
          materials: materialsCount,
          topDepartments: topDepartmentsByStudents
        });
        
        setStudentsList(enrichedStudents);
        setRecentPosts(recent);
        setDepartmentStats(deptStats);
        setUpcomingSchedules(upcoming);
        setScheduleData(studentGrowthData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Status tag renderer for different statuses
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
      rejected: 'error'
    };
    return <Tag color={statusColors[status] || 'default'}>{status}</Tag>;
  };

  // Format date for display
  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (error) {
      return "Invalid date";
    }
  };

  // Calculate time ago
  const timeAgo = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);
      
      if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    } catch (error) {
      return "Unknown time";
    }
  };

  // Render pie charts safely
  const renderPieChart = (data, labels, colors) => {
    // Check if we have valid data for the chart
    const validData = data.some(value => value > 0);
    
    if (!validData) {
      return <Empty description="No data available" />;
    }
    
    try {
      return (
        <PieChart
          series={[{
            data: data.map((value, i) => ({
              id: i,
              value: value,
              label: labels[i],
              color: colors[i]
            })),
            highlightScope: { faded: 'global', highlighted: 'item' },
            faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
          }]}
          height={280}
          width={300}
        />
      );
    } catch (error) {
      console.error("Error rendering pie chart:", error);
      return <Empty description="Error rendering chart" />;
    }
  };

  return (
    <AppLayout title="Admin Dashboard">
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <Spin size="large" tip="Loading dashboard data..." />
        </div>
      ) : error ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <Empty description={error} />
        </div>
      ) : studentsList.length === 0 && recentPosts.length === 0 && stats.students === 0 ? (
        // Show error message if no data is available
        <div style={{ padding: '24px' }}>
          <Card>
            <Empty 
              description={
                <div>
                  <p>No data available from the API. This might be due to:</p>
                  <ul>
                    <li>Backend server is not running</li>
                    <li>No data exists in the database</li>
                    <li>API response format is different than expected</li>
                  </ul>
                  <Button 
                    type="primary" 
                    onClick={() => window.location.reload()}
                    style={{ marginTop: '16px' }}
                  >
                    Reload Dashboard
                  </Button>
                  <div style={{ marginTop: '24px' }}>
                    <Text strong>Try checking the browser console (F12) for more details on the API responses.</Text>
                  </div>
                </div>
              } 
            />
          </Card>
        </div>
      ) : (
        <div>
          {/* KPI Summary Cards */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable>
                <Statistic
                  title="Total Students"
                  value={stats.students}
                  prefix={<UserOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ color: '#1890ff' }}
                />
                <div style={{ marginTop: '10px' }}>
                  <Progress percent={stats.students > 0 ? 100 : 0} showInfo={false} strokeColor="#1890ff" />
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable>
                <Statistic
                  title="Total Tutors"
                  value={stats.tutors}
                  prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a' }}
                />
                <div style={{ marginTop: '10px' }}>
                  <Progress percent={stats.tutors > 0 ? 100 : 0} showInfo={false} strokeColor="#52c41a" />
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable>
                <Statistic
                  title="Active Classes"
                  value={stats.classes.inProgress}
                  prefix={<BookOutlined style={{ color: '#722ed1' }} />}
                  valueStyle={{ color: '#722ed1' }}
                />
                <div style={{ marginTop: '10px' }}>
                  <Progress 
                    percent={stats.classes.total > 0 ? Math.round((stats.classes.inProgress / stats.classes.total) * 100) : 0} 
                    showInfo={true} 
                    strokeColor="#722ed1" 
                  />
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable>
                <Statistic
                  title="Upcoming Sessions"
                  value={stats.schedules.scheduled}
                  prefix={<CalendarOutlined style={{ color: '#fa8c16' }} />}
                  valueStyle={{ color: '#fa8c16' }}
                />
                <div style={{ marginTop: '10px' }}>
                  <Progress 
                    percent={stats.schedules.total > 0 ? Math.round((stats.schedules.scheduled / stats.schedules.total) * 100) : 0}
                    showInfo={true}
                    strokeColor="#fa8c16" 
                  />
                </div>
              </Card>
            </Col>
          </Row>
          
          {/* Main Dashboard Content with Tabs */}
          <Card style={{ marginTop: '16px' }}>
            <Tabs defaultActiveKey="overview" size="large">
              {/* Overview Tab */}
              <TabPane 
                tab={<span><DashboardOutlined /> Overview</span>} 
                key="overview"
              >
                <Row gutter={[16, 16]}>
                  {/* Activity Summary */}
                  <Col xs={24} lg={16}>
                    <Card title="Current Activity" bordered={false}>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart
                          data={[
                            { name: 'Mon', students: stats.students * 0.4, tutors: stats.tutors * 0.5, classes: stats.classes.inProgress * 0.6 },
                            { name: 'Tue', students: stats.students * 0.5, tutors: stats.tutors * 0.6, classes: stats.classes.inProgress * 0.7 },
                            { name: 'Wed', students: stats.students * 0.6, tutors: stats.tutors * 0.7, classes: stats.classes.inProgress * 0.8 },
                            { name: 'Thu', students: stats.students * 0.7, tutors: stats.tutors * 0.8, classes: stats.classes.inProgress * 0.9 },
                            { name: 'Fri', students: stats.students * 0.8, tutors: stats.tutors * 0.9, classes: stats.classes.inProgress * 1.0 },
                            { name: 'Sat', students: stats.students * 0.3, tutors: stats.tutors * 0.3, classes: stats.classes.inProgress * 0.4 },
                            { name: 'Sun', students: stats.students * 0.2, tutors: stats.tutors * 0.2, classes: stats.classes.inProgress * 0.3 },
                          ]}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Area type="monotone" dataKey="students" stackId="1" stroke="#8884d8" fill="#8884d8" />
                          <Area type="monotone" dataKey="tutors" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                          <Area type="monotone" dataKey="classes" stackId="1" stroke="#ffc658" fill="#ffc658" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Card>
                  </Col>
                  
                  {/* Online Status */}
                  <Col xs={24} lg={8}>
                    <Card title="User Status" bordered={false}>
                      <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <Progress
                          type="dashboard"
                          percent={stats.onlinePercentage || 0}
                          strokeColor={{
                            '0%': '#108ee9',
                            '100%': '#87d068',
                          }}
                          width={180}
                          format={percent => `${percent}% Online`}
                        />
                        <div style={{ marginTop: '20px' }}>
                          <Statistic
                            title="Online Users"
                            value={stats.userStatus?.online || 0}
                            suffix={`/ ${stats.userStatus?.total || 0}`}
                            valueStyle={{ color: '#3f8600' }}
                          />
                        </div>
                      </div>
                    </Card>
                  </Col>
                  
                  {/* Class Status */}
                  <Col xs={24} lg={12}>
                    <Card title="Class Status Distribution" bordered={false}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
                        {renderPieChart(
                          [stats.classes.open, stats.classes.inProgress, stats.classes.closed],
                          ['Open', 'In Progress', 'Closed'],
                          ['#52c41a', '#1890ff', '#8c8c8c']
                        )}
                      </div>
                    </Card>
                  </Col>
                  
                  {/* Student Growth */}
                  <Col xs={24} lg={12}>
                    <Card title="Student Growth by Month" bordered={false}>
                      <BarChart
                        xAxis={[{ 
                          scaleType: 'band', 
                          data: scheduleData.monthNames || []
                        }]}
                        series={[
                          { 
                            data: scheduleData.monthlyStudents || [],
                            label: 'New Students',
                            color: '#1890ff'
                          }
                        ]}
                        height={268}
                        slotProps={{
                          legend: {
                            direction: 'row',
                            position: { vertical: 'bottom', horizontal: 'middle' },
                          },
                        }}
                      />
                    </Card>
                  </Col>
                </Row>
              </TabPane>
              
              {/* User Management Tab */}
              <TabPane 
                tab={<span><UserOutlined /> Users</span>} 
                key="users"
              >
                <Row gutter={[16, 16]}>
                  {/* User Role Distribution */}
                  <Col xs={24} lg={12}>
                    <Card title="User Role Distribution" bordered={false}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
                        {renderPieChart(
                          [stats.userRoles?.students || 0, stats.userRoles?.tutors || 0, stats.userRoles?.staff || 0, stats.userRoles?.admin || 0],
                          ['Students', 'Tutors', 'Staff', 'Admin'],
                          ['#1890ff', '#52c41a', '#fa8c16', '#722ed1']
                        )}
                      </div>
                    </Card>
                  </Col>
                  
                  {/* Department Distribution */}
                  <Col xs={24} lg={12}>
                    <Card title="Department Statistics" bordered={false}>
                      <ResponsiveContainer width="100%" height={300}>
                        <RadarChart outerRadius={100} width={500} height={300} data={departmentStats.map(dept => ({
                          department: dept.name,
                          students: dept.students,
                          tutors: dept.tutors,
                          courses: dept.courses
                        }))}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="department" />
                          <PolarRadiusAxis />
                          <Radar name="Students" dataKey="students" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                          <Radar name="Tutors" dataKey="tutors" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                          <Radar name="Courses" dataKey="courses" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
                          <Legend />
                        </RadarChart>
                      </ResponsiveContainer>
                    </Card>
                  </Col>
                  
                  {/* Recent Students Table */}
                  <Col xs={24}>
                    <Card title="Student Management" bordered={false}>
                      <Table 
                        columns={[
                          {
                            title: 'Student',
                            dataIndex: 'avatar',
                            key: 'avatar',
                            render: (avatar, record) => (
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar 
                                  src={avatar} 
                                  icon={!avatar && <UserOutlined />}
                                  size="large"
                                  style={{ marginRight: '10px' }}
                                >
                                  {!avatar && record.name ? record.name.charAt(0) : '?'}
                                </Avatar>
                                <div>
                                  <div><strong>{record.name || 'Unknown'}</strong></div>
                                  {record.studentCode && (
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                      {record.studentCode}
                                    </Text>
                                  )}
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
                            dataIndex: 'department',
                            key: 'department',
                          },
                          {
                            title: 'Status',
                            dataIndex: 'status',
                            key: 'status',
                            render: renderStatusTag,
                            width: 100,
                            filters: [
                              { text: 'Online', value: 'online' },
                              { text: 'Offline', value: 'offline' },
                            ],
                            onFilter: (value, record) => record.status === value,
                          },
                          {
                            title: 'Actions',
                            key: 'actions',
                            render: (_, record) => (
                              <Button type="link">View Details</Button>
                            ),
                          }
                        ]} 
                        dataSource={studentsList}
                        pagination={{ pageSize: 5 }}
                        scroll={{ x: 'max-content' }}
                        locale={{ emptyText: <Empty description="No students found" /> }}
                      />
                    </Card>
                  </Col>
                </Row>
              </TabPane>
              
              {/* Classes Tab */}
              <TabPane 
                tab={<span><BookOutlined /> Classes</span>} 
                key="classes"
              >
                <Row gutter={[16, 16]}>
                  {/* Class Status Distribution */}
                  <Col xs={24} lg={8}>
                    <Card title="Class Status" bordered={false}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '260px' }}>
                        {renderPieChart(
                          [stats.classes.open, stats.classes.inProgress, stats.classes.closed],
                          ['Open', 'In Progress', 'Closed'],
                          ['#52c41a', '#1890ff', '#8c8c8c']
                        )}
                      </div>
                    </Card>
                  </Col>
                  
                  {/* Schedule Status Distribution */}
                  <Col xs={24} lg={8}>
                    <Card title="Session Status" bordered={false}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '260px' }}>
                        {renderPieChart(
                          [stats.schedules.scheduled, stats.schedules.completed, stats.schedules.canceled],
                          ['Scheduled', 'Completed', 'Canceled'],
                          ['#1890ff', '#52c41a', '#f5222d']
                        )}
                      </div>
                    </Card>
                  </Col>
                  
                  {/* Class Content Stats */}
                  <Col xs={24} lg={8}>
                    <Card title="Class Content" bordered={false}>
                      <div style={{ height: '260px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Statistic
                          title="Materials"
                          value={stats.materials}
                          prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
                          valueStyle={{ color: '#1890ff', marginBottom: '20px' }}
                        />
                        <Divider />
                        <Statistic
                          title="Assignments"
                          value={stats.assignments}
                          prefix={<FormOutlined style={{ color: '#fa8c16' }} />}
                          valueStyle={{ color: '#fa8c16' }}
                        />
                      </div>
                    </Card>
                  </Col>
                  
                  {/* Upcoming Class Sessions */}
                  <Col xs={24}>
                    <Card title="Upcoming Class Sessions" bordered={false}>
                      <Table
                        columns={[
                          {
                            title: 'Class Name',
                            dataIndex: 'className',
                            key: 'className',
                          },
                          {
                            title: 'Start Time',
                            dataIndex: 'startTime',
                            key: 'startTime',
                            render: (text) => formatDateTime(text),
                            sorter: (a, b) => new Date(a.startTime) - new Date(b.startTime),
                          },
                          {
                            title: 'End Time',
                            dataIndex: 'endTime',
                            key: 'endTime',
                            render: (text) => formatDateTime(text),
                          },
                          {
                            title: 'Type',
                            dataIndex: 'isOnline',
                            key: 'isOnline',
                            render: (isOnline) => isOnline ? 
                              <Tag color="geekblue">Online</Tag> : 
                              <Tag color="orange">In-person</Tag>,
                            filters: [
                              { text: 'Online', value: true },
                              { text: 'In-person', value: false },
                            ],
                            onFilter: (value, record) => record.isOnline === value,
                          },
                          {
                            title: 'Location',
                            dataIndex: 'location',
                            key: 'location',
                          },
                          {
                            title: 'Actions',
                            key: 'actions',
                            render: () => (
                              <Button type="link">View Details</Button>
                            ),
                          }
                        ]}
                        dataSource={upcomingSchedules}
                        pagination={{ pageSize: 5 }}
                        scroll={{ x: 'max-content' }}
                        locale={{ emptyText: <Empty description="No upcoming sessions" /> }}
                      />
                    </Card>
                  </Col>
                </Row>
              </TabPane>
              
              {/* Department Tab */}
              <TabPane 
                tab={<span><ApartmentOutlined /> Departments</span>} 
                key="departments"
              >
                <Row gutter={[16, 16]}>
                  {/* Department Statistics */}
                  <Col xs={24}>
                    <Card title="Department Overview" bordered={false}>
                      <Table
                        columns={[
                          {
                            title: 'Department',
                            dataIndex: 'name',
                            key: 'name',
                            render: (text) => (
                              <div>
                                <ApartmentOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                                <Text strong>{text}</Text>
                              </div>
                            ),
                            sorter: (a, b) => a.name.localeCompare(b.name),
                          },
                          {
                            title: 'Students',
                            dataIndex: 'students',
                            key: 'students',
                            sorter: (a, b) => a.students - b.students,
                          },
                          {
                            title: 'Tutors',
                            dataIndex: 'tutors',
                            key: 'tutors',
                            sorter: (a, b) => a.tutors - b.tutors,
                          },
                          {
                            title: 'Courses',
                            dataIndex: 'courses',
                            key: 'courses',
                            sorter: (a, b) => a.courses - b.courses,
                          },
                          {
                            title: 'Student/Tutor Ratio',
                            key: 'ratio',
                            render: (_, record) => (
                              <Text>
                                {record.tutors > 0 ? (record.students / record.tutors).toFixed(2) : 'N/A'}
                              </Text>
                            ),
                            sorter: (a, b) => {
                              const ratioA = a.tutors > 0 ? a.students / a.tutors : 0;
                              const ratioB = b.tutors > 0 ? b.students / b.tutors : 0;
                              return ratioA - ratioB;
                            },
                          },
                          {
                            title: 'Actions',
                            key: 'actions',
                            render: () => (
                              <Button type="link">View Details</Button>
                            ),
                          }
                        ]}
                        dataSource={departmentStats}
                        pagination={{ pageSize: 5 }}
                        scroll={{ x: 'max-content' }}
                        locale={{ emptyText: <Empty description="No departments found" /> }}
                      />
                    </Card>
                  </Col>
                  
                  {/* Department Comparison Chart */}
                  <Col xs={24}>
                    <Card title="Department Comparison" bordered={false}>
                      <div style={{ height: '400px', width: '100%' }}>
                        <BarChart
                          xAxis={[{ 
                            scaleType: 'band', 
                            data: departmentStats.map(dept => dept.name) 
                          }]}
                          series={[
                            {
                              data: departmentStats.map(dept => dept.students),
                              label: 'Students',
                              color: '#8884d8'
                            },
                            {
                              data: departmentStats.map(dept => dept.tutors),
                              label: 'Tutors',
                              color: '#82ca9d'
                            },
                            {
                              data: departmentStats.map(dept => dept.courses),
                              label: 'Courses',
                              color: '#ffc658'
                            }
                          ]}
                          height={350}
                          slotProps={{
                            legend: {
                              direction: 'row',
                              position: { vertical: 'bottom', horizontal: 'middle' },
                            },
                          }}
                        />
                      </div>
                    </Card>
                  </Col>
                </Row>
              </TabPane>
              
              {/* Blog Posts Tab */}
              <TabPane 
                tab={<span><FileTextOutlined /> Blog</span>} 
                key="blog"
              >
                <Row gutter={[16, 16]}>
                  {/* Post Status Distribution */}
                  <Col xs={24} lg={8}>
                    <Card title="Post Status" bordered={false}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
                        {renderPieChart(
                          [stats.posts.pending, stats.posts.approved, stats.posts.rejected],
                          ['Pending', 'Approved', 'Rejected'],
                          ['#faad14', '#52c41a', '#f5222d']
                        )}
                      </div>
                    </Card>
                  </Col>
                  
                  {/* Blog Stats */}
                  <Col xs={24} lg={16}>
                    <Card title="Blog Statistics" bordered={false}>
                      <Row gutter={[16, 16]}>
                        <Col span={8}>
                          <Card bordered={false}>
                            <Statistic
                              title="Total Posts"
                              value={stats.posts.total}
                              prefix={<FileTextOutlined />}
                            />
                          </Card>
                        </Col>
                        <Col span={8}>
                          <Card bordered={false}>
                            <Statistic
                              title="Pending Approval"
                              value={stats.posts.pending}
                              valueStyle={{ color: '#faad14' }}
                              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                            />
                          </Card>
                        </Col>
                        <Col span={8}>
                          <Card bordered={false}>
                            <Statistic
                              title="Approved Rate"
                              value={stats.posts.total > 0 ? Math.round((stats.posts.approved / stats.posts.total) * 100) : 0}
                              suffix="%"
                              valueStyle={{ color: '#3f8600' }}
                              prefix={<CheckCircleOutlined style={{ color: '#3f8600' }} />}
                            />
                          </Card>
                        </Col>
                      </Row>
                      
                      <div style={{ marginTop: '20px' }}>
                        <ResponsiveContainer width="100%" height={200}>
                          <ReLineChart
                            data={[
                              { name: 'Week 1', posts: stats.posts.total * 0.1, views: stats.posts.total * 2 },
                              { name: 'Week 2', posts: stats.posts.total * 0.15, views: stats.posts.total * 4 },
                              { name: 'Week 3', posts: stats.posts.total * 0.2, views: stats.posts.total * 3 },
                              { name: 'Week 4', posts: stats.posts.total * 0.25, views: stats.posts.total * 6 },
                              { name: 'Week 5', posts: stats.posts.total * 0.3, views: stats.posts.total * 8 },
                            ]}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis yAxisId="left" orientation="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip />
                            <Legend />
                            <Line yAxisId="left" type="monotone" dataKey="posts" name="Posts" stroke="#8884d8" activeDot={{ r: 8 }} />
                            <Line yAxisId="right" type="monotone" dataKey="views" name="Views" stroke="#82ca9d" />
                          </ReLineChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  </Col>
                  
                  {/* Recent Posts */}
                  <Col xs={24}>
                    <Card title="Recent Blog Posts" bordered={false}>
                      <List
                        itemLayout="horizontal"
                        dataSource={recentPosts}
                        renderItem={(item) => (
                          <List.Item 
                            actions={[
                              renderStatusTag(item.status),
                              <Button type="link">View</Button>,
                              <Button type="link">Edit</Button>
                            ]}
                          >
                            <List.Item.Meta
                              avatar={<Avatar icon={<FileTextOutlined />} />}
                              title={
                                <div>
                                  {item.title}
                                  <Badge 
                                    count={item.view_count} 
                                    style={{ 
                                      backgroundColor: '#52c41a', 
                                      marginLeft: '8px' 
                                    }}
                                    overflowCount={999}
                                    title="View count"
                                  />
                                </div>
                              }
                              description={
                                <div>
                                  <Text type="secondary">By {item.author}</Text>
                                  <Text type="secondary" style={{ marginLeft: '15px' }}>{timeAgo(item.created_at)}</Text>
                                </div>
                              }
                            />
                          </List.Item>
                        )}
                        pagination={{ pageSize: 5 }}
                        locale={{ emptyText: <Empty description="No blog posts found" /> }}
                      />
                    </Card>
                  </Col>
                </Row>
              </TabPane>
            </Tabs>
          </Card>
        </div>
      )}
    </AppLayout>
  );
};

export default Dashboard;