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
} from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import {
  getStudentsByClass,
  enrollStudent,
  unenrollStudent,
} from "../../../../api/education/enrollment";
import { getAllClasses } from "../../../../api/education/classInfo";
import {
  SearchOutlined,
  DeleteOutlined,
  DownloadOutlined,
  UploadOutlined,
  EyeOutlined,
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
        console.log("Starting fetchData in ListEnrollments");
  
        // Lấy classes
        const classesData = await getAllClasses();
        console.log("Raw classes data:", classesData);
  
        if (!Array.isArray(classesData) || classesData.length === 0) {
            console.log("No classes found or invalid data");
            setClasses([]);
            setEnrollments([]);
            return;
        }
  
        setClasses(classesData);
  
        if (selectedClass) {
            console.log("Fetching enrollments for selected class:", selectedClass);
            const response = await getStudentsByClass(selectedClass);
            const enrollmentsData = Array.isArray(response) ? response : response.data || [];
            console.log("Enrollments for selected class:", enrollmentsData);
            setEnrollments(enrollmentsData);
            setPagination((prev) => ({
                ...prev,
                total: enrollmentsData.length,
            }));
        } else {
            console.log("Fetching enrollments for all classes");
            
            // Sử dụng Promise.all để xử lý song song các request
            const enrollmentPromises = classesData.map(cls => 
                getStudentsByClass(cls._id)
            );
  
            const results = await Promise.all(enrollmentPromises);
            console.log("Raw enrollment results:", results);
            
            // Thu thập tất cả enrollment
            let allEnrollments = [];
            results.forEach(classEnrollments => {
                // Xử lý cả trường hợp response trực tiếp là array hoặc response.data là array
                const enrollmentsArray = Array.isArray(classEnrollments) ? 
                    classEnrollments : 
                    (classEnrollments && Array.isArray(classEnrollments.data) ? classEnrollments.data : []);
                
                if (enrollmentsArray.length > 0) {
                    allEnrollments = [...allEnrollments, ...enrollmentsArray];
                }
            });
            
            console.log("All enrollments collected:", allEnrollments);
  
            // Lọc ra các enrollment có dữ liệu hợp lệ
            const validEnrollments = allEnrollments.filter(
                (enrollment) =>
                    enrollment &&
                    enrollment._id &&
                    enrollment.student_id &&
                    enrollment.classInfo_id
            );
  
            console.log("Valid enrollments:", validEnrollments);
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

  // Thêm useEffect để theo dõi classes state
  useEffect(() => {
    console.log("Classes state updated:", classes);
  }, [classes]);

  // Thêm effect để debug
  useEffect(() => {
    console.log("Current enrollments state:", enrollments);
  }, [enrollments]);

  // Kích hoạt fetchData khi component mount hoặc selectedClass thay đổi
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData]);

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
                  student ID
                </li>
                <li>
                  <strong>ClassCode</strong>: Required, must match existing
                  class code
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

  const processImportData = useCallback(
    async (data) => {
      const results = {
        successCount: 0,
        errorCount: 0,
        errors: [],
      };

      const classCodeMap = new Map(classes.map((c) => [c.code, c._id]));

      for (const [index, row] of data.entries()) {
        try {
          const classInfo_id = classCodeMap.get(row["ClassCode"]);

          await enrollStudent({
            classInfo_id,
            student_id: row["StudentId"],
          });

          results.successCount++;
        } catch (error) {
          results.errorCount++;
          results.errors.push({
            row: index + 2,
            studentId: row["StudentId"],
            classCode: row["ClassCode"],
            error: error.response?.data?.error || error.message,
          });
        }
      }

      return results;
    },
    [classes]
  );

  // Các hàm xử lý import/export giữ nguyên như classInfo
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
      setImportLoading(true);

      try {
        const data = await readExcelFile(file);
        const validationResult = validateImportData(data);

        if (validationResult.hasErrors) {
          message.error({
            content: (
              <div>
                <h4>Import errors:</h4>
                <ul>
                  {validationResult.errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            ),
            duration: 10,
          });
          return;
        }

        const results = await processImportData(data);
        setImportResults(results);
        setImportModalVisible(true);
        message.success(
          `Imported ${results.successCount} enrollments successfully`
        );
        fetchData();
      } catch (error) {
        console.error("Import error:", error);
        message.error(`Import failed: ${error.message}`);
      } finally {
        setImportLoading(false);
      }
    },
    [fetchData, processImportData, readExcelFile, validateImportData]
  );

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
          console.log("Rendering student record:", record);
          if (!record.student_id?.user_id) {
            console.warn("Missing student data:", record);
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
            <Button icon={<DownloadOutlined />} onClick={exportToExcel}>
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
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} enrollments`,
        }}
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
