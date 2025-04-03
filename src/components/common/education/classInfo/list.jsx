import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  message,
  Input,
  Empty,
  Select,
  Upload,
  Modal,
  Popconfirm,
  Tooltip,
  Progress,
} from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import {
  getAllClasses,
  deleteClass,
  createClass,
} from "../../../../api/education/classInfo";
import { getAllCourses } from "../../../../api/education/course";
import { getAllDepartments } from "../../../../api/organization/department";
import {
  DeleteOutlined,
  DownloadOutlined,
  UploadOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";

const ListClasses = ({ basePath, customPermissions }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

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

  // States
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [isImportGuideVisible, setIsImportGuideVisible] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [classesResponse, coursesResponse, departmentsResponse] =
        await Promise.all([
          getAllClasses(),
          getAllCourses(),
          getAllDepartments(),
        ]);

      if (Array.isArray(classesResponse)) {
        setClasses(classesResponse);
        if (classesResponse.length > 0) {
          const availableYears = [
            ...new Set(
              classesResponse
                .filter((c) => c.start_date)
                .map((c) => new Date(c.start_date).getFullYear())
            ),
          ].sort();
          if (availableYears.length > 0) {
            setSelectedYear(availableYears[0]);
          }
        }
      }

      if (Array.isArray(coursesResponse)) {
        setCourses(coursesResponse);
      }

      if (Array.isArray(departmentsResponse)) {
        setDepartments(departmentsResponse);
      }
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

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isUploading) {
        e.preventDefault();
        e.returnValue =
          "Data is being uploaded. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isUploading]);

  // Get available years
  const years = useMemo(() => {
    if (!Array.isArray(classes) || classes.length === 0) return [];
    const yearsSet = new Set();
    classes.forEach((classInfo) => {
      if (classInfo?.start_date) {
        try {
          const year = new Date(classInfo.start_date).getFullYear();
          if (!isNaN(year)) {
            yearsSet.add(year);
          }
        } catch (error) {
          console.error("Error processing date:", classInfo.start_date);
        }
      }
    });
    return Array.from(yearsSet)
      .sort()
      .map((year) => ({
        label: year.toString(),
        value: year,
      }));
  }, [classes]);

  // Handle delete
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

  // Handle bulk delete
  const handleDeleteMultiple = useCallback(async () => {
    try {
      await Promise.all(selectedRowKeys.map((id) => deleteClass(id)));
      message.success(`Deleted ${selectedRowKeys.length} classes successfully`);
      setSelectedRowKeys([]);
      fetchData();
    } catch (error) {
      message.error("Error deleting classes");
    }
  }, [selectedRowKeys, fetchData]);

  // Filter classes
  const filteredClasses = useMemo(() => {
    let result = [...classes];

    if (selectedYear && selectedPeriod) {
      result = result.filter((classInfo) => {
        if (!classInfo?.start_date || !classInfo?.end_date) return false;
        const startDate = new Date(classInfo.start_date);
        const endDate = new Date(classInfo.end_date);
        const periodStartDate = new Date(
          selectedYear,
          selectedPeriod === "1" ? 0 : 6,
          1
        );
        const periodEndDate = new Date(
          selectedYear,
          selectedPeriod === "1" ? 5 : 11,
          31
        );
        return startDate <= periodEndDate && endDate >= periodStartDate;
      });
    }

    if (selectedDepartment) {
      result = result.filter(
        (classInfo) =>
          classInfo.course_id?.department_id?._id === selectedDepartment
      );
    }

    if (selectedCourse) {
      result = result.filter(
        (classInfo) => classInfo.course_id?._id === selectedCourse
      );
    }

    return result;
  }, [
    classes,
    selectedYear,
    selectedPeriod,
    selectedDepartment,
    selectedCourse,
  ]);

  // Export to Excel
  const exportToExcel = useCallback(() => {
    const dataToExport = filteredClasses.map((classInfo) => ({
      "Class Code": classInfo.code,
      "Course Code": classInfo.course_id?.code || "N/A",
      "Course Name": classInfo.course_id?.name || "N/A",
      Department: classInfo.course_id?.department_id?.name || "N/A",
      "Max Students": classInfo.max_students,
      "Current Students": classInfo.current_students || 0,
      "Current Tutors": classInfo.current_tutors || 0,
      Status: classInfo.status,
      "Start Date": classInfo.start_date
        ? new Date(classInfo.start_date).toLocaleDateString()
        : "N/A",
      "End Date": classInfo.end_date
        ? new Date(classInfo.end_date).toLocaleDateString()
        : "N/A",
      "Primary Tutor":
        classInfo.tutors?.find((t) => t.is_primary)?.tutor_id.user_id
          .first_name +
          " " +
          classInfo.tutors?.find((t) => t.is_primary)?.tutor_id.user_id
            .last_name || "N/A",
      "Other Tutors":
        classInfo.tutors
          ?.filter((t) => !t.is_primary)
          .map(
            (t) =>
              `${t.tutor_id.user_id.first_name} ${t.tutor_id.user_id.last_name}`
          )
          .join(", ") || "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Classes");

    // Set column widths
    worksheet["!cols"] = [
      { wch: 15 }, // Class Code
      { wch: 15 }, // Course Code
      { wch: 30 }, // Course Name
      { wch: 25 }, // Department
      { wch: 15 }, // Max Students
      { wch: 15 }, // Current Students
      { wch: 12 }, // Status
      { wch: 15 }, // Start Date
      { wch: 15 }, // End Date
      { wch: 25 }, // Primary Tutor
      { wch: 40 }, // Other Tutors
    ];

    const today = new Date();
    const dateStr = `${today.getDate()}-${
      today.getMonth() + 1
    }-${today.getFullYear()}`;
    XLSX.writeFile(workbook, `Classes_${dateStr}.xlsx`);
  }, [filteredClasses]);

  // Import handling
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
      const codeSet = new Set(classes.map((c) => c.code.toLowerCase()));

      data.forEach((row, index) => {
        const rowNumber = index + 2;

        if (!row["Class Code"]) {
          errors.push(`Row ${rowNumber}: Missing class code`);
        }
        if (!row["Course Code"]) {
          errors.push(`Row ${rowNumber}: Missing course code`);
        }
        if (row["Class Code"] && codeSet.has(row["Class Code"].toLowerCase())) {
          errors.push(`Row ${rowNumber}: Class code already exists`);
        }
        if (row["Max Students"] && isNaN(row["Max Students"])) {
          errors.push(`Row ${rowNumber}: Invalid max students number`);
        }
        if (!row["Start Date"] || !isValidDate(row["Start Date"])) {
          errors.push(`Row ${rowNumber}: Invalid start date`);
        }
        if (!row["End Date"] || !isValidDate(row["End Date"])) {
          errors.push(`Row ${rowNumber}: Invalid end date`);
        }
      });

      return {
        hasErrors: errors.length > 0,
        errors,
      };
    },
    [classes]
  );

  const isValidDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };

  const processImportData = useCallback(
    async (data) => {
      const results = {
        successCount: 0,
        errorCount: 0,
        errors: [],
      };

      for (const [index, row] of data.entries()) {
        try {
          const course = courses.find((c) => c.code === row["Course Code"]);
          if (!course) {
            throw new Error(`Course code ${row["Course Code"]} not found`);
          }

          await createClass({
            code: row["Class Code"],
            course_id: course._id,
            max_students: parseInt(row["Max Students"]),
            start_date: new Date(row["Start Date"]),
            end_date: new Date(row["End Date"]),
            status: row["Status"] || "open",
          });

          results.successCount++;
        } catch (error) {
          results.errorCount++;
          results.errors.push({
            row: index + 2,
            code: row["Class Code"],
            error: error.message,
          });
        }
      }

      return results;
    },
    [courses]
  );

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
          message.error({
            content: (
              <div>
                <h4>Import validation errors:</h4>
                <ul>
                  {validationResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            ),
            duration: 10,
          });
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
            const course = courses.find((c) => c.code === row["Course Code"]);
            if (!course) {
              throw new Error(`Course code ${row["Course Code"]} not found`);
            }

            await createClass({
              code: row["Class Code"],
              course_id: course._id,
              max_students: parseInt(row["Max Students"]),
              start_date: new Date(row["Start Date"]),
              end_date: new Date(row["End Date"]),
            });

            results.successCount++;
            // Cập nhật progress
            setUploadProgress(Math.min(100, (index + 1) * progressStep));
          } catch (error) {
            results.errorCount++;
            results.errors.push({
              row: index + 2,
              code: row["Class Code"],
              error: error.message,
            });
          }
        }

        setImportResults(results);
        setImportModalVisible(true);

        if (results.successCount > 0) {
          message.success(
            `Imported ${results.successCount} classes successfully`
          );
          fetchData();
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
    [fetchData, processImportData, readExcelFile, validateImportData, courses]
  );

  const downloadTemplate = useCallback(() => {
    const sampleData = [
      {
        "Class Code": "CS101",
        "Course Code": "PRF192",
        "Max Students": 30,
        "Start Date": "2024-01-01",
        "End Date": "2024-06-30",
      },
      {
        "Class Code": "CS102",
        "Course Code": "CSD201",
        "Max Students": 25,
        "Start Date": "2024-07-01",
        "End Date": "2024-12-31",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

    worksheet["!cols"] = [
      { wch: 15 }, // Class Code
      { wch: 15 }, // Course Code
      { wch: 15 }, // Max Students
      { wch: 15 }, // Start Date
      { wch: 15 }, // End Date
    ];

    XLSX.writeFile(workbook, "Classes_Template.xlsx");
  }, []);

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

  // Modals
  const ImportGuideModal = useCallback(
    () => (
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
                  <strong>Class Code</strong>: Required, must be unique
                </li>
                <li>
                  <strong>Course Code</strong>: Required, must be an existing
                  course code
                </li>
                <li>
                  <strong>Max Students</strong>: Required, must be a number
                </li>
                <li>
                  <strong>Start Date</strong>: Required, format: YYYY-MM-DD
                </li>
                <li>
                  <strong>End Date</strong>: Required, format: YYYY-MM-DD
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
          <h4>Sample Data:</h4>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {[
                  "Class Code",
                  "Course Code",
                  "Max Students",
                  "Start Date",
                  "End Date",
                ].map((header) => (
                  <th
                    key={header}
                    style={{ border: "1px solid #ddd", padding: "8px" }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  CS101
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  PRF192
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>30</td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  2024-01-01
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  2024-06-30
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Modal>
    ),
    [isImportGuideVisible, downloadTemplate]
  );

  const ImportResultsModal = useCallback(
    () => (
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
    ),
    [importModalVisible, importResults]
  );

  // Table columns
  const columns = useMemo(() => {
    const baseColumns = [
      {
        title: "Class Code",
        dataIndex: "code",
        key: "code",
        render: (text) => `${text}`,
      },
      {
        title: "Course",
        key: "course",
        render: (_, record) => `${record.course_id?.code || "N/A"} - ${record.course_id?.name || "N/A"}`,
      },
      {
        title: "Students",
        key: "students",
        render: (_, record) => (
          <Tag
            color={
              record.current_students >= record.max_students ? "red" : "green"
            }
          >
            {record.current_students || 0} / {record.max_students || "N/A"}
          </Tag>
        ),
      },
      {
        title: "Tutors",
        key: "tutors",
        render: (_, record) => `${record.current_tutors || 0} (P: ${record.current_primary_tutors || 0}, A: ${record.current_tutors - record.current_primary_tutors || 0})`,
      },
      {
        title: "Period",
        key: "period",
        render: (_, record) => (
          <>
            <div>
              Start:{" "}
              {record.start_date
                ? new Date(record.start_date).toLocaleDateString()
                : "N/A"}
            </div>
            <div>
              End:{" "}
              {record.end_date
                ? new Date(record.end_date).toLocaleDateString()
                : "N/A"}
            </div>
          </>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status) => (
          <Tag
            color={
              status === "open" ? "green" : status === "closed" ? "red" : "blue"
            }
          >
            {status?.toUpperCase() || "N/A"}
          </Tag>
        ),
      },
    ];

    if (permissions.canEdit || permissions.canView || permissions.canDelete) {
      baseColumns.push({
        title: "Actions",
        key: "actions",
        width: 120,
        render: (_, record) => (
          <Space size="small">
            {permissions.canView && (
              <Tooltip title="View">
                <Button
                  type="default"
                  icon={<EyeOutlined />}
                  size="small"
                  onClick={() =>
                    navigate(`${effectiveBasePath}/classInfo/${record._id}`)
                  }
                />
              </Tooltip>
            )}
            {permissions.canEdit && (
              <Tooltip title="Edit">
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  size="small"
                  style={{ backgroundColor: "#faad14" }}
                  onClick={() =>
                    navigate(
                      `${effectiveBasePath}/classInfo/${record._id}/edit`
                    )
                  }
                />
              </Tooltip>
            )}
            {permissions.canDelete && (
              <Tooltip title="Delete">
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
              </Tooltip>
            )}
          </Space>
        ),
      });
    }

    return baseColumns;
  }, [effectiveBasePath, navigate, permissions, handleDelete]);

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
              icon={<PlusOutlined />}
              onClick={() => navigate(`${effectiveBasePath}/classInfo/create`)}
            >
              Add Class
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
          <Select
            placeholder="Year"
            style={{ width: 80 }}
            value={selectedYear}
            onChange={setSelectedYear}
            allowClear
            options={years}
          />

          <Select
            placeholder="Period"
            style={{ width: 120 }}
            value={selectedPeriod}
            onChange={setSelectedPeriod}
            allowClear
            options={[
              { label: "Jan - Jun", value: "1" },
              { label: "Jul - Dec", value: "2" },
            ]}
          />

          <Select
            placeholder="Department"
            style={{ width: 150 }}
            value={selectedDepartment}
            onChange={setSelectedDepartment}
            allowClear
            options={departments.map((dept) => ({
              label: dept.name || "N/A",
              value: dept._id,
            }))}
          />

          <Select
            placeholder="Course"
            style={{ width: 150 }}
            value={selectedCourse}
            onChange={setSelectedCourse}
            allowClear
            options={courses.map((course) => ({
              label: `${course.code || "N/A"} - ${course.name || "N/A"}`,
              value: course._id,
            }))}
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
        dataSource={filteredClasses}
        rowKey="_id"
        loading={loading}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} classes`,
        }}
        rowSelection={
          permissions.canBulkDelete
            ? {
                type: "checkbox",
                selectedRowKeys,
                onChange: setSelectedRowKeys,
              }
            : null
        }
        locale={{
          emptyText: (
            <Empty
              description="No classes available"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ),
        }}
      />
      <ImportGuideModal />
      <UploadProgressModal />
      <ImportResultsModal />
    </div>
  );
};

export default ListClasses;
