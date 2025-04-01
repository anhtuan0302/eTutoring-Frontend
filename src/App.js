import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import ProtectedRoute from "./ProtectedRoute";

import LoginPage from "./pages/login";
import CompleteRegistrationPage from "./pages/completeRegistration";

import AdminRoutes from "./routes/admin";
import StaffRoutes from "./routes/staff";
import TutorRoutes from "./routes/tutor";
import NotFoundPage from "./pages/notFound";
import ForbiddenPage from "./pages/forbidden";

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
            path="/invitation"
            element={
              <ProtectedRoute isPublic>
                <CompleteRegistrationPage />
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
            path="/staff/*"
            element={
              <ProtectedRoute roles={["staff"]}>
                <StaffRoutes />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tutor/*"
            element={
              <ProtectedRoute roles={["tutor"]}>
                <TutorRoutes />
              </ProtectedRoute>
            }
          />

          <Route
            path="/forbidden"
            element={
              <ProtectedRoute>
                <ForbiddenPage />
              </ProtectedRoute>
            }
          />
          
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
