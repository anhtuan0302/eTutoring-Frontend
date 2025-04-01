import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Table, Button, message, Input, Space } from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import { getAllTutors } from "../../../../api/organization/tutor";
import { getAllDepartments } from "../../../../api/organization/department";
import { getAllUsers } from "../../../../api/auth/user";
import {
  SearchOutlined,
  DownloadOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";

const ListTutors = ({ basePath, customPermissions }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // States
  const [tutors, setTutors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Xác định basePath
  const effectiveBasePath = useMemo(() => {
    if (basePath) return basePath;
    switch (user?.role) {
      case "admin":
        return "/admin";
      case "staff":
        return "/staff";
      case "tutor":
        return "/tutor";
      default:
        return "/";
    }
  }, [basePath, user?.role]);

  // Xác định permissions
  const permissions = useMemo(() => {
    if (customPermissions) return customPermissions;
    switch (user?.role) {
      case "admin":
        return {
          canView: true,
          canCreate: true,
          canEdit: true,
          canExport: true,
        };
      case "staff":
        return {
          canView: true,
          canCreate: true,
          canEdit: true,
          canExport: true,
        };
      case "tutor":
        return {
          canView: true,
          canCreate: false,
          canEdit: false,
          canExport: false,
        };
      default:
        return {
          canView: true,
          canCreate: false,
          canEdit: false,
          canExport: false,
        };
    }
  }, [customPermissions, user?.role]);

  // Fetch data
  const fetchTutors = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllTutors();
      setTutors(data);
      setPagination((prev) => ({
        ...prev,
        total: data.length,
      }));
    } catch (error) {
      console.error("Error fetching tutors:", error);
      message.error("Failed to load tutors list");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await getAllDepartments();
        setDepartments(data);
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };
    const fetchUsers = async () => {
      try {
        const data = await getAllUsers();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchDepartments();
    fetchTutors();
    fetchUsers();
  }, [fetchTutors]);

  // Filter data
  const filteredTutors = useMemo(() => {
    let result = [...tutors];
    const search = searchText.toLowerCase();

    if (search) {
      result = result.filter((tutor) => {
        const tutorCode = tutor.tutor_code?.toLowerCase() || "";
        const department = tutor.department_id?.name?.toLowerCase() || "";
        const fullName = `${tutor.user_id?.first_name} ${tutor.user_id?.last_name}`.toLowerCase() || "";
        const email = tutor.user_id?.email?.toLowerCase() || "";
        const phone = tutor.user_id?.phone_number?.toLowerCase() || "";
        return tutorCode.includes(search) || department.includes(search) || fullName.includes(search) || email.includes(search) || phone.includes(search);
      });
    }

    return result;
  }, [tutors, searchText, departments, users]);

  // Table columns
  const columns = useMemo(() => {
    const baseColumns = [
        {
            title: "Avatar",
            key: "avatar",
            width: 80,
            render: (_, record) => {
              const avatarUrl = record.user_id?.avatar_path
                ? `http://localhost:8000/${record.user_id.avatar_path}`
                : '/default-avatar.png';
              
              return (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.target.onerror = null; // Prevent infinite loop
                    e.target.src = '/default-avatar.png';
                  }}
                />
              );
            },
          },
      {
        title: "Code",
        key: "tutor_code",
        render: (_, record) => record.tutor_code || "-",
        sorter: (a, b) =>
          `${a.first_name} ${a.last_name}`.localeCompare(
            `${b.first_name} ${b.last_name}`
          ),
      },
      {
        title: "Full Name",
        key: "full_name",
        render: (_, record) =>
          `${record.user_id?.first_name} ${record.user_id?.last_name}`,
      },
      {
        title: "Email",
        key: "email",
        render: (_, record) => record.user_id?.email || "-",
      },
      {
        title: "Phone",
        key: "phone_number",
        render: (_, record) => record.user_id?.phone_number || "-",
      },
      {
        title: "Department",
        key: "department",
        render: (_, record) => record.department_id?.name || "-",
      },
      {
        title: "Created At",
        key: "createdAt",
        render: (_, record) =>
          record.createdAt ? new Date(record.createdAt).toLocaleString() : "-",
      },
    ];

    if (permissions.canEdit || permissions.canView) {
      baseColumns.push({
        title: "Actions",
        key: "actions",
        render: (_, record) => (
          <Space>
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() =>
                navigate(`${effectiveBasePath}/tutor/${record._id}`)
              }
            >
              View
            </Button>
            {permissions.canEdit && (
              <Button
                type="link"
                onClick={() =>
                  navigate(`${effectiveBasePath}/tutor/${record._id}/edit`)
                }
              >
                Edit
              </Button>
            )}
          </Space>
        ),
      });
    }

    return baseColumns;
  }, [effectiveBasePath, navigate, permissions]);

  // Export to Excel
  const exportToExcel = useCallback(() => {
    const dataToExport = filteredTutors.map((tutor) => ({
      "Tutor Code": tutor.tutor_code || "-",
      "Full Name": `${tutor.user_id?.first_name} ${tutor.user_id?.last_name}`,
      "Username": tutor.user_id?.username || "-",
      "Email": tutor.user_id?.email || "-",
      "Phone": tutor.user_id?.phone_number || "-",
      "Department": tutor.department_id?.name || "-",
      "Created At": tutor.createdAt
        ? new Date(tutor.createdAt).toLocaleString()
        : "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tutors");

    const today = new Date();
    const dateStr = `${today.getDate()}-${
      today.getMonth() + 1
    }-${today.getFullYear()}`;
    XLSX.writeFile(workbook, `Tutors_${dateStr}.xlsx`);
  }, [filteredTutors]);

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
          <Input
            placeholder="Search tutors..."
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />

          {permissions.canExport && (
            <Button
              type="default"
              icon={<DownloadOutlined />}
              onClick={exportToExcel}
            >
              Export Excel
            </Button>
          )}
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredTutors}
        rowKey="_id"
        loading={loading}
        bordered
        pagination={{
          ...pagination,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} tutors`,
        }}
        onChange={(newPagination) => setPagination(newPagination)}
      />
    </div>
  );
};

export default ListTutors;
