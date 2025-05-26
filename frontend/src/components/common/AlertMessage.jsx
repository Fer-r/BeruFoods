import {
  HiCheckCircle,
  HiExclamationTriangle,
  HiInformationCircle,
  HiXCircle
} from 'react-icons/hi2';

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