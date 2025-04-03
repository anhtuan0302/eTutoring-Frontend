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
  Select,
  Progress,
} from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import {
  getStudentsByClass,
  enrollStudent,
  unenrollStudent,
} from "../../../../api/education/enrollment";
import { getAllClasses } from "../../../../api/education/classInfo";
import { getAllStudents } from "../../../../api/organization/student";
import {
  SearchOutlined,
  DeleteOutlined,
  DownloadOutlined,
  UploadOutlined,
  StarOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";

const ListEnrollments = ({ basePath, customPermissions }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [allEnrollments, setAllEnrollments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [importLoading, setImportLoading] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [isImportGuideVisible, setIsImportGuideVisible] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

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
          canDelete: true,
          canImport: true,
          canExport: true,
          canBulkDelete: true,
          canReview: false,
        };
      case "student":
        return {
          canView: true,
          canCreate: false,
          canDelete: false,
          canImport: false,
          canExport: false,
          canBulkDelete: false,
          canReview: true,
        };
      default:
        return {
          canView: true,
          canCreate: false,
          canDelete: false,
          canImport: false,
          canExport: false,
          canBulkDelete: false,
          canReview: false,
        };
    }
  }, [customPermissions, user?.role]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Lấy classes
      const classesData = await getAllClasses();

      if (!Array.isArray(classesData) || classesData.length === 0) {
        setClasses([]);
        setEnrollments([]);
        return;
      }

      setClasses(classesData);

      if (selectedClass) {
        const response = await getStudentsByClass(selectedClass);
        const enrollmentsData = Array.isArray(response)
          ? response
          : response.data || [];
        setEnrollments(enrollmentsData);
        setAllEnrollments(enrollmentsData);
        setPagination((prev) => ({
          ...prev,
          total: enrollmentsData.length,
        }));
      } else {
        // Sử dụng Promise.all để xử lý song song các request
        const enrollmentPromises = classesData.map((cls) =>
          getStudentsByClass(cls._id)
        );

        const results = await Promise.all(enrollmentPromises);

        // Thu thập tất cả enrollment
        let allEnrollments = [];
        results.forEach((classEnrollments) => {
          // Xử lý cả trường hợp response trực tiếp là array hoặc response.data là array
          const enrollmentsArray = Array.isArray(classEnrollments)
            ? classEnrollments
            : classEnrollments && Array.isArray(classEnrollments.data)
            ? classEnrollments.data
            : [];

          if (enrollmentsArray.length > 0) {
            allEnrollments = [...allEnrollments, ...enrollmentsArray];
          }
        });

        // Lọc ra các enrollment có dữ liệu hợp lệ
        const validEnrollments = allEnrollments.filter(
          (enrollment) =>
            enrollment &&
            enrollment._id &&
            enrollment.student_id &&
            enrollment.classInfo_id
        );

        setEnrollments(validEnrollments);
        setAllEnrollments(validEnrollments);
        setPagination((prev) => ({
          ...prev,
          total: validEnrollments.length,
        }));
      }
    } catch (error) {
      console.error("Error in fetchData:", error);
      message.error("Failed to load data");
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  }, [selectedClass]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isUploading) {
        e.preventDefault();
        e.returnValue =
          "Data is currently being uploaded. Are you sure you want to leave the page?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isUploading]);

  // Kích hoạt fetchData khi component mount hoặc selectedClass thay đổi
  useEffect(() => {
    fetchData();
  }, [fetchData, selectedClass]);

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

  const handleDelete = useCallback(
    async (id) => {
      try {
        await unenrollStudent(id);
        message.success("Student unenrolled successfully");
        fetchData();
      } catch (error) {
        message.error(
          error.response?.data?.error || "Error unenrolling student"
        );
      }
    },
    [fetchData]
  );

  const handleClassChange = (value) => {
    setSelectedClass(value);
    setSelectedRowKeys([]);
    setPagination({
      current: 1,
      pageSize: 10,
      total: 0,
    });
  };

  const handleDeleteMultiple = useCallback(async () => {
    try {
      if (selectedRowKeys.length === 0) {
        message.warning("Please select at least one enrollment to delete");
        return;
      }

      const deletePromises = selectedRowKeys.map((id) => unenrollStudent(id));
      await Promise.all(deletePromises);

      message.success(
        `Unenrolled ${selectedRowKeys.length} students successfully`
      );
      setSelectedRowKeys([]);
      fetchData();
    } catch (error) {
      message.error(
        error.response?.data?.error || "Error unenrolling students"
      );
    }
  }, [selectedRowKeys, fetchData]);

  const downloadTemplate = useCallback(() => {
    const sampleData = [
      {
        StudentId: "STU001",
        ClassCode: "CS101-A",
      },
      {
        StudentId: "STU002",
        ClassCode: "CS101-A",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

    const colWidths = [
      { wch: 15 }, // StudentId
      { wch: 15 }, // ClassCode
    ];
    worksheet["!cols"] = colWidths;

    XLSX.writeFile(workbook, "Enrollments_Template.xlsx");
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
          <h4>Instructions for importing enrollments:</h4>
          <ol>
            <li>Download the template file using the button below</li>
            <li>
              Fill in the data following these rules:
              <ul style={{ marginTop: "10px" }}>
                <li>
                  <strong>StudentId</strong>: Required, must match existing
                  student ID code (e.g. "STU001")
                </li>
                <li>
                  <strong>ClassCode</strong>: Required, must match existing
                  class code (e.g. "CS101-A")
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
                  StudentId
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  ClassCode
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  STU001
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  CS101-A
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
      const classCodeMap = new Map(classes.map((c) => [c.code, c._id]));

      data.forEach((row, index) => {
        const rowNumber = index + 2;

        if (!row["StudentId"]) {
          errors.push(`Row ${rowNumber}: Missing student ID`);
        }
        if (!row["ClassCode"]) {
          errors.push(`Row ${rowNumber}: Missing class code`);
        } else if (!classCodeMap.has(row["ClassCode"])) {
          errors.push(
            `Row ${rowNumber}: Class code "${row["ClassCode"]}" not found`
          );
        }
      });

      return {
        hasErrors: errors.length > 0,
        errors,
      };
    },
    [classes]
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

  const handleImport = useCallback(
    async (info) => {
      const { file } = info;
      
      if (!file) {
        message.error("No file selected");
        return;
      }
      
      setImportLoading(true);
      setIsUploading(true);
      setUploadProgress(0);

      try {
        console.log("Reading file...");
        // Read and validate the Excel file
        const data = await readExcelFile(file);
        
        if (!data || data.length === 0) {
          message.error("The uploaded file contains no data");
          setImportLoading(false);
          setIsUploading(false);
          return;
        }
        
        console.log("Validating data...", data);
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
          return;
        }

        // Create class code map for lookup
        const classCodeMap = new Map(classes.map((c) => [c.code, c._id]));

        // Fetch students once instead of in each loop iteration
        console.log("Fetching students...");
        const studentsResponse = await getAllStudents();
        
        if (!studentsResponse || !studentsResponse.data) {
          throw new Error("Failed to load student data");
        }
        
        const students = Array.isArray(studentsResponse.data)
          ? studentsResponse.data
          : [];
        
        console.log(`Got ${students.length} students`);

        if (students.length === 0) {
          throw new Error("No students found in the system");
        }

        // Create student code map for lookup
        const studentCodeMap = new Map();
        students.forEach(student => {
          if (student && student.student_code) {
            studentCodeMap.set(student.student_code, student._id);
          }
        });
        
        console.log(`Created mapping for ${studentCodeMap.size} students`);

        const results = {
          successCount: 0,
          errorCount: 0,
          errors: [],
        };

        // Calculate progress step for each item
        const progressStep = 100 / data.length;

        // Process each row
        console.log("Starting to process rows...");
        for (const [index, row] of data.entries()) {
          try {
            const classCode = row["ClassCode"];
            const studentCode = row["StudentId"];
            
            console.log(`Processing row ${index + 1}: Student ${studentCode}, Class ${classCode}`);
            
            const classInfo_id = classCodeMap.get(classCode);
            if (!classInfo_id) {
              throw new Error(`Class with code ${classCode} not found`);
            }
            
            const student_id = studentCodeMap.get(studentCode);
            if (!student_id) {
              throw new Error(`Student with code ${studentCode} not found`);
            }

            console.log(`Enrolling student ${student_id} in class ${classInfo_id}`);
            
            const response = await enrollStudent({
              classInfo_id,
              student_id,
            });
            
            console.log("Enrollment response:", response);

            results.successCount++;
            setUploadProgress(Math.min(100, Math.round((index + 1) * progressStep)));
          } catch (error) {
            console.error("Error processing row:", error);
            results.errorCount++;
            results.errors.push({
              row: index + 2,
              studentId: row["StudentId"],
              classCode: row["ClassCode"],
              error: error.response?.data?.error || error.message,
            });
          }
        }

        console.log("Import completed:", results);
        setImportResults(results);
        setImportModalVisible(true);
        
        if (results.successCount > 0) {
          message.success(`Imported ${results.successCount} enrollments successfully`);
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
    [classes, fetchData, readExcelFile, validateImportData]
  );

  // Handle pagination change
  const handleTableChange = useCallback((newPagination) => {
    setPagination(newPagination);
  }, []);

  const filteredEnrollments = useMemo(() => {
    if (!enrollments) return [];

    let result = [...enrollments];
    const search = searchText.toLowerCase();

    if (search) {
      result = result.filter(
        (enrollment) =>
          enrollment.student_id?.user_id?.first_name
            ?.toLowerCase()
            .includes(search) ||
          enrollment.student_id?.user_id?.last_name
            ?.toLowerCase()
            .includes(search) ||
          enrollment.student_id?.user_id?.email?.toLowerCase().includes(search)
      );
    }

    return result;
  }, [enrollments, searchText]);

  // Apply client-side pagination
  const paginatedEnrollments = useMemo(() => {
    const { current, pageSize } = pagination;
    const startIndex = (current - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return filteredEnrollments.slice(startIndex, endIndex);
  }, [filteredEnrollments, pagination]);

  const exportToExcel = useCallback(() => {
    const dataToExport = filteredEnrollments.map((enrollment) => ({
      StudentId: enrollment.student_id?.student_code || "N/A",
      FirstName: enrollment.student_id?.user_id?.first_name || "N/A",
      LastName: enrollment.student_id?.user_id?.last_name || "N/A",
      Email: enrollment.student_id?.user_id?.email || "N/A",
      EnrollmentDate: new Date(enrollment.createdAt).toLocaleDateString(),
      Rating: enrollment.review?.rating || "Not rated",
      Comment: enrollment.review?.comment || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Enrollments");

    const today = new Date();
    const dateStr = `${today.getDate()}-${
      today.getMonth() + 1
    }-${today.getFullYear()}`;
    XLSX.writeFile(workbook, `Enrollments_${dateStr}.xlsx`);
  }, [filteredEnrollments]);

  const columns = useMemo(() => {
    const baseColumns = [
      {
        title: "Student",
        key: "student",
        render: (_, record) => {
          if (!record.student_id?.user_id) {
            return <span>Invalid student data</span>;
          }
          return (
            <Space direction="vertical" size={0}>
              <span>
                {record.student_id?.user_id?.first_name}{" "}
                {record.student_id?.user_id?.last_name}
              </span>
              <span style={{ color: "#666" }}>
                {record.student_id?.user_id?.email}
              </span>
            </Space>
          );
        },
      },
      {
        title: "Student ID",
        key: "student_code",
        render: (_, record) => <Tag>{record.student_id?.student_code}</Tag>,
      },
      {
        title: "Class",
        key: "class",
        render: (_, record) => (
          <Space direction="vertical" size={0}>
            <Tag color="blue">{record.classInfo_id?.code}</Tag>
            <span style={{ color: "#666" }}>{record.classInfo_id?.name}</span>
          </Space>
        ),
      },
      {
        title: "Enrollment Date",
        key: "createdAt",
        render: (_, record) => new Date(record.createdAt).toLocaleDateString(),
      },
      {
        title: "Rating",
        key: "rating",
        render: (_, record) =>
          record.review?.rating ? (
            <Tag color="blue">{record.review.rating} / 5</Tag>
          ) : (
            <Tag>Not rated</Tag>
          ),
      },
    ];

    if (permissions.canDelete || permissions.canReview) {
      baseColumns.push({
        title: "Actions",
        key: "actions",
        render: (_, record) => (
          <Space size="small">
            {permissions.canReview && (
              <Button
                type="primary"
                icon={<StarOutlined />}
                size="small"
                onClick={() =>
                  navigate(
                    `${effectiveBasePath}/enrollment/${record._id}/review`
                  )
                }
              />
            )}
            {permissions.canDelete && (
              <Popconfirm
                title="Are you sure you want to unenroll this student?"
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
  }, [permissions, effectiveBasePath, navigate, handleDelete]);

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
          <Select
            style={{ width: 200 }}
            placeholder="Select a class"
            onChange={handleClassChange}
            value={selectedClass}
            allowClear
            options={[
              { value: "", label: "All Classes" },
              ...(classes || []).map((c) => ({
                value: c._id,
                label: `${c.code} - ${c.name}`,
              })),
            ]}
          />

          {permissions.canCreate && (
            <Button
              type="primary"
              onClick={() => navigate(`${effectiveBasePath}/enrollment/create`)}
            >
              Add Enrollment
            </Button>
          )}

          {permissions.canBulkDelete && selectedRowKeys.length > 0 && (
            <Popconfirm
              title={`Are you sure you want to unenroll ${selectedRowKeys.length} selected students?`}
              onConfirm={handleDeleteMultiple}
              okText="Yes"
              cancelText="No"
            >
              <Button type="primary" danger icon={<DeleteOutlined />}>
                Unenroll Selected ({selectedRowKeys.length})
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
            onChange={(e) => {
              setSearchText(e.target.value);
              setPagination({
                ...pagination,
                current: 1 // Reset to first page on search
              });
            }}
            allowClear
          />

          {permissions.canImport && (
            <>
              <Button
                icon={<UploadOutlined />}
                onClick={() => setIsImportGuideVisible(true)}
                loading={importLoading}
              >
                Import Excel
              </Button>
              <Upload
                id="upload-input"
                accept=".xlsx, .xls"
                beforeUpload={() => false}
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
              icon={<DownloadOutlined />} 
              onClick={exportToExcel}
              disabled={filteredEnrollments.length === 0}
            >
              Export Excel
            </Button>
          )}
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredEnrollments}
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
          total: filteredEnrollments.length,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} enrollments`,
        }}
        onChange={handleTableChange}
        locale={{
          emptyText: (
            <Empty
              description={
                <span>
                  {searchText
                    ? "No enrollments match your search"
                    : "No enrollments found"}
                </span>
              }
            />
          ),
        }}
      />
      
      <UploadProgressModal />
      <ImportGuideModal />
      
      {importModalVisible && (
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
                    {
                      title: "Student ID",
                      dataIndex: "studentId",
                      key: "studentId",
                    },
                    {
                      title: "Class Code",
                      dataIndex: "classCode",
                      key: "classCode",
                    },
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
      )}
    </div>
  );
};

export default ListEnrollments;