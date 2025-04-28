import { useState, useEffect } from "react";
import { useNotification } from "../layout/NotificationHelper";
import PropTypes from "prop-types";
import AuthContext from "./AuthContextHelper";
import {
  saveAccessToken,
  getInitialAccessToken,
  getRefreshToken,
  saveRefreshToken,
  openDatabase,
  storeRefreshToken,
  deleteRefreshTokenFromDb,
  saveAdminToLocal,
  getAdminFromLocal,
} from "./authHelpers";
import FetchWithAuth from "./api";

const AuthProvider = ({ children }) => {
  const { addNotification } = useNotification();
  const [admin, setAdmin] = useState(getAdminFromLocal);
  const [accessToken, setAccessToken] = useState(getInitialAccessToken);
  const [refreshToken, setRefreshToken] = useState(getRefreshToken);
  const [dbSupported, setDbsupported] = useState(false);

  useEffect(() => {
    setDbsupported(!!window.indexedDB);
  }, []);

  useEffect(() => {
    if (dbSupported) {
      openDatabase()
        .then((db) => console.log("IndexedDB supported and initialized:", db))
        .catch((error) => {
          console.error("Error initializing IndexedDB:", error);
          console.log("Using fallback");
          setDbsupported(false); // Fallback to alternative if IndexedDB fails
        });
    }
  }, [dbSupported]);

  useEffect(() => {
    if (refreshToken && dbSupported) {
      storeRefreshToken(refreshToken)
        .then(() => console.log("Token stored successfully"))
        .catch((error) => {
          console.error("Error storing token in IndexedDB:", error);
          console.log("Using fallback");
          saveRefreshToken(refreshToken); // Fallback to alternative storage
        });
    } else if (refreshToken) {
      saveRefreshToken(refreshToken); // Fallback for non-IndexedDB support
    }
  }, [refreshToken, dbSupported]);

  useEffect(() => {
    saveAccessToken(accessToken);
  }, [accessToken]);

  const updateAdmin = (adminData, adminAccessToken, adminRefreshToken) => {
    setAdmin(adminData);
    saveAdminToLocal(adminData);
    setAccessToken(adminAccessToken);
    setRefreshToken(adminRefreshToken);
    return true;
  };

  const logout = async () => {
    try {
      // Call the logout API route
      const response = await FetchWithAuth(
        `/auth/logout`,
        {
          method: "DELETE",
          body: JSON.stringify({ refreshToken: getRefreshToken() || refreshToken }), // Assuming getRefreshToken() retrieves the current refresh token
          credentials: "include",
        },
        "Failed to logout"
      );

      console.log(response?.message);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Existing logout functions
      setAdmin(null);
      saveAdminToLocal(null);
      setAccessToken(null);
      deleteRefreshTokenFromDb();
      saveRefreshToken(null);
      addNotification("Logging out", "warning");
    }
  };
  return (
    <AuthContext.Provider
      value={{ admin, accessToken, updateAdmin, setAdmin, logout, dbSupported }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthProvider;
