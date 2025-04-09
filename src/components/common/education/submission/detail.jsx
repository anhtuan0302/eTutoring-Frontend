import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Row, 
  Col, 
  Form, 
  Input, 
  InputNumber, 
  Button, 
  Typography, 
  Space, 
  Avatar, 
  Tag, 
  message,
  Upload,
  Divider,
  Empty,
  Grid
} from 'antd';
import { 
  UserOutlined, 
  FileOutlined, 
  UploadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  RollbackOutlined
} from '@ant-design/icons';
import { getSubmissionsByAssignment, gradeSubmission, getSubmissionById } from '../../../../api/education/submission';
import { staticURL } from '../../../../api/config';
import { useAuth } from '../../../../AuthContext';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

/**
 * SubmissionDetail component displays detailed information about a submission
 * including student info, submission file, and grading information
 */
const SubmissionDetail = ({ basePath, customPermissions }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gradingLoading, setGradingLoading] = useState(false);
  const screens = useBreakpoint();

  // Determine basePath based on user role
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

  // Determine permissions based on user role
  const permissions = useMemo(() => {
    if (customPermissions) return customPermissions;

    switch (user?.role) {
      case "admin":
      case "staff":
        return {
          canView: true,
          canViewGrade: true,
          canGrade: false,
          canUpdateGrade: false,
        };
      case "tutor":
        return {
          canView: true,
          canViewGrade: true,
          canGrade: true,
          canUpdateGrade: true,
        };
      case "student":
        return {
          canView: true,
          canViewGrade: true,
          canGrade: false,
          canUpdateGrade: false,
        };
      default:
        return {
          canView: false,
          canViewGrade: false,
          canGrade: false,
          canUpdateGrade: false,
        };
    }
  }, [customPermissions, user?.role]);

  // Fetch submission details
  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        setLoading(true);
        const response = await getSubmissionById(id);
        if (response?.data) {
          setSubmission(response.data);
          form.setFieldsValue({
            score: response.data.grade?.score || 0,
            feedback: response.data.grade?.feedback || ''
          });
        }
      } catch (error) {
        message.error('Failed to load submission details');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [id, form]);

  // Handle grade submission
  const handleGrade = async (values) => {
    try {
      setGradingLoading(true);
      await gradeSubmission(id, values);
      message.success('Graded successfully');
      const response = await getSubmissionById(id);
      if (response?.data) {
        setSubmission(response.data);
        form.setFieldsValue({
          score: response.data.grade?.score || 0,
          feedback: response.data.grade?.feedback || ''
        });
      }
    } catch (error) {
      message.error('Failed to grade submission');
    } finally {
      setGradingLoading(false);
    }
  };

  if (loading) {
    return <Card loading={true} />;
  }

  if (!submission) {
    return (
      <Card>
        <Empty description="Submission not found" />
      </Card>
    );
  }

  if (!permissions.canView) {
    return (
      <Card>
        <Empty description="You don't have permission to view this submission" />
      </Card>
    );
  }

  // Calculate column spans based on screen size
  const pdfColSpan = screens.xl ? 18 : screens.lg ? 16 : screens.md ? 14 : 24;
  const infoColSpan = screens.xl ? 6 : screens.lg ? 8 : screens.md ? 10 : 24;

  return (
    <div style={{ padding: screens.xs ? '12px' : '24px' }}>
      <Row justify="space-between" style={{ marginBottom: 16 }}>
        <Button 
          type="default" 
          icon={<RollbackOutlined />}
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
      </Row>

      <Row gutter={[24, 24]}>
        {/* PDF Viewer Column */}
        <Col span={pdfColSpan}>
          {submission?.attachments?.length > 0 ? (
            <Card 
              title={
                <Space>
                  <FileOutlined />
                  <Text strong>{submission.attachments[0].file_name}</Text>
                </Space>
              }
              extra={
                <Button 
                  type="primary" 
                  icon={<DownloadOutlined />}
                  href={`${staticURL}/${submission.attachments[0].file_path}`}
                  target="_blank"
                >
                  Download
                </Button>
              }
            >
              <div style={{ 
                height: screens.xs ? '300px' : 'calc(100vh - 200px)', 
                overflow: 'auto' 
              }}>
                <embed
                  src={`${staticURL}/${submission.attachments[0].file_path}`}
                  type="application/pdf"
                  width="100%"
                  height="100%"
                  style={{ border: 'none' }}
                />
              </div>
            </Card>
          ) : (
            <Card>
              <Empty description="No submission file found" />
            </Card>
          )}
        </Col>

        {/* Info Column */}
        <Col span={infoColSpan}>
          <Card title="Submission Info">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {/* Student Info */}
              <div>
                <Text strong>Student</Text>
                <div style={{ marginTop: 8 }}>
                  <Space>
                    <Avatar
                      size={screens.xs ? 32 : 40}
                      src={
                        submission.student_id?.user_id?.avatar_path
                          ? `${staticURL}/${submission.student_id.user_id.avatar_path}`
                          : "/default-avatar.png"
                      }
                      icon={<UserOutlined />}
                    />
                    <Space direction="vertical" size={0}>
                      <Text 
                        strong 
                        style={{ cursor: 'pointer', color: '#1890ff' }}
                        onClick={() => navigate(`${effectiveBasePath}/user/${submission.student_id?.user_id?._id}`)}
                      >
                        {submission.student_id?.user_id?.first_name} {submission.student_id?.user_id?.last_name}
                      </Text>
                      <Text type="secondary">{submission.student_id?.student_code}</Text>
                    </Space>
                  </Space>
                </div>
              </div>

              {/* Submission Status */}
              <div>
                <Text strong>Status</Text>
                <div style={{ marginTop: 8 }}>
                  <Tag 
                    color={submission.status === "graded" ? "green" : "blue"}
                    icon={submission.status === "graded" ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                  >
                    {submission.status?.toUpperCase()}
                  </Tag>
                </div>
              </div>

              {/* Submission Time */}
              <div>
                <Text strong>Submitted At</Text>
                <div style={{ marginTop: 8 }}>
                  <Text>{new Date(submission.submitted_at).toLocaleString()}</Text>
                </div>
              </div>

              <Divider />

              {/* Grade Info (if graded) */}
              {submission.status === "graded" && (
                <div>
                  <Text strong>Graded By</Text>
                  <div style={{ marginTop: 8 }}>
                    <Space>
                      <Avatar
                        size={screens.xs ? 24 : 32}
                        src={
                          submission.grade?.graded_by?.user_id?.avatar_path
                            ? `${staticURL}/${submission.grade.graded_by.user_id.avatar_path}`
                            : "/default-avatar.png"
                        }
                        icon={<UserOutlined />}
                      />
                      <Text 
                        style={{ cursor: 'pointer', color: '#1890ff' }}
                        onClick={() => navigate(`${effectiveBasePath}/user/${submission.grade?.graded_by?.user_id?._id}`)}
                      >
                        {submission.grade?.graded_by?.user_id?.first_name} {submission.grade?.graded_by?.user_id?.last_name}
                      </Text>
                    </Space>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">
                      Graded at: {new Date(submission.grade?.graded_at).toLocaleString()}
                    </Text>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <Text strong>Score: </Text>
                    <Text>{submission.grade?.score}</Text>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <Text strong>Feedback: </Text>
                    <Text>{submission.grade?.feedback}</Text>
                  </div>
                </div>
              )}

              {/* Grading Form - Only visible to tutors */}
              {(permissions.canGrade || permissions.canUpdateGrade) && (
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleGrade}
                  initialValues={{
                    score: submission.grade?.score || 0,
                    feedback: submission.grade?.feedback || ''
                  }}
                >
                  <Form.Item
                    name="score"
                    label="Score"
                    rules={[
                      { required: true, message: 'Please input the score' },
                      { type: 'number', min: 0, max: 100, message: 'Score must be between 0 and 100' }
                    ]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="Enter score (0-100)"
                    />
                  </Form.Item>

                  <Form.Item
                    name="feedback"
                    label="Feedback"
                  >
                    <TextArea
                      rows={4}
                      placeholder="Enter feedback"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      loading={gradingLoading}
                      block
                    >
                      {submission.status === "graded" ? "Update Grade" : "Grade Submission"}
                    </Button>
                  </Form.Item>
                </Form>
              )}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SubmissionDetail;
