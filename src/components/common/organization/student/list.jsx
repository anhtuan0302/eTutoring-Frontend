import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Table,
  Button,
  message,
  Input,
  Space,
  Popconfirm,
  Upload,
  Modal,
  Empty,
  Tag
} from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import {
  getAllStudents,
  deleteStudent,
} from "../../../../api/organization/student";
import { getAllDepartments } from "../../../../api/organization/department";
import { createPendingUser } from "../../../../api/auth/pendingUser";
import { getAllUsers } from "../../../../api/auth/user";
import {
  SearchOutlined,
  DeleteOutlined,
  DownloadOutlined,
  UploadOutlined,
  EyeOutlined,
  EditOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";

const ListStudents = ({ basePath, customPermissions }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // States
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [isImportGuideVisible, setIsImportGuideVisible] = useState(false);
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
          canEdit: true,
          canImport: true,
          canExport: true,
          canDelete: true,
          canBulkDelete: true,
        };
      default:
        return {
          canView: true,
          canCreate: false,
          canEdit: false,
          canImport: false,
          canExport: false,
          canDelete: false,
          canBulkDelete: false,
        };
    }
  }, [customPermissions, user?.role]);

  // Fetch data
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllStudents();
      setStudents(data);
      setPagination((prev) => ({
        ...prev,
        total: data.length,
      }));
    } catch (error) {
      console.error("Error fetching students:", error);
      message.error("Failed to load students list");
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
    fetchStudents();
    fetchUsers();
  }, [fetchStudents]);

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteStudent(id);

        const updatedStudents = students.filter(
          (student) => student._id !== id
        );
        setStudents(updatedStudents);
        setSelectedRowKeys((prev) => prev.filter((key) => key !== id));
        setPagination((prev) => ({
          ...prev,
          total: updatedStudents.length,
        }));

        message.success("Student deleted successfully");
      } catch (error) {
        message.error(error.response?.data?.error || "Error deleting student");
        console.error("Error details:", error);
      }
    },
    [students]
  );

  const handleDeleteMultiple = useCallback(async () => {
    try {
      if (selectedRowKeys.length === 0) {
        message.warning("Please select at least one student to delete");
        return;
      }

      const deletePromises = selectedRowKeys.map((id) => deleteStudent(id));
      await Promise.all(deletePromises);

      const updatedStudents = students.filter(
        (student) => !selectedRowKeys.includes(student._id)
      );
      setStudents(updatedStudents);
      setSelectedRowKeys([]);
      setPagination((prev) => ({
        ...prev,
        total: updatedStudents.length,
      }));

      message.success(
        `Deleted ${selectedRowKeys.length} students successfully`
      );
    } catch (error) {
      message.error(error.response?.data?.error || "Error deleting students");
      console.error("Error details:", error);
    }
  }, [students, selectedRowKeys]);

  // Filter data
  const filteredStudents = useMemo(() => {
    let result = [...students];
    const search = searchText.toLowerCase();
  
    if (search) {
      result = result.filter((student) => {
        const studentCode = student.student_code?.toLowerCase() || "";
        const fullName = `${student.user_id?.first_name} ${student.user_id?.last_name}`.toLowerCase();
        const email = student.user_id?.email?.toLowerCase() || "";
        const phone = student.user_id?.phone_number?.toLowerCase() || "";
  
        return (
          studentCode.includes(search) ||
          fullName.includes(search) ||
          email.includes(search) ||
          phone.includes(search)
        );
      });
    }
  
    return result;
  }, [students, searchText]); 

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
            : "/default-avatar.png";
  
          return (
            <img
              src={avatarUrl}
              alt="Avatar"
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                objectFit: "cover",
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/default-avatar.png";
              }}
            />
          );
        },
      },
      {
        title: "Code",
        key: "student_code",
        render: (_, record) => highlightText(record.student_code, searchText),
        sorter: (a, b) => (a.student_code || "").localeCompare(b.student_code || ""),
      },
      {
        title: "Full Name",
        key: "full_name",
        render: (_, record) =>
          highlightText(
            `${record.user_id?.first_name} ${record.user_id?.last_name}`,
            searchText
          ),
        sorter: (a, b) =>
          `${a.user_id?.first_name} ${a.user_id?.last_name}`.localeCompare(
            `${b.user_id?.first_name} ${b.user_id?.last_name}`
          ),
      },
      {
        title: "Email",
        key: "email",
        render: (_, record) => highlightText(record.user_id?.email, searchText),
      },
      {
        title: "Phone",
        key: "phone_number",
        render: (_, record) => highlightText(record.user_id?.phone_number, searchText),
      },
      {
        title: "Department",
        key: "department",
        render: (_, record) => (
          <Tag color="blue">
            {highlightText(record.department_id?.name || "No Department")}
          </Tag>
        ),
        filters: departments.map((dept) => ({
          text: dept.name,
          value: dept._id,
        })),
        onFilter: (value, record) => record.department_id?._id === value,
      },
      {
        title: "Created At",
        key: "createdAt",
        render: (_, record) =>
          record.createdAt ? new Date(record.createdAt).toLocaleString() : "-",
        sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      },
    ];

    if (permissions.canEdit || permissions.canView) {
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
                  navigate(`${effectiveBasePath}/course/${record._id}`)
                }
              />
            )}
            {permissions.canEdit && (
              <Button
                type="primary"
                icon={<EditOutlined />}
                size="small"
                style={{ backgroundColor: "#faad14" }} // Màu vàng
                onClick={() =>
                  navigate(`${effectiveBasePath}/course/edit/${record._id}`)
                }
              />
            )}
            {permissions.canDelete && (
              <Popconfirm
                title="Are you sure you want to delete this course?"
                onConfirm={() => handleDelete(record._id)}
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
  }, [effectiveBasePath, navigate, permissions, searchText, highlightText, departments]);

  const downloadTemplate = useCallback(() => {
    const sampleData = [
      {
        "First Name": "John",
        "Last Name": "Doe",
        Email: "john.doe@example.com",
        "Phone Number": "0123456789",
        Department: "Information Technology",
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
      { wch: 20 }, // Department
    ];
    worksheet["!cols"] = colWidths;

    XLSX.writeFile(workbook, "Students_Template.xlsx");
  }, []);

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

  const validateImportData = useCallback(
    (data) => {
      const errors = [];

      // Kiểm tra số lượng records
      if (data.length > 500) {
        errors.push("Maximum 500 records allowed per import");
        return { hasErrors: true, errors };
      }

      // Kiểm tra email trùng lặp trong file
      const emailSet = new Set();

      data.forEach((row, index) => {
        const rowNumber = index + 2;

        if (!row["First Name"]) {
          errors.push(`Row ${rowNumber}: Missing first name`);
        }
        if (!row["Last Name"]) {
          errors.push(`Row ${rowNumber}: Missing last name`);
        }
        if (!row["Email"]) {
          errors.push(`Row ${rowNumber}: Missing email`);
        } else {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row["Email"])) {
            errors.push(`Row ${rowNumber}: Invalid email format`);
          }
          if (emailSet.has(row["Email"].toLowerCase())) {
            errors.push(`Row ${rowNumber}: Duplicate email address`);
          } else {
            emailSet.add(row["Email"].toLowerCase());
          }
        }
        if (!row["Department"]) {
          errors.push(`Row ${rowNumber}: Missing department`);
        } else {
          const departmentExists = departments.some(
            (dept) => dept.name === row["Department"]
          );
          if (!departmentExists) {
            errors.push(
              `Row ${rowNumber}: Department "${row["Department"]}" not found`
            );
          }
        }
      });

      return {
        hasErrors: errors.length > 0,
        errors,
      };
    },
    [departments]
  );

  const handleImport = useCallback(
    async (info) => {
      const { file } = info;
      setImportLoading(true);
  
      try {
        const data = await readExcelFile(file);
        const validationResult = validateImportData(data);
  
        if (validationResult.hasErrors) {
          Modal.error({
            title: "Validation Errors",
            content: (
              <div>
                <div>Please fix the following errors:</div>
                <ul style={{ maxHeight: "300px", overflowY: "auto", marginTop: "10px" }}>
                  {validationResult.errors.map((error, index) => (
                    <li key={index} style={{ color: "#ff4d4f" }}>{error}</li>
                  ))}
                </ul>
              </div>
            ),
            width: 500,
          });
          setImportLoading(false);
          return;
        }
  
        const results = {
          successCount: 0,
          errorCount: 0,
          errors: [],
        };
  
        for (const [index, row] of data.entries()) {
          try {
            const department = departments.find(
              (dept) => dept.name === row["Department"]
            );
  
            await createPendingUser({
              first_name: row["First Name"],
              last_name: row["Last Name"],
              email: row["Email"],
              phone_number: row["Phone Number"] || null,
              role: "student", // Mặc định là student
              department_id: department._id,
            });
            results.successCount++;
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
          message.success(`Successfully sent ${results.successCount} invitations`);
        }
        if (results.errorCount > 0) {
          message.error(`Failed to send ${results.errorCount} invitations`);
        }
      } catch (error) {
        console.error("Import error:", error);
        message.error(`Import failed: ${error.message}`);
      } finally {
        setImportLoading(false);
      }
    },
    [fetchStudents, readExcelFile, validateImportData, departments]
  );

  // Thêm component ImportGuideModal
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
          <h4>Instructions for importing students:</h4>
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
                  <strong>Phone Number</strong>: Optional, numbers only
                </li>
                <li>
                  <strong>Department</strong>: Required, must match existing
                  department name
                </li>
              </ul>
            </li>
            <li>Save the file in Excel format (.xlsx or .xls)</li>
            <li>Click "I Understand" to proceed with import</li>
          </ol>
        </div>
      </Modal>
    );
  }, [isImportGuideVisible, downloadTemplate]);

  // Export to Excel
  const exportToExcel = useCallback(() => {
    const dataToExport = filteredStudents.map((student) => ({
      "Student Code": student.student_code || "-",
      "Full Name": `${student.user_id?.first_name} ${student.user_id?.last_name}`,
      Username: student.user_id?.username || "-",
      Email: student.user_id?.email || "-",
      Phone: student.user_id?.phone_number || "-",
      Department: student.department_id?.name || "-",
      "Created At": student.createdAt
        ? new Date(student.createdAt).toLocaleString()
        : "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

    const today = new Date();
    const dateStr = `${today.getDate()}-${
      today.getMonth() + 1
    }-${today.getFullYear()}`;
    XLSX.writeFile(workbook, `Students_${dateStr}.xlsx`);
  }, [filteredStudents]);

  const renderEmpty = useCallback(() => {
    return (
      <Empty
        description={
          <span>
            {searchText ? "No students match your search" : "No students found"}
          </span>
        }
      />
    );
  }, [searchText]);

  const ImportResultsModal = useCallback(() => {
    return (
      <Modal
        title="Import Results"
        open={importModalVisible}
        footer={[
          <Button
            key="viewPending"
            type="primary"
            onClick={() => {
              setImportModalVisible(false);
              navigate(`${effectiveBasePath}/pendingUser`);
            }}
          >
            View Pending Users
          </Button>,
          <Button
            key="close"
            onClick={() => setImportModalVisible(false)}
          >
            Close
          </Button>,
        ]}
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
  }, [importModalVisible, importResults, effectiveBasePath, navigate]);

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
              onClick={() => navigate(`${effectiveBasePath}/student/create`)}
            >
              Add Pending Student
            </Button>
          )}

          {permissions.canBulkDelete && selectedRowKeys.length > 0 && (
            <Popconfirm
              title={`Are you sure you want to delete ${selectedRowKeys.length} selected students?`}
              onConfirm={handleDeleteMultiple}
              okText="Yes"
              cancelText="No"
            >
              <Button type="primary" danger icon={<DeleteOutlined />}>
                Delete Selected ({selectedRowKeys.length})
              </Button>
            </Popconfirm>
          )}
        </Space>

        <Space>
      <Input
        placeholder="Search students..."
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
      <ImportResultsModal /> {/* Thêm dòng này */}

      {permissions.canExport && (
        <Button icon={<DownloadOutlined />} onClick={exportToExcel}>
          Export Excel
        </Button>
      )}
    </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredStudents}
        rowKey="_id"
        loading={loading}
        bordered
        rowSelection={
          permissions.canBulkDelete
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
            `${range[0]}-${range[1]} of ${total} students`,
        }}
        onChange={(newPagination) => setPagination(newPagination)}
        locale={{
          emptyText: renderEmpty(),
        }}
      />
    </div>
  );
};

export default ListStudents;
