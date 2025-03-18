import React, { useState, useEffect } from "react";
import { Layout, Menu, theme, Breadcrumb, Typography, Button, Drawer } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  BookOutlined,
  ReadOutlined,
  FileTextOutlined,
  MessageOutlined,
  BarChartOutlined,
  SettingOutlined,
  HomeOutlined,
  SafetyCertificateOutlined,
  MenuOutlined,
} from "@ant-design/icons";

const { Header, Sider, Content, Footer } = Layout;
const { Title } = Typography;

const logoURL = process.env.PUBLIC_URL + "/images/logo.png";

// Custom colors
const THEME_COLORS = {
  lightBg: '#F7FAFD',
  white: '#FFFFFF',
  textPrimary: '#333333',
  textSecondary: '#666666',
  borderColor: '#E5E9F2'
};

// Define menu items with proper structure
const getMenuItems = () => {
  return [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
    },
    {
      key: "user-management",
      icon: <UserOutlined />,
      label: "User Management",
      children: [
        {
          key: "users",
          label: "All Users",
        },
        {
          key: "pending-users",
          label: "Pending Accounts",
        },
        {
          key: "students",
          label: "Students",
        },
        {
          key: "tutors",
          label: "Tutors",
        },
        {
          key: "staff",
          label: "Staff",
        },
        {
          key: "departments",
          label: "Departments",
        },
      ],
    },
    {
      key: "permissions",
      icon: <SafetyCertificateOutlined />, // Sử dụng icon thay thế
      label: "Access Control",
      children: [
        {
          key: "roles",
          label: "Roles",
        },
        {
          key: "permissions-list",
          label: "Permissions",
        },
        {
          key: "role-permissions",
          label: "Role Permissions",
        },
      ],
    },
    {
      key: "courses",
      icon: <BookOutlined />,
      label: "Course Management",
      children: [
        {
          key: "course-categories",
          label: "Course Categories",
        },
        {
          key: "course-list",
          label: "Courses",
        },
        {
          key: "classes",
          label: "Classes",
        },
        {
          key: "class-tutors",
          label: "Tutor Assignments",
        },
        {
          key: "enrollments",
          label: "Enrollments",
        },
      ],
    },
    {
      key: "learning",
      icon: <ReadOutlined />,
      label: "Learning",
      children: [
        {
          key: "class-schedules",
          label: "Class Schedules",
        },
        {
          key: "class-materials",
          label: "Learning Materials",
        },
        {
          key: "assignments",
          label: "Assignments",
        },
        {
          key: "submissions",
          label: "Submissions",
        },
        {
          key: "attendance",
          label: "Attendance",
        },
        {
          key: "grades",
          label: "Grades",
        },
        {
          key: "class-reviews",
          label: "Class Reviews",
        },
      ],
    },
    {
      key: "content",
      icon: <FileTextOutlined />,
      label: "Content Management",
      children: [
        {
          key: "post-categories",
          label: "Post Categories",
        },
        {
          key: "posts",
          label: "Posts",
        },
        {
          key: "post-comments",
          label: "Comments",
        },
      ],
    },
    {
      key: "communication",
      icon: <MessageOutlined />,
      label: "Communication",
      children: [
        {
          key: "notifications",
          label: "Notifications",
        },
        {
          key: "messages",
          label: "Messages",
        },
        {
          key: "email-templates",
          label: "Email Templates",
        },
      ],
    },
    {
      key: "reports",
      icon: <BarChartOutlined />,
      label: "Reports & Statistics",
      children: [
        {
          key: "user-reports",
          label: "User Statistics",
        },
        {
          key: "course-reports",
          label: "Course Statistics",
        },
        {
          key: "attendance-reports",
          label: "Attendance Statistics",
        },
        {
          key: "grade-reports",
          label: "Grade Statistics",
        },
        {
          key: "account-history",
          label: "Activity History",
        },
      ],
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "System Settings",
    },
  ];
};

