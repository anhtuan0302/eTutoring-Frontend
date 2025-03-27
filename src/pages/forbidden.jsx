import React from 'react';
import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const Forbidden = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f5f5f5'
    }}>
      <Result
        status="403"
        title="403"
        subTitle={
          <div style={{ textAlign: 'center' }}>
            <p>Sorry, you are not authorized to access this page.</p>
            {user && (
              <p style={{ fontSize: '14px', color: '#666' }}>
                Current role: <span style={{ fontWeight: 'bold' }}>{user.role}</span>
              </p>
            )}
          </div>
        }
        extra={[
          <Button
            type="primary"
            onClick={() => navigate('/')}
            key="home"
            style={{
              backgroundColor: '#1890ff',
              borderColor: '#1890ff'
            }}
          >
            Back Home
          </Button>,
          <Button 
            onClick={() => navigate(-1)} 
            key="back"
          >
            Go Back
          </Button>,
          <Button 
            danger 
            onClick={handleLogout}
            key="logout"
          >
            Logout
          </Button>
        ]}
      />
    </div>
  );
};

export default Forbidden;