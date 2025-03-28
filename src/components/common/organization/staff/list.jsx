import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Table, Button, message, Input, Space } from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import { getAllStaffs } from "../../../../api/organization/staff";
import { getAllDepartments } from "../../../../api/organization/department";
import { getAllUsers } from "../../../../api/auth/user";
import { SearchOutlined, DownloadOutlined, EyeOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";

const ListStaffs = ({ basePath, customPermissions }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // States
  const [staffs, setStaffs] = useState([]);
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
      case "admin": return "/admin";
      case "staff": return "/staff";
      default: return "/";
    }
  }, [basePath, user?.role]);

  // Xác định permissions
  const permissions = useMemo(() => {
    if (customPermissions) return customPermissions;
    switch(user?.role) {
      case 'admin':
        return {
          canView: true,
          canCreate: true,
          canEdit: true,
          canExport: true
        };
      default:
        return {
          canView: true,
          canCreate: false,
          canEdit: false,
          canExport: false
        };
    }
  }, [customPermissions, user?.role]);

  // Fetch data
  const fetchStaffs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllStaffs();
      setStaffs(data);
      setPagination((prev) => ({
        ...prev,
        total: data.length,
      }));
    } catch (error) {
      console.error("Error fetching staffs:", error);
      message.error("Failed to load staffs list");
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
    fetchStaffs();
    fetchUsers();
  }, [fetchStaffs]);

  // Filter data
  const filteredStaffs = useMemo(() => {
    let result = [...staffs];
    const search = searchText.toLowerCase();
    
    if (search) {
      result = result.filter(staff => {
        const staffCode = staff.staff_code?.toLowerCase() || '';
        const department = staff.department_id?.name?.toLowerCase() || '';
        return staffCode.includes(search) || department.includes(search);
      });
    }
    
    return result;
  }, [staffs, searchText]);

  // Table columns
  const columns = useMemo(() => {
    const baseColumns = [
      {
        title: "Code",
        key: "staff_code",
        render: (_, record) => record.staff_code || "-",
        sorter: (a, b) =>
          `${a.first_name} ${a.last_name}`.localeCompare(
            `${b.first_name} ${b.last_name}`
          ),
      },
      {
        title: "Full Name",
        key: "full_name",
        render: (_, record) => `${record.user_id?.first_name} ${record.user_id?.last_name}`,
      },
      {
        title: "Username",
        key: "username",
        render: (_, record) => record.user_id?.username || "-",
        sorter: (a, b) =>
          a.user_id?.username.localeCompare(b.user_id?.username),
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
        render: (_, record) => record.createdAt ? new Date(record.createdAt).toLocaleString() : "-",
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
              onClick={() => navigate(`${effectiveBasePath}/staff/${record._id}`)}
            >
              View
            </Button>
            {permissions.canEdit && (
              <Button 
                type="link" 
                onClick={() => navigate(`${effectiveBasePath}/staff/${record._id}/edit`)}
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
    const dataToExport = filteredStaffs.map(staff => ({
      'Staff Code': staff.staff_code || '-',
      'Full Name': `${staff.user_id?.first_name} ${staff.user_id?.last_name}`,
      'Username': staff.user_id?.username || '-',
      'Email': staff.user_id?.email || '-',
      'Phone': staff.user_id?.phone_number || '-',
      'Department': staff.department_id?.name || '-',
      'Created At': staff.createdAt ? new Date(staff.createdAt).toLocaleString() : '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Staffs");
    
    const today = new Date();
    const dateStr = `${today.getDate()}-${today.getMonth()+1}-${today.getFullYear()}`;
    XLSX.writeFile(workbook, `Staffs_${dateStr}.xlsx`);
  }, [filteredStaffs]);

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        <Space>
          <Input
            placeholder="Search staffs..."
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
        dataSource={filteredStaffs} 
        rowKey="_id" 
        loading={loading}
        bordered
        pagination={{
          ...pagination,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} staffs`,
        }}
        onChange={(newPagination) => setPagination(newPagination)}
      />
    </div>
  );
};

export default ListStaffs;