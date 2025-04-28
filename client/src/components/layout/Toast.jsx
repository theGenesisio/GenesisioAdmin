import PropTypes from "prop-types";
import {
  dismissIcon,
  errorIcon,
  notificationIcon,
  successIcon,
  warningIcon,
} from "../../assets/icons";

const Toast = ({ notification, onDismiss }) => {
  const { type, message, id } = notification;
  const classes = {
    success: { box: "success-box", svg: successIcon },
    warning: { box: "warning-box", svg: warningIcon },
    error: { box: "error-box", svg: errorIcon },
    basic: { box: "basic-box", svg: notificationIcon },
  }[type];

  return (
    <div className={`${classes.box} toast`}>
      <div className='flex flex-col'>
        <div className='flex flex-row justify-between'>
          <span>{classes.svg}</span>
          <button
            onClick={() => onDismiss(id)}
            className='hover:scale-150 transition-all duration-200 ease-in-out'>
            {dismissIcon}
          </button>
        </div>
        <p className='font-normal'>{message}</p>
      </div>
    </div>
  );
};

// PropTypes for validation
Toast.propTypes = {
  notification: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    message: PropTypes.string.isRequired,
    type: PropTypes.oneOf(["success", "warning", "error", "basic"]).isRequired,
  }).isRequired,
  onDismiss: PropTypes.func.isRequired,
};

export default Toast;
