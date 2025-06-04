/**
 * Validates an email address.
 *
 * @param {string} email - The email address to validate.
 * @returns {string | null} An error message string if validation fails, otherwise null.
 */
export const validateEmail = (email) => {
  if (!email) return 'El correo electrónico es obligatorio.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Dirección de correo electrónico no válida.';
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
  if (!password) return 'La contraseña es obligatoria.';
  if (password.length < minLength) return `La contraseña debe tener al menos ${minLength} caracteres.`;
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
  if (!confirmPassword) return 'Confirmar contraseña es obligatorio.';
  if (password !== confirmPassword) return 'Las contraseñas no coinciden.';
  return null;
};

/**
 * Validates that a value is present and not empty.
 *
 * @param {*} value - The value to validate.
 * @param {string} [fieldName='Este campo'] - The name of the field being validated, used in the error message.
 * @returns {string | null} An error message string if validation fails, otherwise null.
 */
export const validateRequired = (value, fieldName = 'Este campo') => {
  if (value === null || value === undefined || String(value).trim() === '') return `${fieldName} es obligatorio.`;
  if (Array.isArray(value) && value.length === 0) return `${fieldName} requiere al menos una selección.`;
  return null;
};

/**
 * Validates that a value meets a minimum length requirement.
 *
 * @param {string} value - The value whose length is to be validated.
 * @param {number} minLength - The minimum required length.
 * @param {string} [fieldName='Este campo'] - The name of the field being validated, used in the error message.
 * @returns {string | null} An error message string if validation fails, otherwise null.
 */
export const validateMinLength = (value, minLength, fieldName = 'Este campo') => {
  if (!value || String(value).length < minLength) return `${fieldName} debe tener al menos ${minLength} caracteres.`;
  return null;
};

/**
 * Validates that a start time is before an end time.
 * Also checks if times are in HH:MM or HH:MM:SS format.
 * Handles cases where the end time is on the next day.
 *
 * @param {string} startTime - The start time string (e.g., "09:00" or "09:00:00").
 * @param {string} endTime - The end time string (e.g., "17:00" or "17:00:00").
 * @param {string} [startFieldName='Hora de apertura'] - The name for the start time field, used in error messages.
 * @param {string} [endFieldName='Hora de cierre'] - The name for the end time field, used in error messages.
 * @returns {string | null} An error message string if validation fails, otherwise null.
 */
export const validateTimeOrder = (startTime, endTime, startFieldName = 'Hora de apertura', endFieldName = 'Hora de cierre') => {
  if (!startTime || !endTime) return null; // If one is missing, another validator should catch it if required
  // Basic HH:MM format check (can be expanded)
  const timeRegexWithSeconds = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
  const timeRegexWithoutSeconds = /^([01]\d|2[0-3]):([0-5]\d)$/;

  const isValidTimeFormat = (timeStr) => {
      return timeRegexWithSeconds.test(timeStr) || timeRegexWithoutSeconds.test(timeStr);
  };

  if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
    return 'El formato de hora debe ser HH:MM o HH:MM:SS.';
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
    return `${startFieldName} debe ser anterior a ${endFieldName}.`;
  }
  
  if (startDate.getTime() === endDate.getTime()) {
    return `Para operación 24 horas, especifica diferentes ${startFieldName} y ${endFieldName}.`;
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
 * @param {string} [fieldName='Número de teléfono'] - The name of the field being validated, used in the error message.
 * @returns {string | null} An error message string if validation fails and the field is not empty, otherwise null.
 */
export const validatePhone = (phone, fieldName = 'Número de teléfono') => {
  if (!phone) return null; // Optional field, so no validation if empty
  if (!/^[\d\s()-]+$/.test(phone)) return `Formato de ${fieldName} no válido. Solo se permiten dígitos, espacios, guiones y paréntesis.`;
  return null;
};