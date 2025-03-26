import React, { useEffect, useState } from "react";
import { Table, Tag, Button, Popconfirm, message, Input, Empty, Space, Upload, Modal } from "antd";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../../components/layouts/admin/layout";
import { getDepartment, updateDepartment, createDepartment } from "../../../../api/education/department";
import { SearchOutlined, DeleteOutlined, DownloadOutlined, UploadOutlined } from "@ant-design/icons";
import * as XLSX from 'xlsx';

const ListDepartment = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });
  const [importLoading, setImportLoading] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const data = await getDepartment();
      const activeDepartments = data.filter(dep => !dep.is_deleted);
      setDepartments(activeDepartments);
      setPagination({
        ...pagination,
        total: activeDepartments.length,
      });
    } catch (error) {
      console.error("Error fetching departments:", error);
      message.error("Failed to load department list");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const departmentToUpdate = departments.find(dep => dep._id === id);
      if (!departmentToUpdate) {
        message.error("Department not found");
        return;
      }
  
      await updateDepartment({
        id,
        name: departmentToUpdate.name,
        description: departmentToUpdate.description,
        is_deleted: true,
      });
  
      const updatedDepartments = departments.filter(dep => dep._id !== id);
      setDepartments(updatedDepartments);
      setSelectedRowKeys(prev => prev.filter(key => key !== id));
      setPagination({
        ...pagination,
        total: updatedDepartments.length,
      });
  
      message.success("Department deleted successfully");
    } catch (error) {
      message.error(error.response?.data?.error || "Error deleting department");
      console.error("Error details:", error);
    }
  };

  const handleDeleteMultiple = async () => {
    try {
      if (selectedRowKeys.length === 0) {
        message.warning("Please select at least one department to delete");
        return;
      }

      const updatePromises = selectedRowKeys.map(id => {
        const department = departments.find(dep => dep._id === id);
        return updateDepartment({
          id,
          name: department.name,
          description: department.description,
          is_deleted: true,
        });
      });

      await Promise.all(updatePromises);

      const updatedDepartments = departments.filter(dep => !selectedRowKeys.includes(dep._id));
      setDepartments(updatedDepartments);
      setSelectedRowKeys([]);
      setPagination({
        ...pagination,
        total: updatedDepartments.length,
      });
      
      message.success(`Deleted ${selectedRowKeys.length} departments successfully`);
    } catch (error) {
      message.error(error.response?.data?.error || "Error deleting departments");
      console.error("Error details:", error);
    }
  };

  const filteredDepartments = departments.filter(department => {
    const name = department.name ? department.name.toLowerCase() : '';
    const description = department.description ? department.description.toLowerCase() : '';
    const search = searchText.toLowerCase();
    
    return name.includes(search) || description.includes(search);
  });

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const exportToExcel = () => {
    const dataToExport = filteredDepartments.map(department => ({
      'Name': department.name || '-',
      'Description': department.description || '-',
      'Status': department.is_deleted ? 'Inactive' : 'Active'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Departments");
    
    const today = new Date();
    const dateStr = `${today.getDate()}-${today.getMonth()+1}-${today.getFullYear()}`;
    
    XLSX.writeFile(workbook, `Departments_${dateStr}.xlsx`);
  };

  const beforeUpload = (file) => {
    const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                   file.type === 'application/vnd.ms-excel';
    if (!isExcel) {
      message.error('Only Excel files are allowed!');
      return false;
    }
    return true;
  };

  const handleImport = async (info) => {
    const { file } = info;
    setImportLoading(true);
    
    try {
      const data = await readExcelFile(file);
      const validationResult = validateImportData(data);
      
      if (validationResult.hasErrors) {
        showImportErrors(validationResult.errors);
        return;
      }

      const results = await processImportData(data);
      setImportResults(results);
      setImportModalVisible(true);
      message.success(`Imported ${results.successCount} departments successfully`);
      fetchDepartments();
    } catch (error) {
      console.error("Import error:", error);
      message.error(`Import failed: ${error.message}`);
    } finally {
      setImportLoading(false);
    }
  };

  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
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
  };

  const validateImportData = (data) => {
    const errors = [];
    const nameSet = new Set(departments.map(d => d.name.toLowerCase()));
    
    data.forEach((row, index) => {
      const rowNumber = index + 2;
      
      if (!row['Name'] && !row['Department Name']) {
        errors.push(`Row ${rowNumber}: Missing department name`);
      }
    });
    
    return {
      hasErrors: errors.length > 0,
      errors
    };
  };

  const showImportErrors = (errors) => {
    message.error({
      content: (
        <div>
          <h4>Import errors:</h4>
          <ul style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {errors.map((error, i) => <li key={i}>{error}</li>)}
          </ul>
        </div>
      ),
      duration: 10,
    });
  };

  const processImportData = async (data) => {
    const results = {
      successCount: 0,
      errorCount: 0,
      errors: []
    };

    for (const [index, row] of data.entries()) {
      try {
        await createDepartment({
          name: row['Name'] || row['Department Name'], // Accept both column names
          description: row['Description'] || '',
          is_deleted: false // Automatically set to Active
        });
        results.successCount++;
      } catch (error) {
        results.errorCount++;
        results.errors.push({
          row: index + 2,
          name: row['Name'] || row['Department Name'],
          error: error.response?.data?.error || error.message
        });
      }
    }
    
    return results;
  };

  const showImportResults = () => {
    return (
      <Modal
        title="Import Results"
        visible={importModalVisible}
        onOk={() => setImportModalVisible(false)}
        onCancel={() => setImportModalVisible(false)}
        width={800}
      >
        <div>
          <p><strong>Successful imports:</strong> {importResults.successCount}</p>
          <p><strong>Failed imports:</strong> {importResults.errorCount}</p>
          
          {importResults.errorCount > 0 && (
            <div>
              <h4>Error Details:</h4>
              <Table
                columns={[
                  { title: 'Row', dataIndex: 'row', key: 'row' },
                  { title: 'Department Name', dataIndex: 'name', key: 'name' },
                  { title: 'Error', dataIndex: 'error', key: 'error' }
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
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text) => text || '-',
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text) => text || '-',
    },
    {
      title: "Status",
      dataIndex: "is_deleted",
      key: "is_deleted",
      render: (is_deleted) => (
        <Tag color={is_deleted ? "red" : "green"}>
          {is_deleted ? "Inactive" : "Active"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/admin/department/${record._id}`)}>
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this department?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout title="Department Management">
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button 
            type="primary" 
            onClick={() => navigate("/admin/department/create")}
          >
            Add New
          </Button>
          {selectedRowKeys.length > 0 && (
            <Popconfirm
              title={`Are you sure you want to delete ${selectedRowKeys.length} selected departments?`}
              onConfirm={handleDeleteMultiple}
              okText="Yes"
              cancelText="No"
            >
              <Button 
                type="primary" 
                danger 
                icon={<DeleteOutlined />}
              >
                Delete Selected ({selectedRowKeys.length})
              </Button>
            </Popconfirm>
          )}
        </Space>
        
        <Space>
          <Input
            placeholder="Search departments..."
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <Upload
            accept=".xlsx, .xls"
            beforeUpload={beforeUpload}
            customRequest={handleImport}
            showUploadList={false}
            disabled={importLoading}
          >
            <Button 
              icon={<UploadOutlined />}
              loading={importLoading}
            >
              Import Excel
            </Button>
          </Upload>
          <Button 
            type="default" 
            icon={<DownloadOutlined />}
            onClick={exportToExcel}
          >
            Export Excel
          </Button>
        </Space>
      </div>
      
      <Table 
        columns={columns} 
        dataSource={filteredDepartments} 
        rowKey="_id" 
        loading={loading}
        bordered
        rowSelection={{
          type: 'checkbox',
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          pageSizeOptions: ['5', '10', '20', '50', '100'],
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} departments`,
        }}
        onChange={handleTableChange}
        locale={{
          emptyText: (
            <Empty
              description={
                <span>
                  {searchText ? 
                    "No departments match your search" : 
                    "No departments found"
                  }
                </span>
              }
            />
          )
        }}
      />

      {importModalVisible && showImportResults()}
    </AdminLayout>
  );
};

export default ListDepartment;