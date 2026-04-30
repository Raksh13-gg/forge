import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function RoleGuard({ children, allowedRoles }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // AuthContext handles initial loading state by not rendering children,
    // but just in case, return null here or a loading skeleton.
    return null; 
  }

  if (!user) {
    // Not logged in, redirect to login page
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Logged in but doesn't have the required role
    return <Navigate to="/403" replace />;
  }

  // Authorized, render the children
  return children;
}
