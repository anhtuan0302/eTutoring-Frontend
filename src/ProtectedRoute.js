import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Thêm prop isPublic để phân biệt public route và protected route
const ProtectedRoute = ({ children, roles, isPublic = false }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute:', { isAuthenticated, userRole: user?.role, requiredRoles: roles, path: location.pathname });

  // Xử lý public route (như trang login)
  if (isPublic) {
    if (isAuthenticated) {
      // Kiểm tra xem có đường dẫn đã lưu trong state không
      if (location.state?.from) {
        return <Navigate to={location.state.from} replace />;
      }
      
      // Nếu không có, chuyển hướng theo role
      if (user.role === 'admin') {
        return <Navigate to="/admin" replace />;
      }
      // Có thể thêm các role khác ở đây
      if (user.role === 'staff') return <Navigate to="/staff" replace />;
      if (user.role === 'teacher') return <Navigate to="/teacher" replace />;
      if (user.role === 'student') return <Navigate to="/student" replace />;
    }
    // Nếu chưa đăng nhập, hiển thị component
    return children;
  }

  // Xử lý protected route - lưu đường dẫn hiện tại vào state
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
};

export default ProtectedRoute;