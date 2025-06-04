import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { postPublicJSONToAPI } from '../../../services/useApiService';
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateRequired,
  validateMinLength,
  validatePhone
} from '../../../utils/formValidation';

const initialFormData = {
  email: '',
  password: '',
  confirmPassword: '',
  name: '',
  phone: '',
  addressLine: '',
  addressLine2: '',
  lat: '',
  lng: '',
  city: '',
  fullAddress: ''
};

/**
 * @typedef {object} AddressDetails
 * @property {string} [addressLine] - The main address line.
 * @property {number | string} [lat] - The latitude of the address.
 * @property {number | string} [lng] - The longitude of the address.
 * @property {string} [city] - The city of the address.
 * @property {string} [fullAddress] - The complete, formatted address string.
 */

/**
 * Custom hook to manage the state and logic for user registration.
 * It handles form data, validation, API submission, and feedback (loading, success, error messages).
 *
 * @returns {object} An object containing:
 *  - `formData` {object}: State object holding the user registration form data (email, password, name, phone, address details).
 *  - `error` {string}: State variable holding error messages from validation or API calls.
 *  - `success` {string}: State variable holding success messages from API calls.
 *  - `loading` {boolean}: State variable indicating if the registration process is currently in progress.
 *  - `handleChange` {function(Event): void}: Handler for input field changes.
 *  - `handleSubmit` {function(Event): Promise<void>}: Handler for form submission.
 *  - `handleAddressSelected` {function(AddressDetails): void}: Handler for when an address is selected from an autocomplete component.
 *  - `setError` {function(string): void}: Function to manually set the error message state.
 */
const useUserRegistration = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [navigationTrigger, setNavigationTrigger] = useState(false);
  const navigate = useNavigate();

  /**
   * Handles changes in form input fields and updates the formData state.
   * Clears any existing error or success messages.
   *
   * @param {Event} e - The input change event object, typically from an HTMLInputElement.
   *                    `e.target.name` should correspond to a key in `formData`.
   *                    `e.target.value` will be the new value for that key.
   */
  const handleChange = useCallback((e) => {
    setFormData(prevFormData => ({ ...prevFormData, [e.target.name]: e.target.value }));
    setError('');
    setSuccess('');
  }, []);

  /**
   * Updates the form data with selected address details from an address autocomplete component.
   * Clears address-related error if a valid address is selected.
   *
   * @param {AddressDetails} addressDetails - An object containing the address components.
   */
  const handleAddressSelected = useCallback((addressDetails) => {
    setFormData(prevFormData => ({
      ...prevFormData,
      addressLine: addressDetails.addressLine || '',
      lat: addressDetails.lat || '',
      lng: addressDetails.lng || '',
      city: addressDetails.city || '',
      fullAddress: addressDetails.fullAddress || '',
    }));
    // Clear address-related error when a valid address is selected
    if (error === 'Please select a valid address using the autocomplete search.') {
      setError('');
    }
  }, [error]);

  /**
   * Handles the user registration form submission.
   * Performs validation on form fields, and if successful, makes an API call to register the user.
   * Sets loading state during the API call and provides success or error feedback.
   * Navigates to the login page on successful registration.
   *
   * @param {Event} e - The form submission event object.
   */
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Perform validation
    const emailError = validateEmail(formData.email);
    if (emailError) {
      setError(emailError);
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    const confirmPasswordError = validateConfirmPassword(formData.password, formData.confirmPassword);
    if (confirmPasswordError) {
      setError(confirmPasswordError);
      return;
    }

    // Validate required address fields
    const addressLineError = validateRequired(formData.addressLine, 'Address Line');
    if (addressLineError) { setError(addressLineError); return; }
    
    const latError = validateRequired(formData.lat, 'Latitude');
    if (latError) { setError(latError); return; }

    const lngError = validateRequired(formData.lng, 'Longitude');
    if (lngError) { setError(lngError); return; }

    const cityError = validateRequired(formData.city, 'City');
    if (cityError) { setError(cityError); return; }

    if (formData.name) {
      const nameError = validateMinLength(formData.name, 2, 'Full Name');
      if (nameError) { setError(nameError); return; }
    }

    if (formData.phone) {
      const phoneError = validatePhone(formData.phone, 'Phone Number');
      if (phoneError) { setError(phoneError); return; }
    }

    setLoading(true);

    try {
      const addressLines = [formData.addressLine];
      if (formData.addressLine2 && formData.addressLine2.trim()) {
        addressLines.push(formData.addressLine2.trim());
      }

      const registrationData = {
        email: formData.email,
        password: formData.password,
        name: formData.name || null,
        phone: formData.phone || null,
        address: {
          address_line: addressLines,
          lat: formData.lat,
          lng: formData.lng,
          city: formData.city,
        }
      };

      const responseData = await postPublicJSONToAPI('/auth/register/user', registrationData);

      setSuccess(responseData.message || 'Registration successful! Redirecting to login...');
      setFormData(initialFormData); // Reset form to initial state
      
      setNavigationTrigger(true); // Trigger navigation effect

    } catch (err) {
      setError(err.details?.message || err.message || 'Registration failed. Please try again.');
      if (err.details?.errors) {
        const fieldErrors = Object.entries(err.details.errors)
          .map(([field, messages]) => `${field.replace("address.", "Address ")}: ${messages.join(', ')}`)
          .join('; ');
        setError(`Registration failed: ${fieldErrors}`);
      }
    } finally {
      setLoading(false);
    }
  }, [formData, navigate]);

  useEffect(() => {
    let timeoutId;
    if (navigationTrigger) {
      timeoutId = setTimeout(() => {
        navigate('/');
      }, 1000);
      setNavigationTrigger(false);
    }
    return () => clearTimeout(timeoutId);
  }, [navigationTrigger, navigate]);


  // setError is already part of the hook's return and its purpose is clear from context and the main hook JSDoc.
  // However, if direct documentation for the setter function itself is desired:
  /**
   * Manually sets the error message state.
   *
   * @param {string} errorMessage - The error message to display. An empty string clears the error.
   */
  const setErrorMessage = useCallback((errorMessage) => {
    setError(errorMessage);
  }, []);

  return {
    formData,
    error,
    success,
    loading,
    handleChange,
    handleSubmit,
    handleAddressSelected,
    setError: setErrorMessage // Expose the useCallback wrapped version if preferred, or direct setError
  };
};

export default useUserRegistration; 