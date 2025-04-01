import React from 'react';
import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f5f5f5'
    }}>
      <Result
        status="404"
        title="404"
        subTitle="Sorry, the page you visited does not exist."
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
          </Button>
        ]}
      />
    </div>
  );
};

export default NotFoundPage;