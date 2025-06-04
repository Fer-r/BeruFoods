/**
 * Validates an email address.
 *
 * @param {string} email - The email address to validate.
 * @returns {string | null} An error message string if validation fails, otherwise null.
 */
export const validateEmail = (email) => {
  if (!email) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email address.';
  return null; // No error
};

/**
 * Validates a password based on a minimum length.
 *
 * @param {string} password - The password to validate.
 * @param {number} [minLength=6] - The minimum required length for the password.
 * @returns {string | null} An error message string if validation fails, otherwise null.
 */
export const validatePassword = (password, minLength = 6) => {
  if (!password) return 'Password is required.';
  if (password.length < minLength) return `Password must be at least ${minLength} characters long.`;
  return null;
};

/**
 * Validates if the confirmed password matches the original password.
 *
 * @param {string} password - The original password.
 * @param {string} confirmPassword - The confirmed password to compare.
 * @returns {string | null} An error message string if validation fails, otherwise null.
 */
export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return 'Confirm password is required.';
  if (password !== confirmPassword) return 'Passwords do not match.';
  return null;
};

/**
 * Validates that a value is present and not empty.
 *
 * @param {*} value - The value to validate.
 * @param {string} [fieldName='This field'] - The name of the field being validated, used in the error message.
 * @returns {string | null} An error message string if validation fails, otherwise null.
 */
export const validateRequired = (value, fieldName = 'This field') => {
  if (value === null || value === undefined || String(value).trim() === '') return `${fieldName} is required.`;
  if (Array.isArray(value) && value.length === 0) return `${fieldName} requires at least one selection.`;
  return null;
};

/**
 * Validates that a value meets a minimum length requirement.
 *
 * @param {string} value - The value whose length is to be validated.
 * @param {number} minLength - The minimum required length.
 * @param {string} [fieldName='This field'] - The name of the field being validated, used in the error message.
 * @returns {string | null} An error message string if validation fails, otherwise null.
 */
export const validateMinLength = (value, minLength, fieldName = 'This field') => {
  if (!value || String(value).length < minLength) return `${fieldName} must be at least ${minLength} characters long.`;
  return null;
};

/**
 * Validates that a start time is before an end time.
 * Also checks if times are in HH:MM or HH:MM:SS format.
 * Handles cases where the end time is on the next day.
 *
 * @param {string} startTime - The start time string (e.g., "09:00" or "09:00:00").
 * @param {string} endTime - The end time string (e.g., "17:00" or "17:00:00").
 * @param {string} [startFieldName='Opening time'] - The name for the start time field, used in error messages.
 * @param {string} [endFieldName='Closing time'] - The name for the end time field, used in error messages.
 * @returns {string | null} An error message string if validation fails, otherwise null.
 */
export const validateTimeOrder = (startTime, endTime, startFieldName = 'Opening time', endFieldName = 'Closing time') => {
  if (!startTime || !endTime) return null; // If one is missing, another validator should catch it if required
  // Basic HH:MM format check (can be expanded)
  const timeRegexWithSeconds = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
  const timeRegexWithoutSeconds = /^([01]\d|2[0-3]):([0-5]\d)$/;

  const isValidTimeFormat = (timeStr) => {
      return timeRegexWithSeconds.test(timeStr) || timeRegexWithoutSeconds.test(timeStr);
  };

  if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
    return 'Time must be in HH:MM or HH:MM:SS format.';
  }

  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const startDate = new Date(0, 0, 0, startHour, startMinute);
  let endDate;
  if (endHour < startHour || (endHour === startHour && endMinute < startMinute)) {
    endDate = new Date(0, 0, 1, endHour, endMinute); // Next day
  } else {
    endDate = new Date(0, 0, 0, endHour, endMinute); // Same day
  }

  if (startDate > endDate) {
    return `${startFieldName} must be before ${endFieldName}.`;
  }
  
  if (startDate.getTime() === endDate.getTime()) {
    return `For 24-hour operation, please specify different ${startFieldName} and ${endFieldName}.`;
  }
  return null;
};

// Add more validators as needed, e.g., for phone numbers, specific formats, etc.

/**
 * Validates a phone number.
 * This is an optional field validator; if the phone number is not provided, it returns null.
 * If provided, it checks for a basic format (digits, spaces, hyphens, parentheses).
 *
 * @param {string | null | undefined} phone - The phone number to validate.
 * @param {string} [fieldName='Phone number'] - The name of the field being validated, used in the error message.
 * @returns {string | null} An error message string if validation fails and the field is not empty, otherwise null.
 */
export const validatePhone = (phone, fieldName = 'Phone number') => {
  if (!phone) return null; // Optional field, so no validation if empty
  if (!/^[\d\s()-]+$/.test(phone)) return `Invalid ${fieldName} format. Only digits, spaces, hyphens, and parentheses are allowed.`;
  return null;
}; 