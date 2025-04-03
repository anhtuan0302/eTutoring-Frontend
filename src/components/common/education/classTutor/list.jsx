import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Table,
  Button,
  Popconfirm,
  message,
  Input,
  Empty,
  Space,
  Tag,
  Upload,
  Modal,
  Progress,
  Select,
} from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import {
  getTutorsByClass,
  assignTutor,
  removeTutor,
} from "../../../../api/education/classTutor";
import { getAllClasses } from "../../../../api/education/classInfo";
import { getAllTutors } from "../../../../api/organization/tutor";
import {
  SearchOutlined,
  DeleteOutlined,
  UserAddOutlined,
  DownloadOutlined,
  UploadOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";

const ListClassTutors = ({ basePath, customPermissions }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // States
  const [classTutors, setClassTutors] = useState([]);
  const [classes, setClasses] = useState([]);
  const [tutors, setTutors] = useState([]);
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);

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
          canDelete: true,
          canImport: true,
          canExport: true,
          canBulkDelete: true,
        };
      case "tutor":
        return {
          canView: true,
          canCreate: false,
          canDelete: false,
          canImport: false,
          canExport: true,
          canBulkDelete: false,
        };
      default:
        return {
          canView: true,
          canCreate: false,
          canDelete: false,
          canImport: false,
          canExport: false,
          canBulkDelete: false,
        };
    }
  }, [customPermissions, user?.role]);

  // Fetch data
  const fetchClassTutors = useCallback(async () => {
    try {
      setLoading(true);
      if (selectedClass) {
        const data = await getTutorsByClass(selectedClass);
        setClassTutors(data);
        setPagination(prev => ({
          ...prev,
          total: data.length,
        }));
      }
    } catch (error) {
      console.error("Error fetching class tutors:", error);
      message.error("Failed to load class tutors list");
    } finally {
      setLoading(false);
    }
  }, [selectedClass]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [classesData, tutorsData] = await Promise.all([
          getAllClasses(),
          getAllTutors()
        ]);
        setClasses(classesData);
        setTutors(tutorsData);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchClassTutors();
    }
  }, [fetchClassTutors, selectedClass]);

  // Handle delete
  const handleDelete = useCallback(async (id) => {
    try {
      await removeTutor(id);
      message.success("Tutor removed successfully");
      fetchClassTutors();
    } catch (error) {
      message.error(error.response?.data?.error || "Error removing tutor");
    }
  }, [fetchClassTutors]);

  const handleClassChange = (value) => {
    setSelectedClass(value);
    setSelectedRowKeys([]); // Reset selected rows khi đổi lớp
  };

  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    try {
      const deletePromises = selectedRowKeys.map(id => removeTutor(id));
      await Promise.all(deletePromises);
      message.success(`Removed ${selectedRowKeys.length} tutors successfully`);
      setSelectedRowKeys([]);
      fetchClassTutors();
    } catch (error) {
      message.error("Error removing tutors");
    }
  }, [selectedRowKeys, fetchClassTutors]);

  // Highlight text function
  const highlightText = useCallback((text, search) => {
    if (!search || !text) return text || "-";
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedSearch})`, "gi");
    return text.toString().split(regex).map((part, i) => 
      regex.test(part) ? (
        <mark key={i} style={{ backgroundColor: "#ffd591", padding: 0, margin: 0 }}>
          {part}
        </mark>
      ) : part
    );
  }, []);

  // Filter data
  const filteredClassTutors = useMemo(() => {
    let result = [...classTutors];
    const search = searchText.toLowerCase();

    if (search) {
      result = result.filter(tutor => {
        const tutorName = `${tutor.tutor_id?.user_id?.first_name} ${tutor.tutor_id?.user_id?.last_name}`.toLowerCase();
        const tutorCode = tutor.tutor_id?.tutor_code?.toLowerCase() || "";
        const department = tutor.tutor_id?.department_id?.name?.toLowerCase() || "";
        
        return tutorName.includes(search) || 
               tutorCode.includes(search) || 
               department.includes(search);
      });
    }

    return result;
  }, [classTutors, searchText]);

  // Table columns
  const columns = useMemo(() => {
    const baseColumns = [
      {
        title: "Tutor Code",
        key: "tutor_code",
        render: (_, record) => highlightText(record.tutor_id?.tutor_code, searchText),
      },
      {
        title: "Name",
        key: "name",
        render: (_, record) => highlightText(
          `${record.tutor_id?.user_id?.first_name} ${record.tutor_id?.user_id?.last_name}`,
          searchText
        ),
      },
      {
        title: "Email",
        key: "email",
        render: (_, record) => record.tutor_id?.user_id?.email,
      },
      {
        title: "Department",
        key: "department",
        render: (_, record) => highlightText(record.tutor_id?.department_id?.name, searchText),
      },
      {
        title: "Role",
        key: "role",
        render: (_, record) => (
          <Tag color={record.is_primary ? "green" : "blue"}>
            {record.is_primary ? "Primary" : "Secondary"}
          </Tag>
        ),
      }
    ];

    if (permissions.canView || permissions.canDelete) {
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
                onClick={() => navigate(`${effectiveBasePath}/classTutor/${record._id}`)}
              />
            )}
            {permissions.canDelete && (
              <Popconfirm
                title="Are you sure you want to remove this tutor?"
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
  }, [permissions, handleDelete, highlightText, searchText, navigate, effectiveBasePath]);

  // Export to Excel
  const exportToExcel = useCallback(() => {
    const dataToExport = filteredClassTutors.map(tutor => ({
      "Tutor Code": tutor.tutor_id?.tutor_code || "-",
      "First Name": tutor.tutor_id?.user_id?.first_name || "-",
      "Last Name": tutor.tutor_id?.user_id?.last_name || "-",
      "Email": tutor.tutor_id?.user_id?.email || "-",
      "Department": tutor.tutor_id?.department_id?.name || "-",
      "Role": tutor.is_primary ? "Primary" : "Secondary",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Class Tutors");

    const today = new Date();
    const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
    XLSX.writeFile(workbook, `ClassTutors_${dateStr}.xlsx`);
  }, [filteredClassTutors]);

  // Empty state renderer
  const renderEmpty = useCallback(() => {
    if (!selectedClass) {
      return <Empty description="Please select a class to view tutors" />;
    }
    return (
      <Empty
        description={
          <span>
            {searchText ? "No tutors match your search" : "No tutors found"}
          </span>
        }
      />
    );
  }, [searchText, selectedClass]);

  return (
    <div>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Space>
          {permissions.canCreate && (
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => navigate(`${effectiveBasePath}/classTutor/create`)}
            >
              Assign Tutor
            </Button>
          )}

          {permissions.canBulkDelete && selectedRowKeys.length > 0 && (
            <Popconfirm
              title={`Are you sure you want to remove ${selectedRowKeys.length} selected tutors?`}
              onConfirm={handleBulkDelete}
              okText="Yes"
              cancelText="No"
            >
              <Button type="primary" danger icon={<DeleteOutlined />}>
                Remove Selected ({selectedRowKeys.length})
              </Button>
            </Popconfirm>
          )}
        </Space>

        <Space>
          {/* Thêm Select để chọn lớp */}
          <Select
            placeholder="Select a class"
            style={{ width: 300 }}
            onChange={handleClassChange}
            value={selectedClass}
            showSearch
            optionFilterProp="label"
            options={classes.map(c => ({
              value: c._id,
              label: `${c.code} - ${c.name}`
            }))}
          />

          <Input
            placeholder="Search tutors..."
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          {permissions.canExport && selectedClass && (
            <Button icon={<DownloadOutlined />} onClick={exportToExcel}>
              Export Excel
            </Button>
          )}
        </Space>
      </div>

      {/* Hiển thị thông tin lớp học đã chọn */}
      {selectedClass && (
        <div style={{ marginBottom: 16 }}>
          <Tag color="blue">
            Selected Class: {classes.find(c => c._id === selectedClass)?.code} - {classes.find(c => c._id === selectedClass)?.name}
          </Tag>
        </div>
      )}

      <Table
        columns={columns}
        dataSource={filteredClassTutors}
        rowKey="_id"
        loading={loading}
        bordered
        rowSelection={
          permissions.canBulkDelete && selectedClass
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
            `${range[0]}-${range[1]} of ${total} tutors`,
        }}
        onChange={(newPagination) => setPagination(newPagination)}
        locale={{
          emptyText: renderEmpty(),
        }}
      />
    </div>
  );
};

export default ListClassTutors;