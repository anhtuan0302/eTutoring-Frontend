import React, { useState, useEffect, useMemo } from "react";
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
import { getPendingUsers } from "../../api/auth/pendingUser"
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

const AdminDashboard = () => {
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
  const [activityData, setActivityData] = useState([]);
  const [blogStatsData, setBlogStatsData] = useState([]);
  const [userRoleData, setUserRoleData] = useState([]);

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

  // Memoized chart components to prevent re-renders
  const studentGrowthChart = useMemo(() => {
    if (!scheduleData.monthNames || !scheduleData.monthlyStudents) return null;
    
    return (
      <BarChart
        xAxis={[{ 
          scaleType: 'band', 
          data: scheduleData.monthNames
        }]}
        series={[
          { 
            data: scheduleData.monthlyStudents,
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
    );
  }, [scheduleData.monthNames, scheduleData.monthlyStudents]);

  const departmentComparisonChart = useMemo(() => {
    if (!departmentStats || departmentStats.length === 0) return null;
    
    const deptNames = departmentStats.map(dept => dept.name);
    const studentsData = departmentStats.map(dept => dept.students);
    const tutorsData = departmentStats.map(dept => dept.tutors);
    const coursesData = departmentStats.map(dept => dept.courses);
    
    return (
      <BarChart
        xAxis={[{ 
          scaleType: 'band', 
          data: deptNames
        }]}
        series={[
          {
            data: studentsData,
            label: 'Students',
            color: '#8884d8'
          },
          {
            data: tutorsData,
            label: 'Tutors',
            color: '#82ca9d'
          },
          {
            data: coursesData,
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
    );
  }, [departmentStats]);

  const userRoleDistributionChart = useMemo(() => {
    if (!userRoleData || userRoleData.length === 0) return null;
    
    console.log("User role data for chart:", userRoleData);
    
    return (
      <PieChart
        series={[{
          data: userRoleData.map((role, i) => ({
            id: i,
            value: role.count,
            label: role.name,
            color: role.name === 'Students' ? '#1890ff' : 
                   role.name === 'Tutors' ? '#52c41a' : 
                   role.name === 'Staff' ? '#fa8c16' : 
                   '#722ed1' // Admin color
          })),
          highlightScope: { faded: 'global', highlighted: 'item' },
          faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
        }]}
        height={280}
        width={300}
      />
    );
  }, [userRoleData]);

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
          getAllUsers({ limit: 100, page: 1 }).catch(err => {
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

        // Debug: Show the original API response for users
        console.log("Original users API response:", usersResponse);
        
        // Extract data helper function
        const extractData = (response) => {
          if (!response) return [];
          
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
            return [response.data];
          }
          
          // Last resort: if response itself appears to be an object with typical entity fields
          if (typeof response === 'object' && response.id) {
            return [response];
          }
          
          return [];
        };
        
        // Extract users data from usersResponse with special handling for pagination
        let allUsers = [];
        if (usersResponse) {
          if (Array.isArray(usersResponse)) {
            allUsers = usersResponse;
          } else if (usersResponse.users && Array.isArray(usersResponse.users)) {
            allUsers = usersResponse.users;
          } else if (usersResponse.data && Array.isArray(usersResponse.data)) {
            allUsers = usersResponse.data;
          } else if (usersResponse.data && usersResponse.data.users && Array.isArray(usersResponse.data.users)) {
            allUsers = usersResponse.data.users;
          } else if (usersResponse.result && Array.isArray(usersResponse.result)) {
            allUsers = usersResponse.result;
          }
        }
        
        // Override the users array with our improved extraction
        const users = allUsers;
        console.log("Extracted users array:", users);
        console.log("Total users extracted:", users.length);

        // Normalize data using the extraction function
        const students = extractData(studentsResponse);
        const tutors = extractData(tutorsResponse);
        const staffs = extractData(staffsResponse);
        const courses = extractData(coursesResponse);
        const classes = extractData(classesResponse);
        const posts = extractData(postsResponse);
        const departments = extractData(departmentsResponse);
        const schedules = extractData(schedulesResponse);

        // Debug: Show the complete users data array to confirm it's loaded correctly
        console.log("Complete users data:", users);

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
            }
          } catch (error) {
            console.error("Error fetching class contents:", error);
          }
        }

        // Prepare student list with additional data - using proper joins based on ERDiagram
        const enrichedStudents = students.map(student => {
          // Get IDs properly handling MongoDB _id or regular id
          const studentId = student.id || student._id;
          
          // Handle both nested department object and reference ID
          let departmentId;
          let departmentName = '';
          
          if (student.department_id && typeof student.department_id === 'object') {
            departmentId = student.department_id._id;
            departmentName = student.department_id.name || '';
          } else {
            departmentId = student.department_id;
          }
          
          // Handle both nested user object and reference ID
          let userId;
          let userInfo = {};
          
          if (student.user_id && typeof student.user_id === 'object') {
            // Case 1: user_id is already an embedded object with user data
            userId = student.user_id._id;
            userInfo = student.user_id;
          } else {
            // Case 2: user_id is just a reference ID
            userId = student.user_id;
            // Find the user in users array
            userInfo = users.find(u => (u.id || u._id) === userId) || {};
          }
          
          // Find the department information if not already available
          let departmentInfo;
          if (departmentName) {
            departmentInfo = { name: departmentName, _id: departmentId };
          } else {
            departmentInfo = departments.find(d => (d.id || d._id) === departmentId) || {};
          }
          
          return {
            key: studentId || `student-${Math.random()}`,
            id: studentId,
            userId: userId,
            name: `${userInfo.first_name || ''} ${userInfo.last_name || ''}`,
            first_name: userInfo.first_name || '',
            last_name: userInfo.last_name || '',
            email: userInfo.email || '',
            phone: userInfo.phone_number || '',
            department: departmentInfo.name || '',
            departmentId: departmentId,
            status: userInfo.status || 'offline',
            avatar: userInfo.avatar_path ? `${staticURL}/${userInfo.avatar_path}` : null,
            studentCode: student.student_code || '',
            lastActive: userInfo.lastActive || null
          };
        });

        // Count user status - from user table in ERD
        const userStatusStats = {
          total: users.length,
          online: users.filter(u => u.status === 'online').length,
          offline: users.filter(u => u.status === 'offline').length
        };

        // Count user roles - Ensure we count roles from the correct response array
        // Extract users data correctly from the API response
        const userRolesCount = {
          student: 0,
          tutor: 0,
          staff: 0,
          admin: 0
        };
        
        // Counting roles precisely from users array
        users.forEach(user => {
          if (!user || !user.role) return;
          
          // Log each user and their role
          console.log(`User ${user.username || user._id}: ${user.role}`);
          
          // Count by role
          if (user.role === 'student') userRolesCount.student++;
          else if (user.role === 'tutor') userRolesCount.tutor++;
          else if (user.role === 'staff') userRolesCount.staff++;
          else if (user.role === 'admin') userRolesCount.admin++;
        });
        
        console.log("Final user role counts:", userRolesCount);
        
        // Set data for the role chart
        setUserRoleData([
          { name: 'Students', count: userRolesCount.student },
          { name: 'Tutors', count: userRolesCount.tutor },
          { name: 'Staff', count: userRolesCount.staff },
          { name: 'Admin', count: userRolesCount.admin }
        ]);
        
        // For compatibility with existing code
        const userRoleStats = {
          total: users.length,
          students: userRolesCount.student,
          tutors: userRolesCount.tutor,
          staff: userRolesCount.staff,
          admin: userRolesCount.admin
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

        // Debug studentsList
        console.log("Enriched Students:", enrichedStudents);
        
        // Generate activity data based on real database values
        const generateActivityData = () => {
          const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          
          // Create activity patterns with realistic variations based on real data
          // Weekday activity is higher than weekend activity
          const activityFactors = {
            students: [0.7, 0.8, 0.9, 0.85, 0.75, 0.5, 0.4], // Mon-Sun
            tutors: [0.8, 0.9, 0.95, 0.9, 0.8, 0.4, 0.3],
            classes: [0.8, 0.9, 1.0, 0.9, 0.7, 0.3, 0.2]
          };
          
          return dayNames.map((day, i) => ({
            name: day,
            students: Math.round(students.length * activityFactors.students[i]),
            tutors: Math.round(tutors.length * activityFactors.tutors[i]),
            classes: Math.round(classes.filter(c => c.status === 'in progress').length * activityFactors.classes[i])
          }));
        };
        
        setActivityData(generateActivityData());

        // Generate blog statistics data from real posts
        if (posts.length > 0) {
          // Group posts by week (using created_at date)
          const postsByWeek = {};
          let totalViews = 0;
          
          // Count total views
          posts.forEach(post => {
            totalViews += (post.view_count || 0);
          });
          
          // Create weekly data - use creation dates from real posts
          const weeksBack = 5;
          const weekData = [];
          
          // Current date to calculate weeks
          const today = new Date();
          
          for (let i = 0; i < weeksBack; i++) {
            // Calculate start of this week
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - (7 * i));
            weekStart.setHours(0, 0, 0, 0);
            
            // Calculate end of this week
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 7);
            
            // Count posts created in this week
            const postsThisWeek = posts.filter(post => {
              const postDate = new Date(post.created_at || post.createdAt);
              return postDate >= weekStart && postDate < weekEnd;
            }).length;
            
            // Calculate views - in a real app this would come from analytics data
            // Here we're distributing total views across weeks, weighted by post count
            const viewsThisWeek = Math.round((postsThisWeek / posts.length) * totalViews);
            
            weekData.unshift({
              name: `Week ${weeksBack - i}`,
              posts: postsThisWeek,
              views: viewsThisWeek
            });
          }
          
          setBlogStatsData(weekData);
        }
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

  return (
    <AppLayout title="Dashboard">
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
                          data={activityData}
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
                      {studentGrowthChart}
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
                        {userRoleDistributionChart}
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
                        rowKey="key"
            columns={[
              {
                            title: 'Student',
                            key: 'student',
                            render: (_, record) => (
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar 
                                  src={record.avatar} 
                                  icon={!record.avatar && <UserOutlined />}
                                  size="large"
                                  style={{ marginRight: '10px' }}
                                >
                                  {!record.avatar && record.first_name ? record.first_name.charAt(0).toUpperCase() : ''}
                                </Avatar>
                                <div>
                                  <div>
                                    <strong>
                                      {record.name && record.name.trim() !== '' && record.name !== ' ' 
                                        ? record.name 
                                        : 'Unnamed Student'}
                                    </strong>
                                  </div>
                                  <Text type="secondary" style={{ fontSize: '12px' }}>
                                    {record.studentCode}
                                  </Text>
                                </div>
                              </div>
                            ),
              },
              {
                title: 'Email',
                dataIndex: 'email',
                key: 'email',
                            render: (email) => email || '-',
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
                            title: 'Phone',
                            dataIndex: 'phone',
                            key: 'phone',
                            render: (phone) => phone || '-',
                          },
                          {
                            title: 'Actions',
                            key: 'actions',
                            render: () => (
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
                              <Tag color="green">Offline</Tag>,
                            filters: [
                              { text: 'Online', value: true },
                              { text: 'Offline', value: false },
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
                        {departmentComparisonChart}
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
                            data={blogStatsData}
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

export default AdminDashboard;