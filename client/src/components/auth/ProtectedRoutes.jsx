import { Navigate } from "react-router-dom";
import useAuth from "./useAuth";
import PropTypes from "prop-types";

const ProtectedRoute = ({ children }) => {
  const { accessToken, admin } = useAuth();
  // Ensure both admin and accessToken are present before rendering children
  if (admin && accessToken) {
    return children;
  }

  // Redirect to login if admin or accessToken is not available
  return <Navigate to='/login' replace />;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
