import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Helmet } from "react-helmet";
import {
  Layout,
  Menu,
  theme,
  Breadcrumb,
  Typography,
  Button,
  Drawer,
  AutoComplete,
  Input,
  Empty,
  Badge,
  Avatar,
  Dropdown,
  Space,
  message,
  Tag,
  Popover,
  List,
  Spin,
} from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import {
  DashboardOutlined,
  UserOutlined,
  BookOutlined,
  FileTextOutlined,
  MessageOutlined,
  SettingOutlined,
  HomeOutlined,
  UsergroupAddOutlined,
  MenuOutlined,
  SearchOutlined,
  BellOutlined,
  DownOutlined,
  LogoutOutlined,
  CalendarOutlined,
  ContactsOutlined,
  ApartmentOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/en";

import { getAllUsers } from "../../api/auth/user";
import { getAllClasses } from "../../api/education/classInfo";
import { getAllCourses } from "../../api/education/course";
import firebaseNotificationService from "../../api/firebaseNotification";
import { useAuth } from "../../AuthContext";
import { staticURL } from "../../api/config";

const { Header, Sider, Content, Footer } = Layout;
const { Title } = Typography;

const logoURL = process.env.PUBLIC_URL + "/images/logo.png";

// Custom colors
const THEME_COLORS = {
  lightBg: "#F7FAFD",
  white: "#FFFFFF",
  textPrimary: "#333333",
  textSecondary: "#666666",
  borderColor: "#E5E9F2",
};

dayjs.extend(relativeTime);
dayjs.locale("en");

const AppLayout = ({ children, title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Xác định basePath dựa trên role của user
  const basePath = useMemo(() => {
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
  }, [user?.role]);

  // Xác định permissions dựa trên role của user
  const permissions = useMemo(() => {
    switch (user?.role) {
      case "admin":
        return {
          canViewDashboard: true,
          canViewCalendar: true,
          canViewPendingUsers: true,
          canViewAllUsers: true,
          canViewAllDepartments: true,
          canViewClasses: true,
          canViewCourses: true,
          canViewPosts: true,
          canViewMessages: true,
          canViewReports: true,
          canViewSettings: true,
        };
      case "staff":
        return {
          canViewDashboard: true,
          canViewCalendar: true,
          canViewPendingUsers: true,
          canViewAllUsers: true,
          canViewAllDepartments: true,
          canViewClasses: true,
          canViewCourses: true,
          canViewPosts: true,
          canViewMessages: true,
          canViewReports: true,
          canViewSettings: false,
        };
      case "tutor":
        return {
          canViewDashboard: true,
          canViewCalendar: true,
          canViewPendingUsers: false,
          canViewAllUsers: false,
          canViewAllDepartments: false,
          canViewClasses: true,
          canViewCourses: true,
          canViewPosts: true,
          canViewMessages: true,
          canViewReports: false,
          canViewSettings: false,
        };
      case "student":
        return {
          canViewDashboard: true,
          canViewCalendar: true,
          canViewPendingUsers: false,
          canViewAllUsers: false,
          canViewAllDepartments: false,
          canViewClasses: true,
          canViewCourses: true,
          canViewPosts: true,
          canViewMessages: true,
          canViewReports: false,
          canViewSettings: false,
        };
      default:
        return {
          canViewDashboard: false,
          canViewCalendar: false,
          canViewPendingUsers: false,
          canViewAllUsers: false,
          canViewAllDepartments: false,
          canViewClasses: false,
          canViewCourses: false,
          canViewPosts: false,
          canViewMessages: false,
          canViewReports: false,
          canViewSettings: false,
        };
    }
  }, [user?.role]);

  // States
  const [isMobile, setIsMobile] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [openKeys, setOpenKeys] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [searchOptions, setSearchOptions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(true);

  // Get menu items based on permissions
  const getMenuItems = useCallback(() => {
    const items = [];

    if (permissions.canViewDashboard) {
      items.push({
        key: "dashboard",
        icon: <DashboardOutlined />,
        label: "Dashboard",
        path: `${basePath}/dashboard`,
      });
    }

    if (permissions.canViewCalendar) {
      items.push({
        key: "calendar",
        icon: <CalendarOutlined />,
        label: "Calendar",
        path: `${basePath}/classSchedule`,
      });
    }

    if (permissions.canViewPendingUsers) {
      items.push({
        key: "pending-user",
        icon: <UserOutlined />,
        label: "Pending Users",
        path: `${basePath}/pendingUser`,
      });
    }

    if (permissions.canViewAllUsers) {
      items.push({
        key: "allUser",
        icon: <UsergroupAddOutlined />,
        label: "All Users",
        path: `${basePath}/user`,
      });
    }

    if (permissions.canViewAllDepartments) {
      items.push({
        key: "department",
        icon: <ApartmentOutlined />,
        label: "Department",
        path: `${basePath}/department`,
      });
    }

    if (permissions.canViewClasses) {
      items.push({
        key: "classes",
        icon: <ContactsOutlined />,
        label: "Classes",
        path: `${basePath}/classInfo`,
      });
    }

    if (permissions.canViewCourses) {
      items.push({
        key: "courses",
        icon: <BookOutlined />,
        label: "Courses",
        path: `${basePath}/course`,
      });
    }

    if (permissions.canViewPosts) {
      items.push({
        key: "post",
        icon: <FileTextOutlined />,
        label: "Posts",
        path: `${basePath}/post`,
      });
    }

    if (permissions.canViewMessages) {
      items.push({
        key: "message",
        icon: <MessageOutlined />,
        label: "Message",
        path: `${basePath}/message`,
      });
    }

    if (permissions.canViewSettings) {
      items.push({
        key: "settings",
        icon: <SettingOutlined />,
        label: "System Settings",
        path: `${basePath}/settings`,
      });
    }

    return items;
  }, [permissions, basePath]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersResponse, classesResponse, coursesResponse] =
          await Promise.all([getAllUsers(), getAllClasses(), getAllCourses()]);

        // Lấy mảng users từ response
        const usersData = usersResponse.users || [];
        const classesData = classesResponse || [];
        const coursesData = coursesResponse || [];

        setUsers(usersData);
        setClasses(classesData);
        setCourses(coursesData);
        setIsDataLoaded(true);
      } catch (error) {
        console.error("Error fetching search data:", error);
        setUsers([]);
        setClasses([]);
        setCourses([]);
        setIsDataLoaded(true);
      }
    };
    fetchData();
  }, []);

  // useEffect for notifications
  useEffect(() => {
    if (user?._id) {
      const unsubscribeNotifications =
        firebaseNotificationService.subscribeToNotifications(
          user._id,
          (notifs) => {
            // Chỉ lấy các notification hợp lệ (key không phải số)
            const validNotifications = notifs.filter(
              (notification) => notification._id.startsWith("-") // Firebase auto-generated ID bắt đầu bằng '-'
            );

            console.log("Valid notifications:", validNotifications);
            setNotifications(validNotifications);
            setNotificationLoading(false);
          }
        );

      const unsubscribeCount =
        firebaseNotificationService.subscribeToUnreadCount(
          user._id,
          (count) => {
            // Chỉ đếm các notification hợp lệ
            const validCount = count;
            setNotificationCount(validCount);
          }
        );

      return () => {
        unsubscribeNotifications();
        unsubscribeCount();
      };
    }
  }, [user?._id]);

  const handleLogout = async () => {
    try {
      await logout();
      message.success("Đăng xuất thành công");
      navigate("/", { replace: true });
    } catch (error) {
      message.error("Có lỗi xảy ra khi đăng xuất");
    }
  };

  const handleProfileClick = () => {
    navigate(`${basePath}/profile`);
  };

  const handleMenuClick = ({ key, item }) => {
    const path = item.props.path;
    if (path) {
      navigate(path);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Kiểm tra xem notification có tồn tại và chưa được đọc
      if (notification && notification._id && !notification.is_read) {
        console.log("Marking notification as read:", notification._id);

        // Đóng popover trước khi thực hiện update
        setNotificationVisible(false);

        // Cập nhật trạng thái đã đọc
        await firebaseNotificationService.markAsRead(
          user._id,
          notification._id
        );

        // Thực hiện navigation nếu có
        if (notification.reference_type && notification.reference_id) {
          switch (notification.reference_type) {
            case "class":
              navigate(`${basePath}/classInfo/${notification.reference_id}`);
              break;
            default:
              break;
          }
        }
      } else {
        // Nếu notification đã được đọc, chỉ cần đóng popover và navigate
        setNotificationVisible(false);
        if (notification.reference_type && notification.reference_id) {
          switch (notification.reference_type) {
            case "class":
              navigate(`${basePath}/classInfo/${notification.reference_id}`);
              break;
            default:
              break;
          }
        }
      }
    } catch (error) {
      console.error("Error handling notification click:", error);
      message.error("Có lỗi xảy ra khi cập nhật thông báo");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (user?._id) {
      await firebaseNotificationService.markAllAsRead(user._id);
    }
  };

  const notificationContent = (
    <div style={{ width: 400 }}>
      <div
        style={{
          padding: "12px 24px",
          borderBottom: "1px solid #f0f0f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h6 style={{ margin: 0 }}>Notifications</h6>
        {notificationCount > 0 && (
          <Button type="link" onClick={handleMarkAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {notificationLoading ? (
        <div style={{ padding: "24px", textAlign: "center" }}>
          <Spin />
        </div>
      ) : notifications && notifications.length > 0 ? (
        <List
          style={{
            maxHeight: "400px",
            overflowY: "auto",
            paddingBottom: "12px",
          }}
          dataSource={notifications}
          renderItem={(notification) => {
            const isUnread = !notification.is_read;
            return (
              <List.Item
                onClick={() => handleNotificationClick(notification)}
                style={{
                  backgroundColor: isUnread ? "#f0f7ff" : "white",
                  cursor: "pointer",
                  padding: "12px 24px",
                  transition: "background-color 0.3s",
                }}
                className={isUnread ? "unread-notification" : ""}
              >
                <List.Item.Meta
                  title={
                    <div
                      style={{
                        color: isUnread ? "#1890ff" : "inherit",
                        fontWeight: isUnread ? 500 : 400,
                      }}
                    >
                      {notification.content}
                    </div>
                  }
                  description={
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      {notification.created_at
                        ? dayjs(notification.created_at).fromNow()
                        : "Just now"}
                      {notification.notification_type && (
                        <Tag
                          color={
                            notification.notification_type === "class_enrolled"
                              ? "green"
                              : notification.notification_type ===
                                "class_unenrolled"
                              ? "red"
                              : "blue"
                          }
                          style={{ marginLeft: 8 }}
                        >
                          {notification.notification_type === "class_enrolled"
                            ? "Enrolled"
                            : notification.notification_type ===
                              "class_unenrolled"
                            ? "Unenrolled"
                            : "General"}
                        </Tag>
                      )}
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No notifications"
          style={{ padding: "24px" }}
        />
      )}
    </div>
  );

  const getSelectedKeys = useCallback(() => {
    const currentPath = location.pathname;
    const menuItems = getMenuItems();

    const findKey = (items) => {
      for (const item of items) {
        if (item.path && currentPath.startsWith(item.path)) {
          return item.key;
        }
        if (item.children) {
          const childKey = findKey(item.children);
          if (childKey) return childKey;
        }
      }
      return null;
    };

    const selectedKey = findKey(menuItems);
    return selectedKey ? [selectedKey] : ["dashboard"];
  }, [location.pathname, getMenuItems]);

  // Header components
  const renderUserMenu = () => (
    <Menu
      items={[
        {
          key: "1",
          icon: <UserOutlined />,
          label: "Profile",
          onClick: handleProfileClick,
        },
        {
          type: "divider",
        },
        {
          key: "2",
          icon: <LogoutOutlined />,
          label: "Logout",
          danger: true,
          onClick: handleLogout,
        },
      ]}
    />
  );

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
    window.addEventListener("resize", checkIfMobile);

    // Clean up
    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  // Toggle menu drawer for mobile
  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  // Handle submenu open/close
  const handleOpenChange = (keys) => {
    const latestOpenKey = keys.find((key) => openKeys.indexOf(key) === -1);

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

    if (value && isDataLoaded) {
      const searchLower = value.toLowerCase();

      // Lọc users dựa trên role của người dùng hiện tại
      let matchedUsers = users.filter(
        (user) =>
          user &&
          (`${user.first_name} ${user.last_name}`
            .toLowerCase()
            .includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower) ||
            user.username.toLowerCase().includes(searchLower))
      );

      // Lọc kết quả dựa trên role của người dùng hiện tại
      switch (user?.role) {
        case "admin":
        case "staff":
          // Admin và staff có thể thấy tất cả users
          break;
        case "tutor":
          // Tutor không thể thấy admin
          matchedUsers = matchedUsers.filter((u) => u.role !== "admin");
          break;
        case "student":
          // Student chỉ có thể thấy tutor và student khác
          matchedUsers = matchedUsers.filter(
            (u) => u.role === "tutor" || u.role === "student"
          );
          break;
        default:
          matchedUsers = [];
      }

      matchedUsers = matchedUsers.slice(0, 5);

      // Tìm kiếm classes và courses như cũ
      const matchedClasses = classes
        .filter(
          (cls) =>
            cls &&
            ((cls.code && cls.code.toLowerCase().includes(searchLower)) ||
              (cls.name && cls.name.toLowerCase().includes(searchLower)) ||
              (cls.course_id?.name &&
                cls.course_id.name.toLowerCase().includes(searchLower)))
        )
        .slice(0, 5);

      const matchedCourses = courses
        .filter(
          (course) =>
            course &&
            (course.code.toLowerCase().includes(searchLower) ||
              course.name.toLowerCase().includes(searchLower))
        )
        .slice(0, 5);

      const options = [];

      // Thêm users nếu có kết quả
      if (matchedUsers.length > 0) {
        options.push({
          label: (
            <div
              style={{
                fontWeight: "bold",
                padding: "8px 12px",
                backgroundColor: "#fafafa",
              }}
            >
              Users for "{value}"
            </div>
          ),
          options: matchedUsers.map((user) => ({
            value: `user-${user._id}`,
            label: (
              <div style={{ display: "flex", alignItems: "center" }}>
                <Avatar
                  size="small"
                  src={
                    user.avatar_path ? `${staticURL}/${user.avatar_path}` : null
                  }
                  icon={!user.avatar_path && <UserOutlined />}
                  style={{ marginRight: 8 }}
                />
                <div>
                  <div>
                    {`${user.first_name} ${user.last_name}`}
                    <Tag
                      color={
                        user.role === "admin"
                          ? "red"
                          : user.role === "staff"
                          ? "blue"
                          : user.role === "tutor"
                          ? "green"
                          : "orange"
                      }
                      style={{ marginLeft: 8 }}
                    >
                      {user.role.toUpperCase()}
                    </Tag>
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {user.username} - {user.email}
                  </div>
                </div>
              </div>
            ),
          })),
        });
      }

      // Thêm classes nếu có kết quả
      if (matchedClasses.length > 0) {
        if (options.length > 0) {
          options.push({
            type: "divider",
          });
        }
        options.push({
          label: (
            <div
              style={{
                fontWeight: "bold",
                padding: "8px 12px",
                backgroundColor: "#fafafa",
              }}
            >
              Classes for "{value}"
            </div>
          ),
          options: matchedClasses.map((cls) => ({
            value: `class-${cls._id}`,
            label: (
              <div>
                <ContactsOutlined style={{ marginRight: 8 }} />
                <div style={{ display: "inline-block" }}>
                  <div>
                    {cls.code || "N/A"} {cls.name ? `- ${cls.name}` : ""}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {cls.course_id?.name
                      ? `${cls.course_id.name}`
                      : "No course"}
                    {cls.course_id?.code ? ` (${cls.course_id.code})` : ""}
                  </div>
                </div>
              </div>
            ),
          })),
        });
      }

      // Thêm courses nếu có kết quả
      if (matchedCourses.length > 0) {
        if (options.length > 0) {
          options.push({
            type: "divider",
          });
        }
        options.push({
          label: (
            <div
              style={{
                fontWeight: "bold",
                padding: "8px 12px",
                backgroundColor: "#fafafa",
              }}
            >
              Courses for "{value}"
            </div>
          ),
          options: matchedCourses.map((course) => ({
            value: `course-${course._id}`,
            label: (
              <div>
                <BookOutlined style={{ marginRight: 8 }} />
                <div style={{ display: "inline-block" }}>
                  <div>{course.name}</div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {course.code} - {course.department_id?.name}
                  </div>
                </div>
              </div>
            ),
          })),
        });
      }

      setSearchOptions(options);
    } else {
      setSearchOptions([]);
    }
    setIsSearching(false);
  };

  // Handle selecting a search result
  const handleSelectResult = (value) => {
    const [type, id] = value.split("-");

    switch (type) {
      case "user":
        const user = users.find((u) => u._id === id);
        if (user) {
          navigate(`${basePath}/${user.role}/${id}`);
        }
        break;
      case "class":
        navigate(`${basePath}/classInfo/${id}`);
        break;
      case "course":
        navigate(`${basePath}/course/${id}`);
        break;
      default:
        break;
    }

    setSearchValue("");
    setSearchOptions([]);
  };

  // Custom search dropdown rendering
  const renderSearchNotFound = () => (
    <div style={{ padding: "12px", textAlign: "center" }}>
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="No results found"
      />
    </div>
  );

  return (
    <>
      <Helmet>
        <title>{`${title} - eTutoring`}</title>
      </Helmet>
      <Layout style={{ minHeight: "100vh", background: THEME_COLORS.lightBg }}>
        {/* Sidebar - Only visible on desktop */}
        {!isMobile && (
          <Sider
            width={SIDER_WIDTH}
            style={{
              overflow: "auto",
              height: "100vh",
              position: "fixed",
              left: 0,
              top: 0,
              bottom: 0,
              background: THEME_COLORS.lightBg,
              zIndex: 1000,
            }}
            theme="light"
          >
            <div
              className="logo"
              style={{
                height: "120px",
                margin: "0px",
                padding: "0 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                color: THEME_COLORS.textPrimary,
                fontSize: "20px",
                fontWeight: "bold",
              }}
            >
              <img
                src={logoURL}
                alt="eTutoring Logo"
                style={{ height: "95px" }}
              />
            </div>
            <Menu
              theme="light"
              mode="inline"
              defaultSelectedKeys={getSelectedKeys()}
              openKeys={openKeys}
              onOpenChange={handleOpenChange}
              onClick={handleMenuClick}
              items={getMenuItems()}
              style={{
                background: THEME_COLORS.lightBg,
                border: "none",
                padding: "12px 0",
              }}
            />
          </Sider>
        )}

        <Layout
          style={{
            marginLeft: isMobile ? 0 : SIDER_WIDTH,
            transition: "all 0.3s ease",
            background: THEME_COLORS.lightBg,
          }}
        >
          <Header
            style={{
              padding: "0 24px",
              background: THEME_COLORS.lightBg,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              height: "64px",
              position: "sticky",
              top: 0,
              zIndex: 999,
              width: "100%",
            }}
          >
            {/* Left side - Logo for mobile or Search for desktop */}
            <div
              className="header-left"
              style={{ display: "flex", alignItems: "center" }}
            >
              {/* Logo - Only visible on mobile/tablet */}
              {!isMobile ? (
                <AutoComplete
                  style={{ width: 400 }}
                  options={searchOptions}
                  onSelect={handleSelectResult}
                  onSearch={handleSearchChange}
                  value={searchValue}
                  placeholder="Search for users, classes, courses..."
                  notFoundContent={
                    isSearching ? (
                      <div style={{ padding: "10px", textAlign: "center" }}>
                        Searching...
                      </div>
                    ) : (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="No results found"
                      />
                    )
                  }
                  dropdownMatchSelectWidth={400}
                >
                  <Input style={{ borderRadius: "6px" }} />
                </AutoComplete>
              ) : (
                <div
                  className="mobile-logo"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: THEME_COLORS.textPrimary,
                    marginRight: "16px",
                  }}
                >
                  <img
                    src={logoURL}
                    alt="eTutoring Logo"
                    style={{ height: "45px" }}
                  />
                </div>
              )}
            </div>

            {/* Right side - Actions and user profile */}
            <div
              className="header-right"
              style={{ display: "flex", alignItems: "center" }}
            >
              {/* Search button for mobile */}
              {isMobile && (
                <Button
                  type="text"
                  icon={<SearchOutlined />}
                  onClick={() => setMenuVisible(true)}
                  style={{ marginRight: "12px" }}
                />
              )}

              {/* Notifications - Sửa lại vị trí Badge */}
              <Popover
                content={notificationContent}
                trigger="click"
                placement="bottomRight"
                open={notificationVisible}
                onOpenChange={setNotificationVisible}
                overlayStyle={{ padding: 0 }}
                overlayInnerStyle={{ padding: 0 }}
              >
                <Button type="text" style={{ marginRight: "12px" }}>
                  <Badge count={notificationCount}>
                    <BellOutlined style={{ fontSize: "20px" }} />
                  </Badge>
                </Button>
              </Popover>

              {/* User Account Dropdown */}
              {!isMobile && (
                <Dropdown overlay={renderUserMenu()} placement="bottomRight">
                  <Space
                    style={{
                      cursor: "pointer",
                      color: THEME_COLORS.textPrimary,
                    }}
                  >
                    <Avatar
                      src={
                        user?.avatar_path
                          ? `${staticURL}/${user.avatar_path}`
                          : null
                      }
                      icon={!user?.avatar_path && <UserOutlined />}
                      size={30}
                    />
                    <span>Hello, {user?.first_name}</span>
                    <DownOutlined style={{ fontSize: "12px" }} />
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
              title={
                <img
                  src={logoURL}
                  alt="eTutoring Logo"
                  style={{ height: "32px" }}
                />
              }
              placement="right"
              closable={true}
              onClose={toggleMenu}
              open={menuVisible}
              width={SIDER_WIDTH}
              headerStyle={{
                background: THEME_COLORS.lightBg,
                height: "64px",
                borderBottom: `1px solid ${THEME_COLORS.borderColor}`,
              }}
              bodyStyle={{
                padding: 0,
                background: THEME_COLORS.lightBg,
              }}
            >
              {/* Mobile search bar */}
              <div style={{ padding: "16px 24px" }}>
                <AutoComplete
                  style={{ width: "100%" }}
                  options={searchOptions}
                  onSelect={handleSelectResult}
                  onSearch={handleSearchChange}
                  placeholder="Search..."
                  notFoundContent={
                    isSearching ? (
                      <div style={{ padding: "10px", textAlign: "center" }}>
                        Searching...
                      </div>
                    ) : (
                      renderSearchNotFound()
                    )
                  }
                >
                  <Input style={{ borderRadius: "6px" }} />
                </AutoComplete>
              </div>

              {/* User info in mobile menu */}
              <div
                style={{
                  padding: "16px 24px",
                  borderBottom: `1px solid ${THEME_COLORS.borderColor}`,
                  borderTop: `1px solid ${THEME_COLORS.borderColor}`,
                }}
              >
                <Space>
                  <Avatar
                    src={
                      user?.avatar_path
                        ? `${staticURL}/${user.avatar_path}`
                        : null
                    }
                    icon={!user?.avatar_path && <UserOutlined />}
                    size="default"
                  />
                  <div>
                    <div style={{ fontWeight: "bold" }}>
                      Hello, {user?.first_name}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: THEME_COLORS.textSecondary,
                      }}
                    >
                      {user?.email}
                    </div>
                  </div>
                </Space>
              </div>

              <Menu
                theme="light"
                mode="inline"
                defaultSelectedKeys={getSelectedKeys()}
                openKeys={openKeys}
                onClick={handleMenuClick}
                onOpenChange={handleOpenChange}
                items={getMenuItems()}
                style={{
                  height: "100%",
                  border: "none",
                  background: THEME_COLORS.lightBg,
                  padding: "12px 0",
                }}
              />

              {/* Quick actions at bottom of mobile menu */}
              <div
                style={{
                  padding: "16px 24px",
                  borderTop: `1px solid ${THEME_COLORS.borderColor}`,
                }}
              >
                <Button
                  type="primary"
                  danger
                  icon={<LogoutOutlined />}
                  onClick={handleLogout}
                  style={{ width: "100%" }}
                >
                  Sign Out
                </Button>
              </div>
            </Drawer>
          )}

          {/* Content wrapper */}
          <div
            style={{
              padding: "35px",
              background: THEME_COLORS.white,
              minHeight: "calc(100vh - 64px)",
              borderTopLeftRadius: "16px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              {/* Title Section with Breadcrumb */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <Title
                  level={4}
                  style={{
                    margin: 0,
                    color: THEME_COLORS.textPrimary,
                    fontWeight: "600",
                  }}
                >
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
                padding: "16px 0px 0px 0px",
                background: THEME_COLORS.white,
                color: THEME_COLORS.textSecondary,
                marginTop: "20px",
              }}
            >
              eTutoring ©{new Date().getFullYear()} Created by University of
              Greenwich
            </Footer>
          </div>
        </Layout>
      </Layout>
    </>
  );
};

export default AppLayout;

const styles = `
  .unread-notification:hover {
    background-color: #e6f7ff !important;
  }

  .ant-list-item {
    transition: background-color 0.3s;
  }

  .ant-popover-inner {
    border-radius: 8px;
    overflow: hidden;
  }
`;