const AppLayout = ({ children, title }) => {
  const {
    token: { borderRadiusLG },
  } = theme.useToken();
  
  const [isMobile, setIsMobile] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [openKeys, setOpenKeys] = useState([]);

  // Sider width - increased for better visibility
  const SIDER_WIDTH = 260;

  // Check if screen is mobile/tablet size
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 992);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Toggle menu drawer for mobile
  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  // Handle submenu open/close
  const handleOpenChange = (keys) => {
    const latestOpenKey = keys.find(key => openKeys.indexOf(key) === -1);
    
    if (latestOpenKey) {
      setOpenKeys([latestOpenKey]);
    } else {
      setOpenKeys([]);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: THEME_COLORS.lightBg }}>
      {/* Sidebar - Only visible on desktop */}
      {!isMobile && (
        <Sider
          width={SIDER_WIDTH}
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            background: THEME_COLORS.lightBg,
            zIndex: 1000,
          }}
          theme="light"
        >
          <div className="logo" style={{ 
            height: '110px', 
            margin: '0px',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            color: THEME_COLORS.textPrimary,
            fontSize: '20px',
            fontWeight: 'bold',
          }}>
            <img src={logoURL} alt="eTutoring Logo" style={{ height: '100px' }} />
          </div>
          <Menu
            theme="light"
            mode="inline"
            defaultSelectedKeys={["dashboard"]}
            openKeys={openKeys}
            onOpenChange={handleOpenChange}
            items={getMenuItems()}
            style={{
              background: THEME_COLORS.lightBg,
              border: 'none',
              padding: '12px 0',
            }}
          />
        </Sider>
      )}
      
      <Layout style={{ 
        marginLeft: isMobile ? 0 : SIDER_WIDTH,
        transition: 'all 0.3s ease',
        background: THEME_COLORS.lightBg,
      }}>
        <Header
          style={{
            padding: "0 24px",
            background: THEME_COLORS.lightBg,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '64px',
            position: 'sticky',
            top: 0,
            zIndex: 999,
            width: '100%',
          }}
        >
          {/* Logo in header - Only visible on mobile/tablet */}
          {isMobile && (
            <div className="mobile-logo" style={{ 
              height: '64px', 
              display: 'flex',
              alignItems: 'center',
              fontSize: '20px',
              fontWeight: 'bold',
              color: THEME_COLORS.textPrimary,
            }}>
              <img src={logoURL} alt="eTutoring Logo" style={{ height: '40px' }} />
            </div>
          )}
          
          {/* Empty div for desktop (to keep header clean) */}
          {!isMobile && <div></div>}
          
          {/* Menu button - Only visible on mobile/tablet */}
          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={toggleMenu}
              style={{
                fontSize: '18px',
              }}
            />
          )}
        </Header>
        
        {/* Drawer for menu display on mobile/tablet */}
        {isMobile && (
          <Drawer 
            title={<img src={logoURL} alt="eTutoring Logo" style={{ height: '32px' }} />}
            placement="right" 
            closable={true} 
            onClose={toggleMenu} 
            open={menuVisible}
            width={SIDER_WIDTH}
            headerStyle={{
              background: THEME_COLORS.lightBg,
              height: '64px',
              borderBottom: `1px solid ${THEME_COLORS.borderColor}`,
            }}
            bodyStyle={{ 
              padding: 0,
              background: THEME_COLORS.lightBg,
            }}
          >
            <Menu
              theme="light"
              mode="inline"
              defaultSelectedKeys={["dashboard"]}
              openKeys={openKeys}
              onOpenChange={handleOpenChange}
              items={getMenuItems()}
              style={{ 
                height: '100%',
                border: 'none',
                background: THEME_COLORS.lightBg,
                padding: '12px 0',
              }}
            />
          </Drawer>
        )}
        
        {/* Content wrapper - tất cả nội dung từ breadcrumb đến footer đều nằm trong đây */}
        <div style={{ 
          padding: '35px',
          background: THEME_COLORS.white,
          minHeight: 'calc(100vh - 64px)', // Trừ đi chiều cao của header
          borderTopLeftRadius: '16px', // Bo góc trên bên trái
        }}>
          {/* Title Section with Breadcrumb */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <Title level={4} style={{ 
              margin: 0,
              color: THEME_COLORS.textPrimary,
              fontWeight: '600',
            }}>
              {title}
            </Title>
              
            <Breadcrumb>
              <Breadcrumb.Item>
                <HomeOutlined /> Home
              </Breadcrumb.Item>
              <Breadcrumb.Item>{title}</Breadcrumb.Item>
            </Breadcrumb>
          </div>
          
          {/* Nội dung chính - không có wrapper, trực tiếp hiển thị children */}
          {children}
          
          {/* Footer */}
          <Footer
            style={{
              textAlign: "center",
              padding: '16px 0',
              background: THEME_COLORS.white,
              color: THEME_COLORS.textSecondary,
              marginTop: '20px',
            }}
          >
            eTutoring ©{new Date().getFullYear()} Created by University of
            Greenwich
          </Footer>
        </div>
      </Layout>
    </Layout>
  );
};

export default AppLayout;