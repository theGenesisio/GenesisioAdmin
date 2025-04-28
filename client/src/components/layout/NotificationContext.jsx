// NotificationContext.js
import { createContext, useState } from "react";
import PropTypes from "prop-types";
import { v4 as uuidv4 } from "uuid";
const NotificationContext = createContext();

const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [offline, setOffline] = useState(false);
  const addNotification = (message, type = "basic") => {
    let id = uuidv4();
    message !== "" && setNotifications((prev) => [...prev, { id: id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((note) => note.id !== id));
    }, 5000);
  };
  // Detecting offline/online state
  window.addEventListener("offline", function () {
    setOffline(true);
    addNotification("You have gone offline", "warning");
  });

  window.addEventListener("online", function () {
    setOffline(false);
    addNotification("Back online");
  });

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((note) => note.id !== id));
  };
  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, dismissNotification, offline }}>
      {children}
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default NotificationProvider;
export { NotificationContext }; // Export context if needed
