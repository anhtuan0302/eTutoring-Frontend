import React, { useState, useMemo } from "react";
import { Form, Rate, Button, message, Modal, Input, Row, Col } from "antd";
import { RollbackOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import { reviewClass, getStudentsByClass } from "../../../../api/education/enrollment";
import { useEffect } from "react";

const { TextArea } = Input;

const UpdateEnrollment = ({ basePath, customPermissions }) => {
  const { id } = useParams();
  const [form] = Form.useForm();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [enrollment, setEnrollment] = useState(null);

  // Xác định basePath dựa theo role
  const effectiveBasePath = useMemo(() => {
    if (basePath) return basePath;

    switch (user?.role) {
      case "admin":
        return "/admin";
      case "staff":
        return "/staff";
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
      case "student":
        return {
          canReview: true,
        };
      default:
        return {
          canReview: false,
        };
    }
  }, [customPermissions, user?.role]);

  // Fetch enrollment data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const enrollments = await getStudentsByClass(id);
        const enrollment = enrollments.find(e => e._id === id);
        if (enrollment) {
          setEnrollment(enrollment);
          if (enrollment.review) {
            form.setFieldsValue({
              rating: enrollment.review.rating,
              comment: enrollment.review.comment,
            });
          }
        }
      } catch (error) {
        message.error("Failed to load enrollment data");
        console.error("Error fetching data:", error);
        navigate(`${effectiveBasePath}/enrollment`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, form, effectiveBasePath, navigate]);

  // Kiểm tra quyền
  useEffect(() => {
    if (!permissions.canReview) {
      message.error("You don't have permission to review");
      navigate(`${effectiveBasePath}/enrollment`);
    }
  }, [permissions, effectiveBasePath, navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await reviewClass(id, values);
      message.success("Review submitted successfully!");
      setTimeout(() => {
        navigate(`${effectiveBasePath}/enrollment/${id}`);
      }, 1000);
    } catch (error) {
      const apiError = error.response?.data?.error || "Failed to submit review";
      setErrorMessage(apiError);
      setIsModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  if (!enrollment && !loading) {
    return <div>Enrollment not found</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Button
          icon={<RollbackOutlined />}
          onClick={() => navigate(`${effectiveBasePath}/enrollment`)}
        >
          Back to List
        </Button>
      </div>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Rating"
              name="rating"
              rules={[{ required: true, message: "Please rate the class!" }]}
            >
              <Rate />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Comment"
              name="comment"
              rules={[{ required: true, message: "Please provide a comment!" }]}
            >
              <TextArea
                rows={4}
                placeholder="Share your experience about this class"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Submit Review
          </Button>
          <Button
            style={{ marginLeft: 8 }}
            onClick={() => navigate(`${effectiveBasePath}/enrollment/${id}`)}
          >
            Cancel
          </Button>
        </Form.Item>
      </Form>

      <Modal
        title="Error"
        open={isModalVisible}
        onOk={() => setIsModalVisible(false)}
        onCancel={() => setIsModalVisible(false)}
        okText="Close"
      >
        <p>{errorMessage}</p>
      </Modal>
    </div>
  );
};

export default UpdateEnrollment;