import { useNavigate, useLocation } from "react-router-dom";
import useAuth from "./useAuth";
import PropTypes from "prop-types";
import { useEffect } from "react";

const CheckAuth = ({ children }) => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // useEffect(() => {
  //   if (accessToken) {
  //     if (location.pathname.startsWith("/login")) {
  //       navigate("/app/dashboard", { replace: true });
  //     } else if (location.pathname.startsWith("/")) {
  //       navigate("/app/dashboard", { replace: true });
  //     }
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [accessToken, location.pathname]);
  useEffect(() => {
    if (accessToken && (location.pathname === "/" || location.pathname === "/login")) {
      navigate("/app/dashboard", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, location.pathname]);

  return !accessToken ? children : null;
};

CheckAuth.propTypes = {
  children: PropTypes.node.isRequired,
};

export default CheckAuth;
