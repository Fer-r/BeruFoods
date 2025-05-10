import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { postPublicJSONToAPI } from '../services/useApiService';
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateRequired,
  validateMinLength,
  validatePhone
} from '../utils/formValidation';

// Define initial state outside the hook for consistency and potential reuse
const initialFormData = {
  email: '',
  password: '',
  confirmPassword: '',
  name: '', // Optional field
  phone: '', // Optional field
  addressLine: '', // New address fields
  lat: '',
  lng: '',
  province: '',
  fullAddress: '' // For display or context, may not be sent to backend directly
};

const useUserRegistration = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = useCallback((e) => {
    setFormData(prevFormData => ({ ...prevFormData, [e.target.name]: e.target.value }));
    setError('');
    setSuccess('');
  }, []); // No dependencies needed if only using setFormData with functional update

  const handleAddressSelected = useCallback((addressDetails) => {
    setFormData(prevFormData => ({
      ...prevFormData,
      addressLine: addressDetails.addressLine || '',
      lat: addressDetails.lat || '',
      lng: addressDetails.lng || '',
      province: addressDetails.province || '',
      fullAddress: addressDetails.fullAddress || '',
    }));
    setError(''); // Clear general error when address is selected
  }, []);

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

    const provinceError = validateRequired(formData.province, 'Province');
    if (provinceError) { setError(provinceError); return; }

    const nameError = validateMinLength(formData.name, 2, 'Full Name');
    if (nameError) { setError(nameError); return; }

    const phoneError = validatePhone(formData.phone, 'Phone Number');
    if (phoneError) { setError(phoneError); return; }

    setLoading(true);

    try {
      const registrationData = {
        email: formData.email,
        password: formData.password,
        name: formData.name || null, // Ensure null if empty
        phone: formData.phone || null, // Ensure null if empty
        address: { // Nest address data
          address_line: formData.addressLine,
          lat: formData.lat,
          lng: formData.lng,
          province: formData.province,
        }
      };

      // Use the new, more descriptive API service function
      const responseData = await postPublicJSONToAPI('/auth/register/user', registrationData);

      setSuccess(responseData.message || 'Registration successful! Redirecting to login...');
      setFormData(initialFormData); // Reset form to initial state
      
      setTimeout(() => {
        navigate('/');
      }, 1000);

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

  return {
    formData,
    error,
    success,
    loading,
    handleChange,
    handleSubmit,
    handleAddressSelected
  };
};

export default useUserRegistration; 