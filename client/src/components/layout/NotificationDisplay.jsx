// NotificationDisplay.js
import { useNotification } from ".//NotificationHelper";
import Toast from "./Toast";

const NotificationDisplay = () => {
  const { notifications, dismissNotification } = useNotification();

  return (
    <div>
      {notifications.map((notification) => (
        <Toast key={notification.id} notification={notification} onDismiss={dismissNotification} />
      ))}
    </div>
  );
};

export default NotificationDisplay;
