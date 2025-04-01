import React, { useState, useEffect, useRef } from "react";
import {
  Form,
  Input,
  Button,
  Row,
  Col,
  Typography,
  Card,
  Descriptions,
  message,
  Spin,
  Steps,
  Modal,
} from "antd";
import { LockOutlined } from "@ant-design/icons";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  verifyInvitation,
  completeRegistration,
} from "../api/auth/pendingUser";
import Webcam from "react-webcam";

const { Title, Text } = Typography;

const CompleteRegistrationPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingUser, setPendingUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [registeredUser, setRegisteredUser] = useState(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [avatarImage, setAvatarImage] = useState(null);
  const webcamRef = useRef(null);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        setLoading(true);
        setError("");

        if (!token) {
          setError("Token không hợp lệ");
          return;
        }

        const response = await verifyInvitation(token);
        setPendingUser(response.pendingUser);
      } catch (err) {
        console.error("Verification error:", err);
        setError(
          err.response?.data?.error || "Token không hợp lệ hoặc đã hết hạn"
        );
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const captureImage = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setAvatarImage(imageSrc);
      setIsCameraOpen(false);
      message.success("Đã chụp ảnh thành công");
    }
  };

  const handleSubmit = async (values) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError("");

      if (!avatarImage) {
        message.warning("Vui lòng chụp ảnh đại diện");
        return;
      }

      // Chuyển base64 thành file
      const imageResponse = await fetch(avatarImage);
      const blob = await imageResponse.blob();
      const avatarFile = new File([blob], "avatar.jpg", { type: "image/jpeg" });

      // Gửi cả password và avatar trong cùng request
      const registrationResponse = await completeRegistration(token, {
        password: values.password,
        confirm_password: values.confirmPassword,
        avatar: avatarFile,
      });

      setRegisteredUser(registrationResponse.user);
      setCurrentStep(2);
      message.success("Đăng ký thành công");
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err.response?.data?.error ||
          "Không thể hoàn tất đăng ký. Vui lòng thử lại."
      );
      message.error("Đăng ký thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trong component CameraModal, thay thế phần khung tròn bằng hình dáng khuôn mặt
  const CameraModal = () => (
    <Modal
      title="Chụp ảnh đại diện"
      open={isCameraOpen}
      onCancel={() => setIsCameraOpen(false)}
      footer={[
        <Button key="back" onClick={() => setIsCameraOpen(false)}>
          Hủy
        </Button>,
        <Button key="capture" type="primary" onClick={captureImage}>
          Chụp ảnh
        </Button>,
      ]}
      width={640}
      destroyOnClose
    >
      <div style={{ position: "relative", textAlign: "center" }}>
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            width: 640,
            height: 480,
            facingMode: "user",
          }}
          style={{ display: "block", width: "100%" }}
        />

        {/* Khung hướng dẫn khuôn mặt */}
        <svg
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "300px",
            height: "400px",
            pointerEvents: "none",
          }}
          viewBox="0 0 100 120"
          fill="none"
          stroke="#1890ff"
          strokeWidth="0.8"
        >
          {/* Giữ nguyên các phần vẽ khuôn mặt */}
          <path
            d="M50,15 
            C 25,15 15,35 15,60
            C 15,85 35,105 50,105
            C 65,105 85,85 85,60
            C 85,35 75,15 50,15"
          />
        </svg>

        <div
          style={{
            position: "absolute",
            top: 10,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.5)",
            color: "white",
            padding: "8px 16px",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        >
          Căn chỉnh khuôn mặt vào khung
        </div>

        <p style={{ marginTop: 10 }}>
          Giữ cho khuôn mặt nằm trong khung và nhấn "Chụp ảnh"
        </p>
      </div>
    </Modal>
  );

  const renderStepOne = () => (
    <>
      <Title level={2} style={{ marginBottom: "10px" }}>
        Xác nhận thông tin
      </Title>
      <Text type="secondary" style={{ display: "block", marginBottom: "30px" }}>
        Vui lòng kiểm tra thông tin của bạn
      </Text>
  
      <Card style={{ marginBottom: "24px" }}>
        <Descriptions title="Thông tin tài khoản" column={1}>
          <Descriptions.Item label="Họ và tên">
            {pendingUser.first_name} {pendingUser.last_name}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {pendingUser.email}
          </Descriptions.Item>
          <Descriptions.Item label="Vai trò">
            {pendingUser.role === "admin" && "Quản trị viên"}
            {pendingUser.role === "student" && "Sinh viên"}
            {pendingUser.role === "tutor" && "Giảng viên"}
            {pendingUser.role === "staff" && "Nhân viên"}
          </Descriptions.Item>
          {/* Chỉ hiển thị department nếu không phải admin */}
          {pendingUser.role !== 'admin' && (
            <Descriptions.Item label="Khoa/Phòng ban">
              {pendingUser.department?.name}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>
  
      <Row gutter={16}>
        <Col span={12}>
          <Button
            block
            onClick={() =>
              (window.location.href = "mailto:anhtuan030203@gmail.com")
            }
            style={{ height: "45px" }}
          >
            Sai thông tin
          </Button>
        </Col>
        <Col span={12}>
          <Button
            type="primary"
            block
            onClick={() => setCurrentStep(1)}
            style={{ height: "45px" }}
          >
            Xác nhận thông tin
          </Button>
        </Col>
      </Row>
    </>
  );

  const renderStepTwo = () => (
    <>
      <Title level={2} style={{ marginBottom: "10px" }}>
        Tạo mật khẩu và ảnh đại diện
      </Title>
      <Text type="secondary" style={{ display: "block", marginBottom: "30px" }}>
        Vui lòng tạo mật khẩu và chụp ảnh đại diện
      </Text>

      <div style={{ marginBottom: "24px", textAlign: "center" }}>
        {avatarImage ? (
          <div style={{ position: "relative", display: "inline-block" }}>
            <img
              src={avatarImage}
              alt="Avatar"
              style={{
                width: 150,
                height: 150,
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
            <Button
              type="link"
              onClick={() => setIsCameraOpen(true)}
              style={{ marginTop: 10 }}
            >
              Chụp lại
            </Button>
          </div>
        ) : (
          <Button
            type="primary"
            onClick={() => setIsCameraOpen(true)}
            style={{ marginBottom: 20 }}
          >
            Chụp ảnh đại diện
          </Button>
        )}
      </div>

      <Form
        name="complete_registration"
        onFinish={handleSubmit}
        layout="vertical"
        size="large"
      >
        {error && (
          <div style={{ color: "#ff4d4f", marginBottom: "16px" }}>{error}</div>
        )}

        <Form.Item
          name="password"
          label="Mật khẩu"
          rules={[
            { required: true, message: "Vui lòng nhập mật khẩu!" },
            { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
          ]}
          hasFeedback
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Nhập mật khẩu"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Xác nhận mật khẩu"
          dependencies={["password"]}
          rules={[
            { required: true, message: "Vui lòng xác nhận mật khẩu!" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error("Mật khẩu xác nhận không khớp!")
                );
              },
            }),
          ]}
          hasFeedback
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Xác nhận mật khẩu"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={isSubmitting}
            style={{ height: "45px" }}
          >
            Hoàn tất đăng ký
          </Button>
        </Form.Item>
      </Form>
      <CameraModal />
    </>
  );

  const renderStepThree = () => (
    <>
      <Title level={2} style={{ marginBottom: "10px" }}>
        Đăng ký thành công
      </Title>
      <Text type="secondary" style={{ display: "block", marginBottom: "30px" }}>
        Thông tin tài khoản của bạn
      </Text>

      <Card style={{ marginBottom: "24px" }}>
        <Descriptions title="Thông tin đăng nhập" column={1}>
          <Descriptions.Item label="Tên đăng nhập">
            {registeredUser.username}
          </Descriptions.Item>
          <Descriptions.Item
            label={
              registeredUser.role === "student"
                ? "Mã sinh viên"
                : registeredUser.role === "tutor"
                ? "Mã giảng viên"
                : "Mã nhân viên"
            }
          >
            {registeredUser.username}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {registeredUser.email}
          </Descriptions.Item>
          <Descriptions.Item label="Vai trò">
            {registeredUser.role === "student" && "Sinh viên"}
            {registeredUser.role === "tutor" && "Giảng viên"}
            {registeredUser.role === "staff" && "Nhân viên"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Button
        type="primary"
        block
        onClick={() => navigate("/")}
        style={{ height: "45px" }}
      >
        Đăng nhập hệ thống
      </Button>
    </>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" />
          <Text style={{ display: "block", marginTop: "20px" }}>
            Đang xác thực lời mời...
          </Text>
        </div>
      );
    }

    if (error && currentStep === 0) {
      return (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Text type="danger" style={{ fontSize: "16px" }}>
            {error}
          </Text>
          <br />
          <Button type="primary" style={{ marginTop: "20px" }}>
            <Link to="/">Quay về trang chủ</Link>
          </Button>
        </div>
      );
    }

    if (pendingUser) {
      return (
        <>
          <Steps
            current={currentStep}
            items={[
              { title: "Xác nhận thông tin" },
              { title: "Tạo mật khẩu" },
              { title: "Hoàn tất" },
            ]}
            style={{ marginBottom: "40px" }}
          />

          {currentStep === 0 && renderStepOne()}
          {currentStep === 1 && renderStepTwo()}
          {currentStep === 2 && renderStepThree()}
        </>
      );
    }
  };

  return (
    <Row style={{ minHeight: "100vh" }}>
      <Col xs={24} md={12} style={{ padding: "40px" }}>
        <div style={{ maxWidth: "450px", margin: "0 auto" }}>
          <div style={{ marginBottom: "40px" }}>
            <h1
              style={{ color: "#1890ff", fontSize: "24px", fontWeight: "bold" }}
            >
              <span
                style={{
                  backgroundColor: "#1890ff",
                  color: "white",
                  padding: "5px",
                  marginRight: "5px",
                }}
              >
                e
              </span>
              Tutoring
            </h1>
          </div>
          {renderContent()}
        </div>
      </Col>

      <Col
        xs={0}
        md={12}
        style={{
          background: "#e6f7ff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
        }}
      >
        <img
          alt="Registration illustration"
          style={{
            maxWidth: "100%",
            maxHeight: "80vh",
          }}
        />
      </Col>
    </Row>
  );
};

export default CompleteRegistrationPage;
