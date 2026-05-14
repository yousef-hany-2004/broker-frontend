import { Navigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const requiredRoles = Array.isArray(requiredRole)
      ? requiredRole
      : [requiredRole];
    const hasRole = requiredRoles.some((role) => user.roles?.includes(role));

    if (!hasRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
