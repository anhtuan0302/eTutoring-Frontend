import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Row, Col, Typography, Divider, Space, message } from 'antd';
import { UserOutlined, LockOutlined, GoogleOutlined, MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { login, getAdmin } from '../api/user/admin';
import '../styles/login.css';
//import loginImage from '../assets/login-illustration.svg'; // Thay đổi path tới hình ảnh của bạn

const { Title, Text, Paragraph } = Typography;

const Login = () => {
  const [currentForm, setCurrentForm] = useState('login'); // 'login' hoặc 'forgotPassword'
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Hàm xử lý đăng nhập
  const handleLogin = async (values) => {
    try {
      setLoading(true);
      
      // Gọi API đăng nhập
      const loginData = await login(values.email, values.password);
      
      // Kiểm tra quyền admin
      try {
        const adminData = await getAdmin();
        
        // Nếu lấy được dữ liệu admin thành công, chuyển hướng đến dashboard
        message.success('Đăng nhập thành công với quyền admin!');
        navigate('/dashboard');
      } catch (adminError) {
        // Nếu không phải admin, hiển thị thông báo
        message.error('Tài khoản không có quyền truy cập trang quản trị');
        // Có thể logout người dùng ở đây hoặc chuyển hướng đến trang khác
      }
    } catch (error) {
      // Xử lý lỗi đăng nhập
      message.error('Đăng nhập thất bại: ' + (error.message || 'Vui lòng kiểm tra lại thông tin'));
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý nhập email để lấy lại mật khẩu
  const handleEmailSubmit = (values) => {
    setRecoveryEmail(values.email);
    console.log('Recovery email:', values.email);
    // Gọi API gửi OTP về email
    setForgotPasswordStep(2);
  };

  // Hàm xử lý xác thực OTP
  const handleOtpSubmit = (values) => {
    console.log('OTP submitted:', values.otp);
    // Gọi API xác thực OTP
    setForgotPasswordStep(3);
  };

  // Hàm xử lý đặt mật khẩu mới
  const handlePasswordSubmit = (values) => {
    console.log('New password submitted:', values);
    // Gọi API đặt lại mật khẩu
    // Sau khi thành công, quay lại form đăng nhập
    setCurrentForm('login');
    setForgotPasswordStep(1);
  };

  // Hàm quay lại form đăng nhập
  const backToLogin = () => {
    setCurrentForm('login');
    setForgotPasswordStep(1);
  };

  // Render tùy thuộc vào form hiện tại
  const renderForm = () => {
    if (currentForm === 'login') {
      return (
        <>
          {/* Welcome text */}
          <Title level={2} style={{ marginBottom: '10px' }}>
            Welcome back
          </Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: '30px' }}>
            Please enter your details
          </Text>

          {/* Login form */}
          <Form
            name="login_form"
            initialValues={{ remember: false }}
            onFinish={handleLogin}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="email"
              label="Email address"
              rules={[{ required: true, message: 'Please enter your email!', type: 'email' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Enter your email" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please enter your password!' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Enter your password" />
            </Form.Item>

            <Form.Item>
              <Row justify="space-between" align="middle">
                <Checkbox name="remember">Remember for 30 days</Checkbox>
                <a 
                  onClick={() => setCurrentForm('forgotPassword')} 
                  style={{ color: '#1890ff' }}
                >
                  Forgot password
                </a>
              </Row>
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                block 
                loading={loading}
                style={{ 
                  height: '45px', 
                  backgroundColor: '#1890ff',
                  borderColor: '#1890ff' 
                }}
              >
                Sign in
              </Button>
            </Form.Item>

            <Divider plain>or</Divider>

            <Form.Item>
              <Button 
                icon={<GoogleOutlined />} 
                block 
                style={{ 
                  height: '45px',
                  border: '1px solid #d9d9d9' 
                }}
              >
                Sign in with Google
              </Button>
            </Form.Item>
          </Form>

          {/* Sign up link */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Text type="secondary">Don't have an account?</Text>{' '}
            <Link to="/signup" style={{ color: '#1890ff' }}>
              Sign up
            </Link>
          </div>
        </>
      );
    } else if (currentForm === 'forgotPassword') {
      // Form quên mật khẩu với các bước khác nhau
      return (
        <>
          <div style={{ marginBottom: '30px' }}>
            <Button 
              type="text" 
              icon={<ArrowLeftOutlined />} 
              onClick={backToLogin}
              style={{ marginLeft: '-12px', color: '#1890ff' }}
            >
              Back to login
            </Button>
          </div>

          {/* Bước 1: Nhập email */}
          {forgotPasswordStep === 1 && (
            <>
              <Title level={2} style={{ marginBottom: '10px' }}>
                Forgot Password
              </Title>
              <Text type="secondary" style={{ display: 'block', marginBottom: '30px' }}>
                Enter your email and we'll send you a code to reset your password
              </Text>

              <Form
                name="forgot_password_email"
                onFinish={handleEmailSubmit}
                layout="vertical"
                size="large"
              >
                <Form.Item
                  name="email"
                  label="Email address"
                  rules={[{ required: true, message: 'Please enter your email!', type: 'email' }]}
                >
                  <Input 
                    prefix={<MailOutlined />} 
                    placeholder="Enter your email" 
                  />
                </Form.Item>

                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    block 
                    style={{ 
                      height: '45px', 
                      backgroundColor: '#1890ff', 
                      borderColor: '#1890ff' 
                    }}
                  >
                    Send Reset Code
                  </Button>
                </Form.Item>
              </Form>
            </>
          )}

          {/* Bước 2: Nhập mã OTP */}
          {forgotPasswordStep === 2 && (
            <>
              <Title level={2} style={{ marginBottom: '10px' }}>
                Enter Verification Code
              </Title>
              <Paragraph type="secondary" style={{ marginBottom: '30px' }}>
                We've sent a code to <Text strong>{recoveryEmail}</Text>. 
                Please enter the verification code below.
              </Paragraph>

              <Form
                name="verification_code"
                onFinish={handleOtpSubmit}
                layout="vertical"
                size="large"
              >
                <Form.Item
                  name="otp"
                  rules={[
                    { required: true, message: 'Please enter verification code!' },
                    { len: 6, message: 'Please enter a valid 6-digit code' }
                  ]}
                >
                  <Input.OTP
                    size="large"
                    length={6}
                    style={{ width: '60%', justifyContent: 'space-between' }}
                    inputStyle={{ 
                      width: '52px', 
                      height: '52px', 
                      margin: '0 6px', 
                      borderRadius: '8px',
                      fontSize: '18px',
                      textAlign: 'center'
                    }}
                    autoFocus
                  />
                </Form.Item>

                <Form.Item>
                  <Row>
                    <Col span={24} style={{ textAlign: 'center', marginBottom: '20px' }}>
                      <Button type="link" style={{ padding: 0 }}>
                        Didn't receive the code? Resend
                      </Button>
                    </Col>
                  </Row>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Button onClick={() => setForgotPasswordStep(1)}>
                      Change Email
                    </Button>
                    <Button 
                      type="primary" 
                      htmlType="submit"
                      style={{ 
                        backgroundColor: '#1890ff', 
                        borderColor: '#1890ff' 
                      }}
                    >
                      Verify
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </>
          )}

          {/* Bước 3: Đặt mật khẩu mới */}
          {forgotPasswordStep === 3 && (
            <>
              <Title level={2} style={{ marginBottom: '10px' }}>
                Create New Password
              </Title>
              <Text type="secondary" style={{ display: 'block', marginBottom: '30px' }}>
                Your new password must be different from previous passwords
              </Text>

              <Form
                name="new_password"
                onFinish={handlePasswordSubmit}
                layout="vertical"
                size="large"
              >
                <Form.Item
                  name="password"
                  label="New Password"
                  rules={[
                    { required: true, message: 'Please enter your new password!' },
                    { min: 8, message: 'Password must be at least 8 characters' }
                  ]}
                  hasFeedback
                >
                  <Input.Password 
                    prefix={<LockOutlined />} 
                    placeholder="Enter new password" 
                  />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  label="Confirm Password"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: 'Please confirm your password!' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('The two passwords do not match!'));
                      },
                    }),
                  ]}
                  hasFeedback
                >
                  <Input.Password 
                    prefix={<LockOutlined />} 
                    placeholder="Confirm new password" 
                  />
                </Form.Item>

                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    block 
                    style={{ 
                      height: '45px', 
                      backgroundColor: '#1890ff', 
                      borderColor: '#1890ff' 
                    }}
                  >
                    Reset Password
                  </Button>
                </Form.Item>
              </Form>
            </>
          )}
        </>
      );
    }
  };

  return (
    <Row style={{ minHeight: '100vh' }}>
      {/* Col bên trái - Chứa form */}
      <Col xs={24} md={12} style={{ padding: '40px' }}>
        <div style={{ maxWidth: '450px', margin: '0 auto' }}>
          {/* Logo */}
          <div style={{ marginBottom: '40px' }}>
            <h1 style={{ color: '#1890ff', fontSize: '24px', fontWeight: 'bold' }}>
              <span style={{ 
                backgroundColor: '#1890ff', 
                color: 'white', 
                padding: '5px', 
                marginRight: '5px' 
              }}>e</span>
              Tutoring
            </h1>
          </div>
          
          {/* Render form tùy theo trạng thái */}
          {renderForm()}
        </div>
      </Col>
      
      {/* Col bên phải - Hình ảnh (không thay đổi) */}
      <Col 
        xs={0} 
        md={12} 
        style={{ 
          background: '#e6f7ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px'
        }}
      >
        <img 
          //src={loginImage} 
          alt="Login illustration" 
          style={{ 
            maxWidth: '100%', 
            maxHeight: '80vh' 
          }} 
        />
      </Col>
    </Row>
  );
};

export default Login;