import { useState, useCallback } from 'react';
import { postFormDataToAPI } from '../../../services/useApiService';
import { API_ENDPOINTS } from '../../../utils/constants';
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateRequired,
  validateTimeOrder
} from '../../../utils/formValidation'; // Import validators

// Define initial state outside the hook if it doesn't depend on props
const initialFormData = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  openingTime: '',
  closingTime: '',
  addressLine: '',
  lat: '',
  lng: '',
  city: '',
  fullAddress: '',
  selectedFoodTypeIds: [],
};

/**
 * Custom hook to manage restaurant registration form state and submission.
 */
const useRestaurantRegistration = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Generic handler for simple text/time/etc inputs
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
    setError(''); // Clear error on change
  }, []);

  // Handler for file input
  const handleFileChange = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.size > 4 * 1024 * 1024) {
        setError('File is too large. Maximum size allowed is 4MB.');
        e.target.value = ''; 
        setImageFile(null);
        return;
      }
      
      setImageFile(file);
    } else {
      setImageFile(null);
    }
    setError(''); // Clear error on change
  }, []);

  // Handler for food type checkboxes (updates formData.selectedFoodTypeIds)
  const handleFoodTypeChange = useCallback((e) => {
    const { value, checked } = e.target;
    const id = parseInt(value, 10);
    setFormData(prev => ({
      ...prev,
      selectedFoodTypeIds: checked
        ? [...prev.selectedFoodTypeIds, id]
        : prev.selectedFoodTypeIds.filter(item => item !== id),
    }));
    setError(''); // Clear error on change
  }, []);

  // Handler for address selection (updates multiple formData fields)
  const handleAddressSelected = useCallback((addressDetails) => {
    setFormData(prev => ({
        ...prev,
        addressLine: addressDetails.addressLine,
        lat: addressDetails.lat,
        lng: addressDetails.lng,
        city: addressDetails.city,
        fullAddress: addressDetails.fullAddress,
    }));
    setError(''); // Clear error on change
  }, []);

  // Helper to format time
  const formatTime = (timeString) => {
    if (timeString && timeString.match(/^\d{2}:\d{2}$/)) {
      return timeString + ':00'; // Ensure HH:MM:SS for backend
    }
    return timeString;
  };

  // Form submission handler
  const handleSubmit = useCallback(async (e, foodTypesError) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');

    if (foodTypesError) {
        setError(`Cannot submit form: Failed to load food types (${foodTypesError})`);
        return;
    }

    // --- Validations ---
    let validationError = validateRequired(formData.name, 'Restaurant Name') ||
                          validateEmail(formData.email) ||
                          validatePassword(formData.password) ||
                          validateConfirmPassword(formData.password, formData.confirmPassword) ||
                          validateRequired(formData.openingTime, 'Opening Time') ||
                          validateRequired(formData.closingTime, 'Closing Time') ||
                          validateTimeOrder(formData.openingTime, formData.closingTime) ||
                          validateRequired(formData.addressLine, 'Address') || // Validates if addressLine is populated
                          validateRequired(formData.selectedFoodTypeIds, 'Food Types');

    if (validationError) {
      setError(validationError);
      return;
    }
    // --- End Validations ---

    setLoading(true);
    const submitFormData = new FormData();

    submitFormData.append('name', formData.name);
    submitFormData.append('email', formData.email);
    submitFormData.append('password', formData.password);
    if (formData.phone) submitFormData.append('phone', formData.phone);
    submitFormData.append('openingTime', formatTime(formData.openingTime));
    submitFormData.append('closingTime', formatTime(formData.closingTime));

    if (imageFile) {
      submitFormData.append('imageFile', imageFile);
    }

    const addressPayload = JSON.stringify({
      address_line: formData.addressLine,
      lat: formData.lat,
      lng: formData.lng,
      city: formData.city,
    });
    submitFormData.append('address', addressPayload);

    submitFormData.append('food_type_ids', JSON.stringify(formData.selectedFoodTypeIds));

    try {
      await postFormDataToAPI(API_ENDPOINTS.AUTH.REGISTER_RESTAURANT, submitFormData);
            
      setSuccess('Restaurant registration successful! You will be redirected shortly.');
      setFormData(initialFormData);
      setImageFile(null);

    } catch (err) {
      console.error("Registration failed:", err);
      setError(err.details?.message || err.message || 'Registration failed. Please try again.');
      if (err.details?.errors) {
        const fieldErrors = Object.entries(err.details.errors)
          .map(([field, messages]) => {
            const readableField = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            return `${readableField}: ${messages.join(', ')}`;
          })
          .join('; ');
        setError(`Registration failed: ${fieldErrors}`);
      }
    } finally {
      setLoading(false);
    }
  }, [formData, imageFile]);

  return {
    formData,
    imageFile,
    error,
    success,
    loading,
    handleChange,
    handleFileChange,
    handleFoodTypeChange,
    handleAddressSelected, // Return address handler
    handleSubmit,
    setError, // Expose setError if component needs to set specific errors (e.g., address error)
  };
};

export default useRestaurantRegistration; 