import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Navigate } from 'react-router-dom';

import IndexRoutes from './routes/index';
import AdminRoutes from './routes/admin';

const App = () => {

  return (
    <Router>
      <Routes>
        <Route path="/*" element={<IndexRoutes />} />
        <Route path="/admin/*" element={<AdminRoutes />} />
      </Routes>
    </Router>
  );
}

export default App;