import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children, roles, isPublic = false }) => {
  const { user, isAuthenticated, loading } = useAuth(); // Thêm loading vào đây
  const location = useLocation();

  const isInvitationRoute = location.pathname.startsWith('/invitation');

  // Thêm loading check
  if (loading) {
    // Có thể return một loading spinner hoặc null
    return null; // hoặc return <LoadingSpinner />
  }

  // Xử lý public route (như trang login)
  if (isPublic || isInvitationRoute) {
    if (isAuthenticated && !isInvitationRoute) {
      // Redirect nếu đã đăng nhập (trừ trang invitation)
      if (location.state?.from) {
        return <Navigate to={location.state.from} replace />;
      }
      
      if (user.role === 'admin') return <Navigate to="/admin" replace />;
      if (user.role === 'staff') return <Navigate to="/staff" replace />;
      if (user.role === 'tutor') return <Navigate to="/tutor" replace />;
      if (user.role === 'student') return <Navigate to="/student" replace />;
    }
    return children;
  }

  // Xử lý protected route
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
};

export default ProtectedRoute;