import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import IndexRoutes from './routes/index';
import { Navigate } from 'react-router-dom';

const App = () => {

  return (
    <Router>
      <Routes>
        <Route path="/*" element={<IndexRoutes />} />
      </Routes>
    </Router>
  );
}

export default App;