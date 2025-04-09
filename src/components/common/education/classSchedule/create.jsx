import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Form,
  Input,
  Button,
  DatePicker,
  Switch,
  message,
  Card,
  Space,
  Upload,
  Modal,
  Progress,
  Table,
  TimePicker,
  Row,
  Col,
  Grid,
} from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import { createSchedule } from "../../../../api/education/classSchedule";
import { getClassById } from "../../../../api/education/classInfo";
import {
  UploadOutlined,
  DownloadOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";
import moment from "moment";

const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

const CreateSchedule = ({ basePath, customPermissions }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [isImportGuideVisible, setIsImportGuideVisible] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const screens = useBreakpoint();

  // Determine basePath based on user role
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

  // Determine user permissions
  const permissions = useMemo(() => {
    if (customPermissions) return customPermissions;

    switch (user?.role) {
      case "admin":
      case "staff":
        return {
          canCreate: true,
          canImport: true,
        };
      default:
        return {
          canView: false,
          canCreate: false,
          canImport: false,
        };
    }
  }, [customPermissions, user?.role]);

  // Fetch class information
  useEffect(() => {
    const fetchClassInfo = async () => {
      try {
        const data = await getClassById(id);
        setClassInfo(data);
      } catch (error) {
        message.error("Failed to load class information");
      }
    };

    fetchClassInfo();
  }, [id]);

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      const date = moment(values.date);
      const startTime = values.startTime;
      const endTime = values.endTime;

      const start_time = date.clone()
        .hour(startTime.hour())
        .minute(startTime.minute())
        .toISOString();

      const end_time = date.clone()
        .hour(endTime.hour())
        .minute(endTime.minute())
        .toISOString();
      
      const scheduleData = {
        classInfo_id: id,
        start_time,
        end_time,
        is_online: values.is_online,
        online_link: values.is_online ? values.online_link : undefined,
        location: !values.is_online ? values.location : undefined,
        status: 'scheduled'
      };

      await createSchedule(scheduleData);
      message.success("Schedule created successfully");
      navigate(`${effectiveBasePath}/classInfo/${id}`);
    } catch (error) {
      message.error(error.response?.data?.error || "Failed to create schedule");
    } finally {
      setLoading(false);
    }
  };

  // Validate uploaded file type
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

  // Validate imported data
  const validateImportData = useCallback((data) => {
    const errors = [];
    const classStartDate = new Date(classInfo?.start_date);
    const classEndDate = new Date(classInfo?.end_date);

    if (data.length > 50) {
      errors.push("Maximum 50 records allowed per import");
      return { hasErrors: true, errors };
    }

    data.forEach((row, index) => {
      const rowNumber = index + 2;

      if (!row["Date"]) {
        errors.push(`Row ${rowNumber}: Missing date`);
      } else {
        const date = excelDateToJSDate(row["Date"]);
        if (date < new Date()) {
          errors.push(`Row ${rowNumber}: Date must be in the future`);
        }
        if (date < classStartDate || date > classEndDate) {
          errors.push(
            `Row ${rowNumber}: Date must be within class duration`
          );
        }
      }

      if (!row["Start Time"] || !row["End Time"]) {
        errors.push(`Row ${rowNumber}: Missing start time or end time`);
      } else {
        const startHour = parseInt(row["Start Time"].split(":")[0]);
        const endHour = parseInt(row["End Time"].split(":")[0]);

        if (startHour < 7 || startHour > 21) {
          errors.push(`Row ${rowNumber}: Start time must be between 7:00 and 21:00`);
        }

        if (endHour < 7 || endHour > 21) {
          errors.push(`Row ${rowNumber}: End time must be between 7:00 and 21:00`);
        }

        if (row["Start Time"] >= row["End Time"]) {
          errors.push(`Row ${rowNumber}: End time must be after start time`);
        }
      }

      if (row["Is Online"] === false && !row["Location"]) {
        errors.push(`Row ${rowNumber}: Location is required for offline classes`);
      }

      if (row["Is Online"] === true && !row["Online Link"]) {
        errors.push(`Row ${rowNumber}: Online link is required for online classes`);
      }
    });

    return {
      hasErrors: errors.length > 0,
      errors,
    };
  }, [classInfo]);

  // Handle Excel import
  const handleImport = useCallback(
    async (info) => {
      const { file } = info;
      setImportLoading(true);
      setIsUploading(true);
      setUploadProgress(0);

      try {
        const reader = new FileReader();
        const data = await new Promise((resolve, reject) => {
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

        const validationResult = validateImportData(data);

        if (validationResult.hasErrors) {
          setImportResults({
            successCount: 0,
            errorCount: validationResult.errors.length,
            errors: validationResult.errors.map((error, index) => ({
              row: index + 1,
              error: error
            }))
          });
          setImportModalVisible(true);
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

        const progressStep = 100 / data.length;

        for (const [index, row] of data.entries()) {
          try {
            const date = moment(excelDateToJSDate(row["Date"]));
            const startTime = moment(row["Start Time"], "HH:mm");
            const endTime = moment(row["End Time"], "HH:mm");

            const start_time = date.clone()
              .hour(startTime.hour())
              .minute(startTime.minute())
              .toISOString();

            const end_time = date.clone()
              .hour(endTime.hour())
              .minute(endTime.minute())
              .toISOString();

            const scheduleData = {
              classInfo_id: id,
              start_time,
              end_time,
              is_online: row["Is Online"],
              online_link: row["Is Online"] ? row["Online Link"] : undefined,
              location: !row["Is Online"] ? row["Location"] : undefined,
              status: 'scheduled'
            };

            await createSchedule(scheduleData);
            results.successCount++;
            setUploadProgress(Math.min(100, (index + 1) * progressStep));
          } catch (error) {
            results.errorCount++;
            results.errors.push({
              row: index + 2,
              error: error.response?.data?.error || error.message,
            });
          }
        }

        setImportResults(results);
        setImportModalVisible(true);

        if (results.successCount > 0) {
          message.success(`Successfully created ${results.successCount} schedules`);
        }
      } catch (error) {
        message.error(`Import failed: ${error.message}`);
      } finally {
        setImportLoading(false);
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [id, validateImportData]
  );

  // Convert Excel date to JavaScript date
  const excelDateToJSDate = (serial) => {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);

    const fractional_day = serial - Math.floor(serial) + 0.0000001;
    let total_seconds = Math.floor(86400 * fractional_day);

    const seconds = total_seconds % 60;
    total_seconds -= seconds;

    const hours = Math.floor(total_seconds / (60 * 60));
    const minutes = Math.floor(total_seconds / 60) % 60;

    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
  };

  // Download Excel template
  const downloadTemplate = useCallback(() => {
    const sampleData = [
      {
        "Date": "2024-03-20",
        "Start Time": "09:00",
        "End Time": "11:00",
        "Is Online": true,
        "Online Link": "https://meet.google.com/abc-defg-hij",
        "Location": "",
      },
      {
        "Date": "2024-03-21",
        "Start Time": "14:00",
        "End Time": "16:00",
        "Is Online": false,
        "Online Link": "",
        "Location": "Room 101, Building A",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

    const colWidths = [
      { wch: 15 }, // Date
      { wch: 15 }, // Start Time
      { wch: 15 }, // End Time
      { wch: 10 }, // Is Online
      { wch: 30 }, // Online Link
      { wch: 30 }, // Location
    ];
    worksheet["!cols"] = colWidths;

    XLSX.writeFile(workbook, "Schedule_Template.xlsx");
  }, []);

  // Upload progress modal component
  const UploadProgressModal = useCallback(() => {
    if (!isUploading) return null;
    
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
            Please do not close or refresh the page while data is being uploaded...
          </div>
          <Progress percent={Math.round(uploadProgress)} status="active" />
        </div>
      </Modal>
    );
  }, [isUploading, uploadProgress]);

  // Import results modal component
  const ImportResultsModal = useCallback(() => {
    if (!importModalVisible || !importResults) return null;

    return (
      <Modal
        title="Import Results"
        open={importModalVisible}
        onOk={() => setImportModalVisible(false)}
        onCancel={() => setImportModalVisible(false)}
        width={800}
      >
        <div>
          <p><strong>Successfully created:</strong> {importResults.successCount} schedules</p>
          <p><strong>Failed:</strong> {importResults.errorCount} schedules</p>

          {importResults.errorCount > 0 && (
            <div>
              <h4>Error Details:</h4>
              <Table
                columns={[
                  { title: "Row", dataIndex: "row", key: "row" },
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

  // Import guide modal component
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
          <h4>Instructions for importing schedules:</h4>
          <ol>
            <li>Download the template file using the button below</li>
            <li>
              Fill in the data following these rules:
              <ul style={{ marginTop: "10px" }}>
                <li>
                  <strong>Date</strong>: Required, format: YYYY-MM-DD
                </li>
                <li>
                  <strong>Start Time</strong>: Required, format: HH:mm
                </li>
                <li>
                  <strong>End Time</strong>: Required, format: HH:mm
                </li>
                <li>
                  <strong>Is Online</strong>: Required, true/false
                </li>
                <li>
                  <strong>Online Link</strong>: Required if Is Online is true
                </li>
                <li>
                  <strong>Location</strong>: Required if Is Online is false
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
                  Date
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Start Time
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  End Time
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Is Online
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Online Link
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Location
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  2024-03-20
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  09:00
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  11:00
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  true
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  https://meet.google.com/abc-defg-hij
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  -
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: "20px" }}>
          <h4>Notes:</h4>
          <ul>
            <li>All schedules must be within the class duration</li>
            <li>Maximum 50 records per import</li>
            <li>File size should not exceed 5MB</li>
          </ul>
        </div>
      </Modal>
    );
  }, [isImportGuideVisible, downloadTemplate]);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button
            icon={<RollbackOutlined />}
            onClick={() => navigate(`${effectiveBasePath}/classInfo/${id}`)}
          >
            Back
          </Button>
          {permissions.canImport && (
            <Button
              icon={<UploadOutlined />}
              onClick={() => setIsImportGuideVisible(true)}
            >
              Import Excel
            </Button>
          )}
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
        </Space>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          is_online: false,
        }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={8} lg={8} xl={8}>
            <Form.Item
              name="date"
              label="Date"
              rules={[
                {
                  required: true,
                  message: "Please select date",
                },
              ]}
            >
              <DatePicker
                style={{ width: "100%" }}
                disabledDate={(current) => {
                  if (!classInfo) return false;
                  const classStartDate = moment(classInfo.start_date);
                  const classEndDate = moment(classInfo.end_date);
                  const today = moment().startOf('day');
                  
                  return (
                    current &&
                    (current < today ||
                     current < classStartDate.startOf("day") ||
                     current > classEndDate.endOf("day"))
                  );
                }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={8} lg={8} xl={8}>
            <Form.Item
              name="startTime"
              label="Start Time"
              rules={[
                {
                  required: true,
                  message: "Please select start time",
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value) {
                      return Promise.resolve();
                    }
                    const hour = value.hour();
                    if (hour < 7 || hour > 21) {
                      return Promise.reject(new Error('Start time must be between 7:00 and 21:00'));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <TimePicker
                format="HH:mm"
                style={{ width: "100%" }}
                minuteStep={30}
                disabledHours={() => [...Array(7).keys(), ...Array(3).keys().map(i => i + 22)]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={8} lg={8} xl={8}>
            <Form.Item
              name="endTime"
              label="End Time"
              rules={[
                {
                  required: true,
                  message: "Please select end time",
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || !getFieldValue('startTime')) {
                      return Promise.resolve();
                    }
                    const hour = value.hour();
                    if (hour < 7 || hour > 21) {
                      return Promise.reject(new Error('End time must be between 7:00 and 21:00'));
                    }
                    if (value.isBefore(getFieldValue('startTime'))) {
                      return Promise.reject(new Error('End time must be after start time'));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <TimePicker
                format="HH:mm"
                style={{ width: "100%" }}
                minuteStep={30}
                disabledHours={() => [...Array(7).keys(), ...Array(3).keys().map(i => i + 22)]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Form.Item
              name="is_online"
              label="Online Class"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) =>
                prevValues.is_online !== currentValues.is_online
              }
            >
              {({ getFieldValue }) =>
                getFieldValue("is_online") ? (
                  <Form.Item
                    name="online_link"
                    label="Online Link"
                    rules={[
                      {
                        required: true,
                        message: "Please input online link",
                      },
                    ]}
                  >
                    <Input placeholder="Enter online meeting link" />
                  </Form.Item>
                ) : (
                  <Form.Item
                    name="location"
                    label="Location"
                    rules={[
                      {
                        required: true,
                        message: "Please input location",
                      },
                    ]}
                  >
                    <Input placeholder="Enter class location" />
                  </Form.Item>
                )
              }
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Create Schedule
          </Button>
        </Form.Item>
      </Form>

      <ImportGuideModal />
      <UploadProgressModal />
      <ImportResultsModal />
    </div>
  );
};

export default CreateSchedule;
