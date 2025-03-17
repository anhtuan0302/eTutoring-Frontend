import React from 'react';
import { Form, Input, Button, Checkbox, Row, Col, Typography, Divider } from 'antd';
import { UserOutlined, LockOutlined, GoogleOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

const Login = () => {
  const onFinish = (values) => {
    console.log('Success:', values);
    // Xử lý đăng nhập tại đây
  };

  return (
    <Row style={{ minHeight: '100vh' }}>
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
            onFinish={onFinish}
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
                <Link to="/forgot-password" style={{ color: '#1890ff' }}>
                  Forgot password
                </Link>
              </Row>
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
        </div>
      </Col>

      {/* Right image section */}
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