import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import ProtectedRoute from "./ProtectedRoute";

import LoginPage from "./pages/login";

import AdminRoutes from "./routes/admin";
import NotFound from "./pages/notFound";
import Forbidden from "./pages/forbidden";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute isPublic>
                <LoginPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/*"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminRoutes />
              </ProtectedRoute>
            }
          />

          <Route
            path="/forbidden"
            element={
              <ProtectedRoute>
                <Forbidden />
              </ProtectedRoute>
            }
          />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
