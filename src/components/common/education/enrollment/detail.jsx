import React, { useState, useEffect, useMemo } from "react";
import { Card, Descriptions, Button, Space, message, Tag, Rate } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";
import { getStudentsByClass } from "../../../../api/education/enrollment";
import { RollbackOutlined, EditOutlined } from "@ant-design/icons";

const EnrollmentDetail = ({ basePath, customPermissions }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);

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
      case "admin":
      case "staff":
        return {
          canView: true,
          canEdit: true,
        };
      case "student":
        return {
          canView: true,
          canEdit: false,
          canReview: true,
        };
      default:
        return {
          canView: true,
          canEdit: false,
          canReview: false,
        };
    }
  }, [customPermissions, user?.role]);

  useEffect(() => {
    const fetchEnrollmentDetail = async () => {
      try {
        setLoading(true);
        const enrollments = await getStudentsByClass(id);
        const enrollment = enrollments.find(e => e._id === id);
        if (enrollment) {
          setEnrollment(enrollment);
        }
      } catch (error) {
        message.error("Failed to load enrollment details");
        console.error("Error fetching enrollment:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollmentDetail();
  }, [id]);

  if (loading) {
    return <Card loading={true} />;
  }

  if (!enrollment) {
    return (
      <Card>
        <div>Enrollment not found</div>
      </Card>
    );
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
      <Descriptions bordered column={2}>
        <Descriptions.Item label="Student Code">
          <Tag>{enrollment.student_id?.student_code}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Student Name">
          {`${enrollment.student_id?.user_id?.first_name} ${enrollment.student_id?.user_id?.last_name}`}
        </Descriptions.Item>
        <Descriptions.Item label="Class">
          <Tag color="blue">
            {enrollment.classInfo_id?.code} - {enrollment.classInfo_id?.name}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Course">
          <Tag color="purple">
            {enrollment.classInfo_id?.course_id?.code} - {enrollment.classInfo_id?.course_id?.name}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Enrollment Date">
          {new Date(enrollment.createdAt).toLocaleString()}
        </Descriptions.Item>
        <Descriptions.Item label="Last Updated">
          {new Date(enrollment.updatedAt).toLocaleString()}
        </Descriptions.Item>
        {enrollment.review && (
          <>
            <Descriptions.Item label="Rating">
              <Rate disabled defaultValue={enrollment.review.rating} />
            </Descriptions.Item>
            <Descriptions.Item label="Review Date">
              {new Date(enrollment.review.review_at).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Comment" span={2}>
              {enrollment.review.comment || "-"}
            </Descriptions.Item>
          </>
        )}
      </Descriptions>

      <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-start" }}>
        {permissions.canReview && !enrollment.review && (
          <Button
            type="primary"
            onClick={() => navigate(`${effectiveBasePath}/enrollment/${id}/review`)}
          >
            Add Review
          </Button>
        )}
      </div>
    </div>
  );
};

export default EnrollmentDetail;