import { useState, useCallback, useEffect } from 'react';
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

const useUserRegistration = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [navigationTrigger, setNavigationTrigger] = useState(false);
  const navigate = useNavigate();

  const handleChange = useCallback((e) => {
    setFormData(prevFormData => ({ ...prevFormData, [e.target.name]: e.target.value }));
    setError('');
    setSuccess('');
  }, []);

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

  return {
    formData,
    error,
    success,
    loading,
    handleChange,
    handleSubmit,
    handleAddressSelected,
    setError
  };
};

export default useUserRegistration; 