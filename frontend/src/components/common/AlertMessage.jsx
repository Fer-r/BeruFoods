import {
  HiCheckCircle,
  HiExclamationTriangle,
  HiInformationCircle,
  HiXCircle
} from 'react-icons/hi2';

/**
 * @constant alertTypeConfig
 * @description Configuration object for different alert types.
 * It maps alert types (e.g., 'error', 'success') to their corresponding
 * CSS class names and icons.
 */
const alertTypeConfig = {
  error: {
    className: 'alert-error',
    Icon: HiXCircle,
  },
  success: {
    className: 'alert-success',
    Icon: HiCheckCircle,
  },
  warning: {
    className: 'alert-warning',
    Icon: HiExclamationTriangle,
  },
  info: {
    className: 'alert-info',
    Icon: HiInformationCircle,
  },
};

/**
 * AlertMessage component displays a styled message to the user.
 *
 * @param {object} props - The component's props.
 * @param {string} props.message - The message to display. This is required.
 * @param {string} [props.type='info'] - The type of alert, which determines its styling and icon.
 *                                       Valid types are 'error', 'success', 'warning', 'info'.
 *                                       Defaults to 'info'.
 */
const AlertMessage = ({ message, type = 'info' }) => {
  if (!message) return null;

  // Use the provided type or default to 'info' if the type is invalid
  const config = alertTypeConfig[type] || alertTypeConfig.info;

  const alertClasses = `alert shadow-lg ${config.className} text-sm p-3 mb-4`;
  const IconComponent = config.Icon;

  return (
    <div className={alertClasses}>
      <div className="flex items-center">
        {IconComponent && (
          <IconComponent className="h-5 w-5 mr-2 flex-shrink-0" />
        )}
        <span>{message}</span>
      </div>
    </div>
  );
};

export default AlertMessage;