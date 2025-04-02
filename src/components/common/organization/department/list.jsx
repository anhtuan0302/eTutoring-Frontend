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
  getAllDepartments,
  deleteDepartment,
  createDepartment,
} from "../../../../api/organization/department";
import {
  SearchOutlined,
  DeleteOutlined,
  DownloadOutlined,
  UploadOutlined,
  EditOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";

const ListDepartments = ({
  basePath, // path prefix sẽ được tự động xác định dựa vào role nếu không được cung cấp
  customPermissions, // optional - ghi đè permissions từ role
}) => {
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

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllDepartments();
      setDepartments(data); // Sửa từ activeDepartments thành data
      setPagination((prev) => ({
        ...prev,
        total: data.length, // Sửa từ activeDepartments.length thành data.length
      }));
    } catch (error) {
      console.error("Error fetching departments:", error);
      message.error("Failed to load department list");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteDepartment(id);

        const updatedDepartments = departments.filter((dep) => dep._id !== id);
        setDepartments(updatedDepartments);
        setSelectedRowKeys((prev) => prev.filter((key) => key !== id));
        setPagination((prev) => ({
          ...prev,
          total: updatedDepartments.length,
        }));

        message.success("Department deleted successfully");
      } catch (error) {
        message.error(
          error.response?.data?.error || "Error deleting department"
        );
        console.error("Error details:", error);
      }
    },
    [departments]
  );

  const handleDeleteMultiple = useCallback(async () => {
    try {
      if (selectedRowKeys.length === 0) {
        message.warning("Please select at least one department to delete");
        return;
      }

      const deletePromises = selectedRowKeys.map((id) => deleteDepartment(id));
      await Promise.all(deletePromises);

      const updatedDepartments = departments.filter(
        (dep) => !selectedRowKeys.includes(dep._id)
      );
      setDepartments(updatedDepartments);
      setSelectedRowKeys([]);
      setPagination((prev) => ({
        ...prev,
        total: updatedDepartments.length,
      }));

      message.success(
        `Deleted ${selectedRowKeys.length} departments successfully`
      );
    } catch (error) {
      message.error(
        error.response?.data?.error || "Error deleting departments"
      );
      console.error("Error details:", error);
    }
  }, [departments, selectedRowKeys]);

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

  const filteredDepartments = useMemo(() => {
    let result = [...departments];
    const search = searchText.toLowerCase();

    // Apply name filter if exists
    if (nameFilter) {
      result = result.filter((department) =>
        department.name?.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }

    // Apply search text filter
    if (search) {
      result = result.filter((department) => {
        const name = department.name ? department.name.toLowerCase() : "";
        const description = department.description
          ? department.description.toLowerCase()
          : "";
        return name.includes(search) || description.includes(search);
      });
    }

    return result;
  }, [departments, searchText, nameFilter]);

  const handleTableChange = useCallback((newPagination) => {
    setPagination(newPagination);
  }, []);

  const exportToExcel = useCallback(() => {
    const dataToExport = filteredDepartments.map((department) => ({
      Name: department.name || "-",
      Description: department.description || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Departments");

    const today = new Date();
    const dateStr = `${today.getDate()}-${
      today.getMonth() + 1
    }-${today.getFullYear()}`;

    XLSX.writeFile(workbook, `Departments_${dateStr}.xlsx`);
  }, [filteredDepartments]);

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
        Name: "Information Technology",
        Description: "Department for IT and Computer Science",
      },
      {
        Name: "Business Administration",
        Description: "Department for Business and Management Studies",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

    // Set độ rộng cột
    const colWidths = [
      { wch: 25 }, // Name
      { wch: 40 }, // Description
    ];
    worksheet["!cols"] = colWidths;

    XLSX.writeFile(workbook, "Departments_Template.xlsx");
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
          <h4>Instructions for importing departments:</h4>
          <ol>
            <li>Download the template file using the button below</li>
            <li>
              Fill in the data following these rules:
              <ul style={{ marginTop: "10px" }}>
                <li>
                  <strong>Name</strong>: Required, must be unique
                </li>
                <li>
                  <strong>Description</strong>: Optional, text description
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
                  Name
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Information Technology
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Department for IT and Computer Science
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: "20px" }}>
          <h4>Notes:</h4>
          <ul>
            <li>Department names must be unique</li>
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

  const validateImportData = useCallback(
    (data) => {
      const errors = [];
      const nameSet = new Set(departments.map((d) => d.name.toLowerCase()));

      data.forEach((row, index) => {
        const rowNumber = index + 2;

        if (!row["Name"] && !row["Department Name"]) {
          errors.push(`Row ${rowNumber}: Missing department name`);
        }
      });

      return {
        hasErrors: errors.length > 0,
        errors,
      };
    },
    [departments]
  );

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
        await createDepartment({
          name: row["Name"] || row["Department Name"],
          description: row["Description"] || "",
        });
        results.successCount++;
      } catch (error) {
        results.errorCount++;
        results.errors.push({
          row: index + 2,
          name: row["Name"] || row["Department Name"],
          error: error.response?.data?.error || error.message,
        });
      }
    }

    return results;
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
          `Imported ${results.successCount} departments successfully`
        );
        fetchDepartments();
      } catch (error) {
        console.error("Import error:", error);
        message.error(`Import failed: ${error.message}`);
      } finally {
        setImportLoading(false);
      }
    },
    [
      fetchDepartments,
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

  // Table columns
  const columns = useMemo(() => {
    const baseColumns = [
      {
        title: "Name",
        key: "name",
        render: (_, record) => (
          <Tag color="blue">{highlightText(record.name, searchText)}</Tag>
        ),
        sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
        filters: departments.map((dept) => ({
          text: dept.name,
          value: dept._id,
        })),
        onFilter: (value, record) => record._id === value,
      },
      {
        title: "Description",
        key: "description",
        render: (_, record) => highlightText(record.description, searchText),
      },
      {
        title: "Created At",
        key: "createdAt",
        render: (_, record) =>
          record.createdAt ? new Date(record.createdAt).toLocaleString() : "-",
        sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      },
      {
        title: "Updated At",
        key: "updatedAt",
        render: (_, record) =>
          record.updatedAt ? new Date(record.updatedAt).toLocaleString() : "-",
        sorter: (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt),
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
              <Button
                type="default"
                icon={<EyeOutlined />}
                size="small"
                onClick={() =>
                  navigate(`${effectiveBasePath}/department/${record._id}`)
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
                  navigate(`${effectiveBasePath}/department/${record._id}/edit`)
                }
              />
            )}
            {permissions.canDelete && (
              <Popconfirm
                title="Are you sure you want to delete this department?"
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
    effectiveBasePath,
    navigate,
    permissions,
    searchText,
    highlightText,
    departments,
  ]);

  const renderEmpty = useCallback(() => {
    return (
      <Empty
        description={
          <span>
            {searchText
              ? "No departments match your search"
              : "No departments found"}
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
          {/* Nút Add New - chỉ hiển thị nếu có quyền create */}
          {permissions.canCreate && (
            <Button
              type="primary"
              onClick={() => navigate(`${effectiveBasePath}/department/create`)}
            >
              Add New
            </Button>
          )}

          {/* Nút Delete Selected - chỉ hiển thị nếu có quyền bulk delete và có items được chọn */}
          {permissions.canBulkDelete && selectedRowKeys.length > 0 && (
            <Popconfirm
              title={`Are you sure you want to delete ${selectedRowKeys.length} selected departments?`}
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
          {/* Thanh tìm kiếm - luôn hiển thị */}
          <Input
            placeholder="Search departments..."
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />

          {/* Nút Import - chỉ hiển thị nếu có quyền import */}
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
          {importModalVisible && showImportResults()}

          {/* Nút Export - chỉ hiển thị nếu có quyền export */}
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
        dataSource={filteredDepartments}
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
            `${range[0]}-${range[1]} of ${total} departments`,
        }}
        onChange={handleTableChange}
        locale={{
          emptyText: renderEmpty(),
        }}
      />
    </div>
  );
};

export default ListDepartments;
