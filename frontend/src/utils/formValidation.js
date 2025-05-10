export const validateEmail = (email) => {
  if (!email) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email address.';
  return null; // No error
};

export const validatePassword = (password, minLength = 6) => {
  if (!password) return 'Password is required.';
  if (password.length < minLength) return `Password must be at least ${minLength} characters long.`;
  return null;
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return 'Confirm password is required.';
  if (password !== confirmPassword) return 'Passwords do not match.';
  return null;
};

export const validateRequired = (value, fieldName = 'This field') => {
  if (value === null || value === undefined || String(value).trim() === '') return `${fieldName} is required.`;
  if (Array.isArray(value) && value.length === 0) return `${fieldName} requires at least one selection.`;
  return null;
};

export const validateMinLength = (value, minLength, fieldName = 'This field') => {
  if (!value || String(value).length < minLength) return `${fieldName} must be at least ${minLength} characters long.`;
  return null;
};

export const validateTimeOrder = (startTime, endTime, startFieldName = 'Opening time', endFieldName = 'Closing time') => {
  if (!startTime || !endTime) return null; // If one is missing, another validator should catch it if required
  // Basic HH:MM format check (can be expanded)
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    return 'Time must be in HH:MM or HH:MM:SS format.';
  }

  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const startDate = new Date(0, 0, 0, startHour, startMinute);
  const endDate = new Date(0, 0, 0, endHour, endMinute);

  if (startDate >= endDate) {
    return `${startFieldName} must be before ${endFieldName}.`;
  }
  return null;
};

// Add more validators as needed, e.g., for phone numbers, specific formats, etc.

export const validatePhone = (phone, fieldName = 'Phone number') => {
  if (!phone) return null; // Optional field, so no validation if empty
  if (!/^[\d\s\-\(\)]+$/.test(phone)) return `Invalid ${fieldName} format. Only digits, spaces, hyphens, and parentheses are allowed.`;
  return null;
}; 