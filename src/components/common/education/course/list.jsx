import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Table,
  Tag,
  Button,
  Popconfirm,
  message,
  Input,
  Empty,
  Space,
  Upload,
  Modal,
  Tooltip,
} from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import {
  getAllCourses,
  deleteCourse,
  createCourse,
} from "../../../../api/education/course";
import { getAllDepartments } from "../../../../api/organization/department";
import {
  SearchOutlined,
  DeleteOutlined,
  DownloadOutlined,
  UploadOutlined,
  FilterOutlined,
  EyeOutlined,
  EditOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";

const ListCourses = ({ basePath, customPermissions }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Xác định basePath dựa theo role nếu không được cung cấp
  const effectiveBasePath = useMemo(() => {
    if (basePath) return basePath;

    // Tự động xác định basePath dựa vào role
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
  }, [basePath, user?.role]);

  // Xác định permissions dựa vào role
  const permissions = useMemo(() => {
    // Nếu có customPermissions, ưu tiên sử dụng
    if (customPermissions) return customPermissions;

    // Mặc định permissions dựa vào role
    switch (user?.role) {
      case "admin":
        return {
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true,
          canImport: true,
          canExport: true,
          canBulkDelete: true,
        };
      case "staff":
        return {
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true,
          canImport: true,
          canExport: true,
          canBulkDelete: true,
        };
      case "tutor":
        return {
          canView: true,
          canCreate: false,
          canEdit: false,
          canDelete: false,
          canImport: false,
          canExport: true,
          canBulkDelete: false,
        };
      case "student":
      default:
        return {
          canView: true,
          canCreate: false,
          canEdit: false,
          canDelete: false,
          canImport: false,
          canExport: false,
          canBulkDelete: false,
        };
    }
  }, [customPermissions, user?.role]);

  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [importLoading, setImportLoading] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [nameFilter, setNameFilter] = useState(null);
  const [isImportGuideVisible, setIsImportGuideVisible] = useState(false);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllCourses();
      setCourses(data);
      setPagination((prev) => ({
        ...prev,
        total: data.length,
      }));
    } catch (error) {
      console.error("Error fetching courses:", error);
      message.error("Failed to load course list");
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
    fetchCourses();
  }, [fetchCourses]);

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteCourse(id);

        const updatedCourses = courses.filter((course) => course._id !== id);
        setCourses(updatedCourses);
        setSelectedRowKeys((prev) => prev.filter((key) => key !== id));
        setPagination((prev) => ({
          ...prev,
          total: updatedCourses.length,
        }));

        message.success("Course deleted successfully");
      } catch (error) {
        message.error(error.response?.data?.error || "Error deleting course");
        console.error("Error details:", error);
      }
    },
    [courses]
  );

  const handleDeleteMultiple = useCallback(async () => {
    try {
      if (selectedRowKeys.length === 0) {
        message.warning("Please select at least one course to delete"); // Sửa text này nữa
        return;
      }

      const deletePromises = selectedRowKeys.map((id) => deleteCourse(id)); // Sửa từ deleteDepartment thành deleteCourse
      await Promise.all(deletePromises);

      const updatedCourses = courses.filter(
        (course) => !selectedRowKeys.includes(course._id)
      );
      setCourses(updatedCourses);
      setSelectedRowKeys([]);
      setPagination((prev) => ({
        ...prev,
        total: updatedCourses.length,
      }));

      message.success(`Deleted ${selectedRowKeys.length} courses successfully`);
    } catch (error) {
      message.error(error.response?.data?.error || "Error deleting courses");
      console.error("Error details:", error);
    }
  }, [courses, selectedRowKeys]);

  const highlightText = useCallback((text, search) => {
    if (!search || !text) return text || "-";

    // Escape special characters in search text
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Sử dụng positive lookbehind và lookahead để giữ nguyên khoảng trắng
    const regex = new RegExp(`(${escapedSearch})`, "gi");

    return text
      .toString()
      .split(regex)
      .map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            style={{
              backgroundColor: "#ffd591", // màu cam nhạt
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

  const handleTableChange = useCallback((newPagination) => {
    setPagination(newPagination);
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

  const downloadTemplate = useCallback(() => {
    const sampleData = [
      {
        Code: "COMP1234",
        Name: "Introduction to Programming",
        Department: "Information Technology",
        Description: "Basic programming concepts and algorithms",
      },
      {
        Code: "MATH2345",
        Name: "Advanced Mathematics",
        Department: "Mathematics",
        Description: "Advanced mathematical concepts and theories",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

    // Set độ rộng cột
    const colWidths = [
      { wch: 12 }, // Code
      { wch: 30 }, // Name
      { wch: 25 }, // Department
      { wch: 40 }, // Description
    ];
    worksheet["!cols"] = colWidths;

    XLSX.writeFile(workbook, "Courses_Template.xlsx");
  }, []);

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
          <h4>Instructions for importing courses:</h4>
          <ol>
            <li>Download the template file using the button below</li>
            <li>
              Fill in the data following these rules:
              <ul style={{ marginTop: "10px" }}>
                <li>
                  <strong>Code</strong>: Required, unique course code
                </li>
                <li>
                  <strong>Name</strong>: Required, course name
                </li>
                <li>
                  <strong>Department</strong>: Required, must match existing
                  department name
                </li>
                <li>
                  <strong>Description</strong>: Optional, course description
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
                  Code
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Name
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Department
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  COMP1234
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Introduction to Programming
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Information Technology
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Basic programming concepts and algorithms
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: "20px" }}>
          <h4>Notes:</h4>
          <ul>
            <li>Course codes must be unique</li>
            <li>Department names must match existing departments</li>
            <li>Maximum 500 records per import</li>
            <li>File size should not exceed 5MB</li>
          </ul>
        </div>
      </Modal>
    );
  }, [isImportGuideVisible, downloadTemplate]);

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

  const showImportErrors = useCallback((errors) => {
    message.error({
      content: (
        <div>
          <h4>Import errors:</h4>
          <ul style={{ maxHeight: "200px", overflowY: "auto" }}>
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      ),
      duration: 10,
    });
  }, []);

  const processImportData = useCallback(async (data) => {
    const results = {
      successCount: 0,
      errorCount: 0,
      errors: [],
    };
  
    for (const [index, row] of data.entries()) {
      try {
        // Tìm department_id dựa trên tên department
        const department = departments.find(
          dept => dept.name === row['Department']
        );
        
        if (!department) {
          throw new Error(`Department "${row['Department']}" not found`);
        }
  
        await createCourse({
          code: row['Code'],
          name: row['Name'],
          description: row['Description'] || '',
          department_id: department._id
        });
        results.successCount++;
      } catch (error) {
        results.errorCount++;
        results.errors.push({
          row: index + 2,
          code: row['Code'],
          name: row['Name'],
          error: error.response?.data?.error || error.message
        });
      }
    }
    
    return results;
  }, [departments]);

  // Sửa lại hàm validate import
  const validateImportData = useCallback(
    (data) => {
      const errors = [];

      data.forEach((row, index) => {
        const rowNumber = index + 2;

        if (!row["Code"]) {
          errors.push(`Row ${rowNumber}: Missing course code`);
        }
        if (!row["Name"]) {
          errors.push(`Row ${rowNumber}: Missing course name`);
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
          showImportErrors(validationResult.errors);
          setImportLoading(false);
          return;
        }

        const results = await processImportData(data);
        setImportResults(results);
        setImportModalVisible(true);
        message.success(
          `Imported ${results.successCount} courses successfully`
        );
        fetchCourses();
      } catch (error) {
        console.error("Import error:", error);
        message.error(`Import failed: ${error.message}`);
      } finally {
        setImportLoading(false);
      }
    },
    [
      fetchCourses,
      processImportData,
      readExcelFile,
      showImportErrors,
      validateImportData,
    ]
  );

  const showImportResults = useCallback(() => {
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
            <strong>Successful imports:</strong> {importResults?.successCount}
          </p>
          <p>
            <strong>Failed imports:</strong> {importResults?.errorCount}
          </p>

          {importResults?.errorCount > 0 && (
            <div>
              <h4>Error Details:</h4>
              <Table
                columns={[
                  { title: "Row", dataIndex: "row", key: "row" },
                  { title: "Department Name", dataIndex: "name", key: "name" },
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

  const columns = useMemo(() => {
    const baseColumns = [
      {
        title: "Code",
        dataIndex: "code",
        key: "code",
        sorter: (a, b) => a.code.localeCompare(b.code),
        render: (text) => highlightText(text, searchText),
      },
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
        sorter: (a, b) => a.name.localeCompare(b.name),
        render: (text) => highlightText(text, searchText),
      },
      {
        title: "Department",
        key: "department",
        render: (_, record) => (
          <Tag color="blue">
            {record.department_id?.name || "No Department"}
          </Tag>
        ),
        filters: departments.map((dept) => ({
          text: dept.name,
          value: dept._id,
        })),
        onFilter: (value, record) => record.department_id?._id === value,
      },
      {
        title: "Description",
        dataIndex: "description",
        key: "description",
        ellipsis: {
          showTitle: false,
        },
        render: (text) => (
          <Tooltip placement="topLeft" title={text || "-"}>
            {highlightText(text || "-", searchText)}
          </Tooltip>
        ),
      },
    ];

    if (permissions.canEdit || permissions.canDelete || permissions.canView) {
      baseColumns.push({
        title: "Actions",
        key: "actions",
        width: 120, // Thêm độ rộng cố định
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
                  navigate(`${effectiveBasePath}/course/${record._id}/edit`)
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
  }, [
    departments,
    permissions,
    effectiveBasePath,
    navigate,
    handleDelete,
    highlightText,
    searchText,
  ]);

  const filteredCourses = useMemo(() => {
    let result = [...courses];
    const search = searchText.toLowerCase();

    if (nameFilter) {
      result = result.filter((course) =>
        course.name?.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }

    if (search) {
      result = result.filter((course) => {
        return (
          course.code?.toLowerCase().includes(search) ||
          course.name?.toLowerCase().includes(search) ||
          course.description?.toLowerCase().includes(search) ||
          course.department_id?.name?.toLowerCase().includes(search)
        );
      });
    }

    return result;
  }, [courses, searchText, nameFilter]);

  // Sửa lại hàm export
  const exportToExcel = useCallback(() => {
    const dataToExport = filteredCourses.map((course) => ({
      Code: course.code || "-",
      Name: course.name || "-",
      Department: course.department_id?.name || "-",
      Description: course.description || "-"
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Courses");

    const today = new Date();
    const dateStr = `${today.getDate()}-${
      today.getMonth() + 1
    }-${today.getFullYear()}`;

    XLSX.writeFile(workbook, `Courses_${dateStr}.xlsx`);
  }, [filteredCourses]);

  const renderEmpty = useCallback(() => {
    return (
      <Empty
        description={
          <span>
            {searchText ? "No courses match your search" : "No courses found"}
          </span>
        }
      />
    );
  }, [searchText]);

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
              onClick={() => navigate(`${effectiveBasePath}/course/create`)}
            >
              Add Course
            </Button>
          )}

          {permissions.canBulkDelete && selectedRowKeys.length > 0 && (
            <Popconfirm
              title={`Are you sure you want to delete ${selectedRowKeys.length} selected courses?`}
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
            placeholder="Search courses..."
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

          {permissions.canExport && (
            <Button icon={<DownloadOutlined />} onClick={exportToExcel}>
              Export Excel
            </Button>
          )}
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredCourses}
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
            `${range[0]}-${range[1]} of ${total} courses`,
        }}
        onChange={handleTableChange}
        locale={{
          emptyText: renderEmpty(),
        }}
      />

      {importModalVisible && showImportResults()}
    </div>
  );
};

export default ListCourses;
