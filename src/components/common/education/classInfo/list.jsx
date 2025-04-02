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
  Select,
} from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import {
  getAllClasses,
  deleteClass,
  createClass,
} from "../../../../api/education/classInfo";
import { getAllCourses } from "../../../../api/education/course";
import {
  SearchOutlined,
  DeleteOutlined,
  DownloadOutlined,
  UploadOutlined,
  EditOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";

const ListClasses = ({ basePath, customPermissions }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
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
  const [isImportGuideVisible, setIsImportGuideVisible] = useState(false);

  // Xác định basePath dựa theo role
  const effectiveBasePath = useMemo(() => {
    if (basePath) return basePath;

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
    if (customPermissions) return customPermissions;

    switch (user?.role) {
      case "admin":
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

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [classesData, coursesData] = await Promise.all([
        getAllClasses(),
        getAllCourses(),
      ]);
      setClasses(classesData);
      setCourses(coursesData);
      setPagination((prev) => ({
        ...prev,
        total: classesData.length,
      }));
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteClass(id);
        message.success("Class deleted successfully");
        fetchData();
      } catch (error) {
        message.error(error.response?.data?.error || "Error deleting class");
      }
    },
    [fetchData]
  );

  const handleDeleteMultiple = useCallback(async () => {
    try {
      if (selectedRowKeys.length === 0) {
        message.warning("Please select at least one class to delete");
        return;
      }

      const deletePromises = selectedRowKeys.map((id) => deleteClass(id));
      await Promise.all(deletePromises);

      message.success(`Deleted ${selectedRowKeys.length} classes successfully`);
      setSelectedRowKeys([]);
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.error || "Error deleting classes");
    }
  }, [selectedRowKeys, fetchData]);

  const downloadTemplate = useCallback(() => {
    const sampleData = [
      {
        Code: "CS101-A",
        Name: "Introduction to Programming - Group A",
        Course: "CS101",
        MaxStudents: "30",
        Status: "open",
        StartDate: "2024-01-15",
        EndDate: "2024-05-15",
      },
      {
        Code: "CS101-B",
        Name: "Introduction to Programming - Group B",
        Course: "CS101",
        MaxStudents: "30",
        Status: "open",
        StartDate: "2024-01-15",
        EndDate: "2024-05-15",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

    // Set độ rộng cột
    const colWidths = [
      { wch: 15 }, // Code
      { wch: 30 }, // Name
      { wch: 15 }, // Course
      { wch: 12 }, // MaxStudents
      { wch: 10 }, // Status
      { wch: 12 }, // StartDate
      { wch: 12 }, // EndDate
    ];
    worksheet["!cols"] = colWidths;

    XLSX.writeFile(workbook, "Classes_Template.xlsx");
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
          <h4>Instructions for importing classes:</h4>
          <ol>
            <li>Download the template file using the button below</li>
            <li>
              Fill in the data following these rules:
              <ul style={{ marginTop: "10px" }}>
                <li>
                  <strong>Code</strong>: Required, unique class code
                </li>
                <li>
                  <strong>Name</strong>: Required, class name
                </li>
                <li>
                  <strong>Course</strong>: Required, must match existing course
                  code
                </li>
                <li>
                  <strong>MaxStudents</strong>: Optional, must be a positive
                  number
                </li>
                <li>
                  <strong>Status</strong>: Optional (open/closed/in progress)
                </li>
                <li>
                  <strong>StartDate</strong>: Optional (YYYY-MM-DD format)
                </li>
                <li>
                  <strong>EndDate</strong>: Optional (YYYY-MM-DD format)
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
                  Course
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Other Fields
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  CS101-A
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Programming - Group A
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  CS101
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  ...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Modal>
    );
  }, [isImportGuideVisible, downloadTemplate]);

  const validateImportData = useCallback(
    (data) => {
      const errors = [];
      const courseCodeMap = new Map(
        courses.map((course) => [course.code, course._id])
      );

      data.forEach((row, index) => {
        const rowNumber = index + 2;

        if (!row["Code"]) {
          errors.push(`Row ${rowNumber}: Missing class code`);
        }
        if (!row["Name"]) {
          errors.push(`Row ${rowNumber}: Missing class name`);
        }
        if (!row["Course"]) {
          errors.push(`Row ${rowNumber}: Missing course code`);
        } else if (!courseCodeMap.has(row["Course"])) {
          errors.push(
            `Row ${rowNumber}: Course code "${row["Course"]}" not found`
          );
        }
        if (
          row["Status"] &&
          !["open", "closed", "in progress"].includes(row["Status"])
        ) {
          errors.push(`Row ${rowNumber}: Invalid status value`);
        }
      });

      return {
        hasErrors: errors.length > 0,
        errors,
      };
    },
    [courses]
  );

  const processImportData = useCallback(
    async (data) => {
      const results = {
        successCount: 0,
        errorCount: 0,
        errors: [],
      };

      const courseCodeMap = new Map(
        courses.map((course) => [course.code, course._id])
      );

      for (const [index, row] of data.entries()) {
        try {
          const courseId = courseCodeMap.get(row["Course"]);

          await createClass({
            code: row["Code"],
            name: row["Name"],
            course_id: courseId,
            max_students: row["MaxStudents"]
              ? parseInt(row["MaxStudents"])
              : undefined,
            status: row["Status"] || "open",
            start_date: row["StartDate"],
            end_date: row["EndDate"],
          });

          results.successCount++;
        } catch (error) {
          results.errorCount++;
          results.errors.push({
            row: index + 2,
            code: row["Code"],
            error: error.response?.data?.error || error.message,
          });
        }
      }

      return results;
    },
    [courses]
  );

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
          `Imported ${results.successCount} classes successfully`
        );
        fetchData();
      } catch (error) {
        console.error("Import error:", error);
        message.error(`Import failed: ${error.message}`);
      } finally {
        setImportLoading(false);
      }
    },
    [
      fetchData,
      processImportData,
      readExcelFile,
      showImportErrors,
      validateImportData,
    ]
  );

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

  const filteredClasses = useMemo(() => {
    let result = [...classes];
    const search = searchText.toLowerCase();

    if (search) {
      result = result.filter(
        (classInfo) =>
          classInfo.code?.toLowerCase().includes(search) ||
          classInfo.name?.toLowerCase().includes(search) ||
          classInfo.course_id?.name?.toLowerCase().includes(search)
      );
    }

    return result;
  }, [classes, searchText]);

  const exportToExcel = useCallback(() => {
    const dataToExport = filteredClasses.map((classInfo) => ({
      Code: classInfo.code,
      Name: classInfo.name,
      Course: classInfo.course_id?.code,
      CourseName: classInfo.course_id?.name,
      MaxStudents: classInfo.max_students || "",
      Status: classInfo.status,
      StartDate: classInfo.start_date
        ? new Date(classInfo.start_date).toLocaleDateString()
        : "",
      EndDate: classInfo.end_date
        ? new Date(classInfo.end_date).toLocaleDateString()
        : "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Classes");

    const today = new Date();
    const dateStr = `${today.getDate()}-${
      today.getMonth() + 1
    }-${today.getFullYear()}`;

    XLSX.writeFile(workbook, `Classes_${dateStr}.xlsx`);
  }, [filteredClasses]);

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
                  { title: "Class Code", dataIndex: "code", key: "code" },
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

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case "open":
        return "green";
      case "closed":
        return "red";
      case "in progress":
        return "blue";
      default:
        return "default";
    }
  }, []);

  const columns = useMemo(() => {
    const baseColumns = [
      {
        title: "Code",
        dataIndex: "code",
        key: "code",
        render: (text) => <Tag>{text}</Tag>,
        sorter: (a, b) => a.code.localeCompare(b.code),
      },
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
        sorter: (a, b) => a.name.localeCompare(b.name),
      },
      {
        title: "Course",
        key: "course",
        render: (_, record) => (
          <Tag color="purple">{record.course_id?.name || "N/A"}</Tag>
        ),
        filters: courses.map((course) => ({
          text: course.name,
          value: course._id,
        })),
        onFilter: (value, record) => record.course_id?._id === value,
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status) => (
          <Tag color={getStatusColor(status)}>
            {status?.toUpperCase() || "N/A"}
          </Tag>
        ),
        filters: [
          { text: "Open", value: "open" },
          { text: "Closed", value: "closed" },
          { text: "In Progress", value: "in progress" },
        ],
        onFilter: (value, record) => record.status === value,
      },
      {
        title: "Max Students",
        dataIndex: "max_students",
        key: "max_students",
      },
    ];

    if (permissions.canEdit || permissions.canDelete || permissions.canView) {
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
                  navigate(`${effectiveBasePath}/classInfo/${record._id}`)
                }
              />
            )}
            {permissions.canEdit && (
              <Button
                type="primary"
                icon={<EditOutlined />}
                size="small"
                style={{ backgroundColor: "#faad14" }}
                onClick={() =>
                  navigate(`${effectiveBasePath}/classInfo/${record._id}/edit`)
                }
              />
            )}
            {permissions.canDelete && (
              <Popconfirm
                title="Are you sure you want to delete this class?"
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
    courses,
    permissions,
    effectiveBasePath,
    navigate,
    handleDelete,
    getStatusColor,
  ]);

  const renderEmpty = useCallback(() => {
    return (
      <Empty
        description={
          <span>
            {searchText ? "No classes match your search" : "No classes found"}
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
              onClick={() => navigate(`${effectiveBasePath}/classInfo/create`)}
            >
              Add New Class
            </Button>
          )}

          {permissions.canBulkDelete && selectedRowKeys.length > 0 && (
            <Popconfirm
              title={`Are you sure you want to delete ${selectedRowKeys.length} selected classes?`}
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
            placeholder="Search classes..."
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

          {permissions.canExport && (
            <Button icon={<DownloadOutlined />} onClick={exportToExcel}>
              Export Excel
            </Button>
          )}
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredClasses}
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
            `${range[0]}-${range[1]} of ${total} classes`,
        }}
        locale={{
          emptyText: renderEmpty(),
        }}
      />

      <ImportGuideModal />
      {importModalVisible && showImportResults()}
    </div>
  );
};

export default ListClasses;
