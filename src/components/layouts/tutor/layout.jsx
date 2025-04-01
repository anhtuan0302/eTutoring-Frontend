import React, { useState, useEffect } from "react";
import { Layout, Menu, theme, Breadcrumb, Typography, Button, Drawer, AutoComplete, Input, Empty, Badge, Avatar, Dropdown, Space, Divider } from "antd";
import {
  CalendarOutlined,
  BookOutlined,
  ReadOutlined,
  FileTextOutlined,
  MessageOutlined,
  SettingOutlined,
  HomeOutlined,
  MenuOutlined,
  SearchOutlined,
  BellOutlined,
  DownOutlined,
  LogoutOutlined,
  UsergroupAddOutlined,
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

// Header components
const renderUserMenu = () => (
  <Menu
    items={[
      {
        key: '1',
        // icon: <UserOutlined />,
        label: 'Profile',
      },
      {
        key: '2',
        icon: <SettingOutlined />,
        label: 'Settings',
      },
      {
        type: 'divider',
      },
      {
        key: '3',
        icon: <LogoutOutlined />,
        label: 'Logout',
        danger: true,
      },
    ]}
  />
);

// Define menu items with proper structure
const getMenuItems = () => {
  return [
    {
      key: "calender",
      icon: <CalendarOutlined />,
      label: "Calender",
    },
    {
      key: "course",
      icon: <UsergroupAddOutlined />,
      label: "Course",
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
      key: "homework",
      icon: <FileTextOutlined />,
      label: "Homework",
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
      key: "settings",
      icon: <SettingOutlined />,
      label: "System Settings",
    },
  ];
};

const TutorLayout = ({ children, title }) => {
  const {
    token: { borderRadiusLG },
  } = theme.useToken();
  
  const [isMobile, setIsMobile] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [openKeys, setOpenKeys] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [searchOptions, setSearchOptions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

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

  // Handle search input change
  const handleSearchChange = (value) => {
    setSearchValue(value);
    setIsSearching(true);
    
    // Simulate searching data from API
    if (value) {
      // This is a mock implementation - replace with actual API call
      setTimeout(() => {
        // Mock results - this would be replaced with actual API data
        const mockResults = value.length > 0 
          ? [
              { value: 'Course: ' + value, label: <div>Course: <b>{value}</b></div> },
              { value: 'User: ' + value, label: <div>User: <b>{value}</b></div> },
              { value: 'Document: ' + value, label: <div>Document: <b>{value}</b></div> },
            ]
          : [];
        
        setSearchOptions(mockResults);
        setIsSearching(false);
      }, 300);
    } else {
      setSearchOptions([]);
      setIsSearching(false);
    }
  };

  // Handle selecting a search result
  const handleSelectResult = (value) => {
    console.log('Selected:', value);
    // Handle navigation or display of selected result
  };

  // Custom search dropdown rendering
  const renderSearchNotFound = () => (
    <div style={{ padding: '12px', textAlign: 'center' }}>
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No results found" />
    </div>
  );

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
            height: '120px', 
            margin: '0px',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            color: THEME_COLORS.textPrimary,
            fontSize: '20px',
            fontWeight: 'bold',
          }}>
            <img src={logoURL} alt="eTutoring Logo" style={{ height: '95px' }} />
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
          {/* Left side - Logo for mobile or Search for desktop */}
          <div className="header-left" style={{ display: 'flex', alignItems: 'center' }}>
            {/* Logo - Only visible on mobile/tablet */}
            {!isMobile ? (
              <AutoComplete
                style={{ width: 400 }}
                options={searchOptions}
                onSelect={handleSelectResult}
                onSearch={handleSearchChange}
                value={searchValue}
                placeholder="Search for courses, users, documents..."
                notFoundContent={isSearching ? <div style={{ padding: '10px', textAlign: 'center' }}>Searching...</div> : renderSearchNotFound()}
                dropdownMatchSelectWidth={400}
              >
                <Input 
                  style={{ borderRadius: '6px' }}
                />
              </AutoComplete>
            ) : (
              <div className="mobile-logo" style={{ 
                display: 'flex',
                alignItems: 'center',
                fontSize: '20px',
                fontWeight: 'bold',
                color: THEME_COLORS.textPrimary,
                marginRight: '16px',
              }}>
                <img src={logoURL} alt="eTutoring Logo" style={{ height: '45px' }} />
              </div>
            )}
          </div>
          
          {/* Right side - Actions and user profile */}
          <div className="header-right" style={{ display: 'flex', alignItems: 'center' }}>
            {/* Search button for mobile (opens a drawer/modal) */}
            {isMobile && (
              <Button 
                type="text"
                icon={<SearchOutlined />}
                onClick={() => setMenuVisible(true)}
                style={{ marginRight: '12px' }}
              />
            )}
            
            {/* Notifications */}
            <Badge count={5} dot={isMobile}>
              <Button 
                type="text" 
                icon={<BellOutlined />} 
                style={{ marginRight: '12px' }}
              />
            </Badge>
            
            {/* User Account Dropdown */}
            {!isMobile && (
              <Dropdown overlay={renderUserMenu()} placement="bottomRight">
                <Space style={{ cursor: 'pointer', color: THEME_COLORS.textPrimary }}>
                  {/* <Avatar icon={<UserOutlined />} size="small" /> */}
                  <span>Admin User</span>
                  <DownOutlined style={{ fontSize: '12px' }} />
                </Space>
              </Dropdown>
            )}
            
            {/* Menu button - Only visible on mobile/tablet */}
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={toggleMenu}
              />
            )}
          </div>
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
            {/* Mobile search bar */}
            <div style={{ padding: '16px 24px' }}>
              <AutoComplete
                style={{ width: '100%' }}
                options={searchOptions}
                onSelect={handleSelectResult}
                onSearch={handleSearchChange}
                placeholder="Search..."
                notFoundContent={isSearching ? <div style={{ padding: '10px', textAlign: 'center' }}>Searching...</div> : renderSearchNotFound()}
              >
                <Input 
                  style={{ borderRadius: '6px' }}
                />
              </AutoComplete>
            </div>
            
            {/* User info in mobile menu */}
            <div style={{ padding: '16px 24px', borderBottom: `1px solid ${THEME_COLORS.borderColor}`, borderTop: `1px solid ${THEME_COLORS.borderColor}` }}>
              <Space>
                {/* <Avatar icon={<UserOutlined />} size="default" /> */}
                <div>
                  <div style={{ fontWeight: 'bold' }}>Admin User</div>
                  <div style={{ fontSize: '12px', color: THEME_COLORS.textSecondary }}>admin@example.com</div>
                </div>
              </Space>
            </div>
            
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
            
            {/* Quick actions at bottom of mobile menu */}
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${THEME_COLORS.borderColor}` }}>
              <Button
                type="primary"
                danger
                icon={<LogoutOutlined />}
                style={{ width: '100%' }}
              >
                Sign Out
              </Button>
            </div>
          </Drawer>
        )}
        
        {/* Content wrapper */}
        <div style={{ 
          padding: '35px',
          background: THEME_COLORS.white,
          minHeight: 'calc(100vh - 64px)',
          borderTopLeftRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
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
            
            {/* Main content */}
            {children}
          </div>
          
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

export default TutorLayout;