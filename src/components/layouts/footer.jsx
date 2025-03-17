import React from 'react';
import { Layout } from 'antd';

const { Footer } = Layout;

const AppFooter = () => {
  return (
    <Footer
      style={{
        textAlign: 'center',
      }}
    >
      eTutoring ©{new Date().getFullYear()} Created by University of Greenwich
    </Footer>
  );
};

export default AppFooter;