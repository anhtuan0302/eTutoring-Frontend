import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Table,
  Button,
  Popconfirm,
  message,
  Input,
  Empty,
  Space,
  Tooltip,
  Tag,
  Upload,
  Modal,
  Progress,
} from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import {
  getPendingUsers,
  cancelInvitation,
  resendInvitation,
  createPendingUser,
} from "../../../../api/auth/pendingUser";
import { getAllDepartments } from "../../../../api/organization/department";
import {
  SearchOutlined,
  DeleteOutlined,
  RedoOutlined,
  FilterOutlined,
  EyeOutlined,
  UserAddOutlined,
  DownloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";

const ListPendingUsers = ({ basePath, customPermissions }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // States
  const [pendingUsers, setPendingUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [roleFilter, setRoleFilter] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [isImportGuideVisible, setIsImportGuideVisible] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Xác định basePath
  const effectiveBasePath = useMemo(() => {
    if (basePath) return basePath;

    switch (user?.role) {
      case "admin":
        return "/admin";
      case "staff":
        return "/staff";
      default:
        return "/";
    }
  }, [basePath, user?.role]);

  // Xác định permissions
  const permissions = useMemo(() => {
    if (customPermissions) return customPermissions;

    switch (user?.role) {
      case "admin":
      case "staff":
        return {
          canView: true,
          canCreate: true,
          canCancel: true,
          canResend: true,
          canBulkCancel: true,
          canImport: true,
          canExport: true,
        };
      default:
        return {
          canView: false,
          canCreate: false,
          canCancel: false,
          canResend: false,
          canBulkCancel: false,
          canImport: false,
          canExport: false,
        };
    }
  }, [customPermissions, user?.role]);

  // Fetch data
  const fetchPendingUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPendingUsers();
      setPendingUsers(data);
      setPagination((prev) => ({
        ...prev,
        total: data.length,
      }));
    } catch (error) {
      console.error("Error fetching pending users:", error);
      message.error("Failed to load pending users list");
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
    fetchDepartments();
    fetchPendingUsers();
  }, [fetchPendingUsers]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isUploading) {
        e.preventDefault();
        e.returnValue =
          "Dữ liệu đang được tải lên. Bạn có chắc chắn muốn rời khỏi trang?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isUploading]);

  // Handle actions
  const handleCancel = useCallback(
    async (id) => {
      try {
        await cancelInvitation(id);
        message.success("Invitation cancelled successfully");
        fetchPendingUsers();
      } catch (error) {
        message.error(
          error.response?.data?.error || "Error cancelling invitation"
        );
      }
    },
    [fetchPendingUsers]
  );

  const handleResend = useCallback(
    async (id) => {
      try {
        await resendInvitation(id);
        message.success("Invitation resent successfully");
        fetchPendingUsers();
      } catch (error) {
        message.error(
          error.response?.data?.error || "Error resending invitation"
        );
      }
    },
    [fetchPendingUsers]
  );

  const handleBulkCancel = useCallback(async () => {
    try {
      const cancelPromises = selectedRowKeys.map((id) => cancelInvitation(id));
      await Promise.all(cancelPromises);
      message.success(
        `Cancelled ${selectedRowKeys.length} invitations successfully`
      );
      setSelectedRowKeys([]);
      fetchPendingUsers();
    } catch (error) {
      message.error("Error cancelling invitations");
    }
  }, [selectedRowKeys, fetchPendingUsers]);

  // Highlight text function
  const highlightText = useCallback((text, search) => {
    if (!search || !text) return text || "-";
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedSearch})`, "gi");
    return text
      .toString()
      .split(regex)
      .map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            style={{
              backgroundColor: "#ffd591",
              padding: 0,
              margin: 0,
            }}
          >
            {part}
          </mark>
        ) : (
          part
        )
      );
  }, []);

  // Filter data
  const filteredPendingUsers = useMemo(() => {
    let result = [...pendingUsers];
    const search = searchText.toLowerCase();

    if (roleFilter) {
      result = result.filter((user) => user.role === roleFilter);
    }

    if (search) {
      result = result.filter((user) => {
        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
        return (
          fullName.includes(search) ||
          user.email.toLowerCase().includes(search) ||
          user.role.toLowerCase().includes(search)
        );
      });
    }

    return result;
  }, [pendingUsers, searchText, roleFilter]);

  // Table columns
  const columns = useMemo(() => {
    const baseColumns = [
      {
        title: "Name",
        key: "name",
        render: (_, record) => `${record.first_name} ${record.last_name}`,
        sorter: (a, b) =>
          `${a.first_name} ${a.last_name}`.localeCompare(
            `${b.first_name} ${b.last_name}`
          ),
      },
      {
        title: "Email",
        dataIndex: "email",
        key: "email",
        render: (text) => highlightText(text, searchText),
      },
      {
        title: "Role",
        dataIndex: "role",
        key: "role",
        render: (role) => (
          <Tag
            color={
              role === "admin"
                ? "red"
                : role === "staff"
                ? "blue"
                : role === "tutor"
                ? "green"
                : "orange"
            }
          >
            {role.toUpperCase()}
          </Tag>
        ),
        filters: [
          { text: "Admin", value: "admin" },
          { text: "Staff", value: "staff" },
          { text: "Tutor", value: "tutor" },
          { text: "Student", value: "student" },
        ],
        onFilter: (value, record) => record.role === value,
      },
      {
        title: "Department",
        key: "department",
        render: (_, record) => record.department_id?.name || "-",
      },
      {
        title: "Status",
        key: "status",
        render: (_, record) => {
          const isExpired = new Date(record.invitation_expires_at) < new Date();
          return (
            <Tag color={isExpired ? "red" : "green"}>
              {isExpired ? "Expired" : "Active"}
            </Tag>
          );
        },
      },
      {
        title: "Expires At",
        dataIndex: "invitation_expires_at",
        key: "invitation_expires_at",
        render: (date) => new Date(date).toLocaleString(),
        sorter: (a, b) =>
          new Date(a.invitation_expires_at) - new Date(b.invitation_expires_at),
      },
    ];

    if (permissions.canView || permissions.canCancel || permissions.canResend) {
      baseColumns.push({
        title: "Actions",
        key: "actions",
        width: 120,
        render: (_, record) => (
          <Space size="small">
            {permissions.canView && (
              <Button
                type="default"   
                icon={<EyeOutlined />}
                size="small"
                onClick={() =>
                  navigate(`${effectiveBasePath}/pendingUser/${record._id}`)
                }
              />
            )}
            {permissions.canResend && (
              <Popconfirm
                title="Are you sure you want to resend this invitation?"
                onConfirm={() => handleResend(record._id)}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  type="primary"
                  icon={<RedoOutlined />}
                  size="small"
                  style={{ backgroundColor: "#faad14" }}
                />
              </Popconfirm>
            )}
            {permissions.canCancel && (
              <Popconfirm
                title="Are you sure you want to cancel this invitation?"
                onConfirm={() => handleCancel(record._id)}
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
            )}
          </Space>
        ),
      });
    }

    return baseColumns;
  }, [permissions, handleCancel, handleResend, highlightText, searchText]);

  // Empty state renderer
  const renderEmpty = useCallback(() => {
    return (
      <Empty
        description={
          <span>
            {searchText
              ? "No pending users match your search"
              : "No pending users found"}
          </span>
        }
      />
    );
  }, [searchText]);

  // Hàm export
  const exportToExcel = useCallback(() => {
    const dataToExport = filteredPendingUsers.map((user) => ({
      "First Name": user.first_name || "-",
      "Last Name": user.last_name || "-",
      Email: user.email || "-",
      "Phone Number": user.phone_number || "-",
      Role: user.role || "-",
      Department: user.department_id?.name || "-",
      "Invitation Status":
        new Date(user.invitation_expires_at) > new Date()
          ? "Active"
          : "Expired",
      "Expires At": new Date(user.invitation_expires_at).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pending Users");

    // Tự động điều chỉnh độ rộng cột
    const maxWidth = dataToExport.reduce(
      (acc, user) => ({
        "First Name": Math.max(acc["First Name"], user["First Name"].length),
        "Last Name": Math.max(acc["Last Name"], user["Last Name"].length),
        Email: Math.max(acc["Email"], user["Email"].length),
        "Phone Number": Math.max(
          acc["Phone Number"],
          user["Phone Number"].length
        ),
        Role: Math.max(acc["Role"], user["Role"].length),
        Department: Math.max(acc["Department"], user["Department"].length),
        "Invitation Status": Math.max(
          acc["Invitation Status"],
          user["Invitation Status"].length
        ),
        "Expires At": Math.max(acc["Expires At"], user["Expires At"].length),
      }),
      {
        "First Name": 10,
        "Last Name": 10,
        Email: 20,
        "Phone Number": 15,
        Role: 10,
        Department: 15,
        "Invitation Status": 15,
        "Expires At": 20,
      }
    );

    worksheet["!cols"] = Object.values(maxWidth).map((width) => ({ width }));

    const today = new Date();
    const dateStr = `${today.getDate()}-${
      today.getMonth() + 1
    }-${today.getFullYear()}`;

    XLSX.writeFile(workbook, `PendingUsers_${dateStr}.xlsx`);
  }, [filteredPendingUsers]);

  // Hàm validate file import
  const beforeUpload = useCallback((file) => {
    const isExcel =
      file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.type === "application/vnd.ms-excel";
    if (!isExcel) {
      message.error("Only Excel files are allowed!");
      return false;
    }
    return true;
  }, []);

  // Hàm đọc file Excel
  const readExcelFile = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }, []);

  // Hàm validate dữ liệu import
  // Sửa lại hàm validateImportData
  const validateImportData = useCallback((data) => {
    const errors = [];
    const validRoles = ["admin", "staff", "tutor", "student"];

    // Kiểm tra số lượng records
    if (data.length > 500) {
      errors.push("Maximum 500 records allowed per import");
      return { hasErrors: true, errors };
    }

    // Kiểm tra email trùng lặp trong file
    const emailSet = new Set();

    data.forEach((row, index) => {
      const rowNumber = index + 2;
      const role = row["Role"]?.toLowerCase();

      // Kiểm tra email trùng
      if (row["Email"]) {
        if (emailSet.has(row["Email"].toLowerCase())) {
          errors.push(`Row ${rowNumber}: Duplicate email address`);
        } else {
          emailSet.add(row["Email"].toLowerCase());
        }
      }

      // Các validation bắt buộc
      if (!row["First Name"]) {
        errors.push(`Row ${rowNumber}: Missing first name`);
      }
      if (!row["Last Name"]) {
        errors.push(`Row ${rowNumber}: Missing last name`);
      }
      if (!row["Email"]) {
        errors.push(`Row ${rowNumber}: Missing email`);
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row["Email"])) {
        errors.push(`Row ${rowNumber}: Invalid email format`);
      }
      if (!row["Role"]) {
        errors.push(`Row ${rowNumber}: Missing role`);
      } else if (!validRoles.includes(role)) {
        errors.push(
          `Row ${rowNumber}: Invalid role. Must be one of: ${validRoles.join(
            ", "
          )}`
        );
      }

      // Chỉ kiểm tra department nếu role không phải admin
      if (role && role !== "admin") {
        if (!row["Department"]) {
          errors.push(`Row ${rowNumber}: Missing department`);
        }
      }

      // Kiểm tra phone number nếu có (optional)
      if (row["Phone Number"] && !/^[0-9+\-\s()]*$/.test(row["Phone Number"])) {
        errors.push(`Row ${rowNumber}: Invalid phone number format`);
      }
    });

    return {
      hasErrors: errors.length > 0,
      errors,
    };
  }, []);

  // Sửa lại hàm handleImport
  const handleImport = useCallback(
    async (info) => {
      const { file } = info;
      setImportLoading(true);
      setIsUploading(true);
      setUploadProgress(0);

      try {
        const data = await readExcelFile(file);
        const validationResult = validateImportData(data);

        if (validationResult.hasErrors) {
          Modal.error({
            title: "Validation Errors",
            content: (
              <div>
                <div>Please fix the following errors:</div>
                <ul
                  style={{
                    maxHeight: "300px",
                    overflowY: "auto",
                    marginTop: "10px",
                  }}
                >
                  {validationResult.errors.map((error, index) => (
                    <li key={index} style={{ color: "#ff4d4f" }}>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            ),
            width: 500,
          });
          setImportLoading(false);
          setIsUploading(false);
          setUploadProgress(0);
          return;
        }

        const results = {
          successCount: 0,
          errorCount: 0,
          errors: [],
        };

        // Tính toán progress step cho mỗi item
        const progressStep = 100 / data.length;

        for (const [index, row] of data.entries()) {
          try {
            const role = row["Role"].toLowerCase();
            let department_id = undefined;

            if (role !== "admin") {
              const department = departments.find(
                (dept) => dept.name === row["Department"]
              );

              if (!department) {
                throw new Error(`Department "${row["Department"]}" not found`);
              }
              department_id = department._id;
            }

            await createPendingUser({
              first_name: row["First Name"],
              last_name: row["Last Name"],
              email: row["Email"],
              phone_number: row["Phone Number"] || undefined,
              role: role,
              department_id: department_id,
            });
            results.successCount++;

            // Cập nhật progress
            setUploadProgress(Math.min(100, (index + 1) * progressStep));
          } catch (error) {
            results.errorCount++;
            results.errors.push({
              row: index + 2,
              email: row["Email"],
              error: error.response?.data?.error || error.message,
            });
          }
        }

        setImportResults(results);
        setImportModalVisible(true);

        if (results.successCount > 0) {
          message.success(
            `Successfully sent ${results.successCount} invitations`
          );
          fetchPendingUsers();
        }
      } catch (error) {
        console.error("Import error:", error);
        message.error(`Import failed: ${error.message}`);
      } finally {
        setImportLoading(false);
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [fetchPendingUsers, readExcelFile, validateImportData, departments]
  );

  // Thêm Modal hiển thị progress
  const UploadProgressModal = useCallback(() => {
    return (
      <Modal
        title="Uploading Data"
        open={isUploading}
        closable={false}
        footer={null}
        maskClosable={false}
        width={400}
      >
        <div>
          <div style={{ marginBottom: 16 }}>
            Please do not close or refresh the page while data is being
            uploaded...
          </div>
          <Progress percent={Math.round(uploadProgress)} status="active" />
        </div>
      </Modal>
    );
  }, [isUploading, uploadProgress]);

  // Modal hiển thị kết quả import
  const ImportResultsModal = useCallback(() => {
    return (
      <Modal
        title="Import Results"
        open={importModalVisible}
        onOk={() => setImportModalVisible(false)}
        onCancel={() => setImportModalVisible(false)}
        width={800}
      >
        <div>
          <p>
            <strong>Successfully sent:</strong> {importResults?.successCount}{" "}
            invitations
          </p>
          <p>
            <strong>Failed:</strong> {importResults?.errorCount} invitations
          </p>

          {importResults?.errorCount > 0 && (
            <div>
              <h4>Error Details:</h4>
              <Table
                columns={[
                  { title: "Row", dataIndex: "row", key: "row" },
                  { title: "Email", dataIndex: "email", key: "email" },
                  { title: "Error", dataIndex: "error", key: "error" },
                ]}
                dataSource={importResults.errors}
                pagination={false}
                size="small"
                scroll={{ y: 240 }}
              />
            </div>
          )}
        </div>
      </Modal>
    );
  }, [importModalVisible, importResults]);

  const downloadTemplate = useCallback(() => {
    const sampleData = [
      {
        "First Name": "John",
        "Last Name": "Doe",
        Email: "john.doe@example.com",
        "Phone Number": "0123456789",
        Role: "student",
        Department: "Information Technology",
      },
      {
        "First Name": "Jane",
        "Last Name": "Smith",
        Email: "jane.smith@example.com",
        Role: "admin", // Ví dụ không có phone number và department
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

    // Set độ rộng cột
    const colWidths = [
      { wch: 15 }, // First Name
      { wch: 15 }, // Last Name
      { wch: 25 }, // Email
      { wch: 15 }, // Phone Number
      { wch: 10 }, // Role
      { wch: 20 }, // Department
    ];
    worksheet["!cols"] = colWidths;

    XLSX.writeFile(workbook, "PendingUsers_Template.xlsx");
  }, []);

  // Thêm component Modal hướng dẫn
  const ImportGuideModal = useCallback(() => {
    return (
      <Modal
        title="Import Guide"
        open={isImportGuideVisible}
        onCancel={() => setIsImportGuideVisible(false)}
        footer={[
          <Button key="template" type="default" onClick={downloadTemplate}>
            Download Template
          </Button>,
          <Button
            key="understand"
            type="primary"
            onClick={() => {
              setIsImportGuideVisible(false);
              document.getElementById("upload-input").click();
            }}
          >
            I Understand
          </Button>,
        ]}
        width={700}
      >
        <div style={{ marginBottom: "20px" }}>
          <h4>Instructions for importing pending users:</h4>
          <ol>
            <li>Download the template file using the button below</li>
            <li>
              Fill in the data following these rules:
              <ul style={{ marginTop: "10px" }}>
                <li>
                  <strong>First Name</strong>: Required, text
                </li>
                <li>
                  <strong>Last Name</strong>: Required, text
                </li>
                <li>
                  <strong>Email</strong>: Required, must be valid email format
                </li>
                <li>
                  <strong>Phone Number</strong>: Optional, can be left empty
                </li>
                <li>
                  <strong>Role</strong>: Required, must be one of: admin, staff,
                  tutor, student
                </li>
                <li>
                  <strong>Department</strong>: Required for staff/tutor/student,
                  not needed for admin role
                </li>
              </ul>
            </li>
            <li>Save the file in Excel format (.xlsx or .xls)</li>
            <li>Click "I Understand" to proceed with import</li>
          </ol>
        </div>

        <div
          style={{
            marginTop: "20px",
            backgroundColor: "#f5f5f5",
            padding: "15px",
            borderRadius: "5px",
          }}
        >
          <h4>Sample Data Format:</h4>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  First Name
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Last Name
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Email
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Phone Number
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Role
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Department
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Anh Tuan
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Ngo
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  anhtuan@gmail.com
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  0912345678
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  student
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Information Technology
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: "20px" }}>
          <h4>Notes:</h4>
          <ul>
            <li>All email addresses must be unique</li>
            <li>Maximum 500 records per import</li>
            <li>File size should not exceed 5MB</li>
          </ul>
        </div>
      </Modal>
    );
  }, [isImportGuideVisible, downloadTemplate]);

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
          {permissions.canCreate && (
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() =>
                navigate(`${effectiveBasePath}/pendingUser/create`)
              }
            >
              Invite User
            </Button>
          )}

          {permissions.canBulkCancel && selectedRowKeys.length > 0 && (
            <Popconfirm
              title={`Are you sure you want to cancel ${selectedRowKeys.length} selected invitations?`}
              onConfirm={handleBulkCancel}
              okText="Yes"
              cancelText="No"
            >
              <Button type="primary" danger icon={<DeleteOutlined />}>
                Cancel Selected ({selectedRowKeys.length})
              </Button>
            </Popconfirm>
          )}
        </Space>

        <Space>
          <Input
            placeholder="Search pending users..."
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          {permissions.canImport && (
            <>
              <Button
                icon={<UploadOutlined />}
                onClick={() => setIsImportGuideVisible(true)}
              >
                Import Excel
              </Button>
              <Upload
                id="upload-input"
                accept=".xlsx, .xls"
                beforeUpload={beforeUpload}
                customRequest={handleImport}
                showUploadList={false}
                disabled={importLoading}
                style={{ display: "none" }}
              >
                <Button style={{ display: "none" }} />
              </Upload>
            </>
          )}
          <ImportGuideModal />
          <UploadProgressModal />
          {permissions.canExport && (
            <Button icon={<DownloadOutlined />} onClick={exportToExcel}>
              Export Excel
            </Button>
          )}
        </Space>
        {importModalVisible && <ImportResultsModal />}
      </div>

      <Table
        columns={columns}
        dataSource={filteredPendingUsers}
        rowKey="_id"
        loading={loading}
        bordered
        rowSelection={
          permissions.canBulkCancel
            ? {
                type: "checkbox",
                selectedRowKeys,
                onChange: setSelectedRowKeys,
              }
            : null
        }
        pagination={{
          ...pagination,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} pending users`,
        }}
        onChange={(newPagination) => setPagination(newPagination)}
        locale={{
          emptyText: renderEmpty(),
        }}
      />
    </div>
  );
};

export default ListPendingUsers;
