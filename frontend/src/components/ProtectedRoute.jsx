import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getToken } from "../services/api";

function ProtectedRoute() {
  const location = useLocation();
  const token = getToken();

  // Basic idea: no token means user should not see protected pages.
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
