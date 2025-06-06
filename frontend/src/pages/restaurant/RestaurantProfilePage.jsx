import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import useFoodTypes from '../../features/restaurant/hooks/useFoodTypes';
import { fetchDataFromEndpoint } from '../../services/useApiService';
import FoodTypeModal from '../../features/auth/components/FoodTypeModal'; 
import StyledInput from '../../components/common/StyledInput';
import AlertMessage from '../../components/common/AlertMessage';
import GoogleMapDisplay from '../../components/common/GoogleMapDisplay';

const RestaurantProfilePage = () => {
  const { entity, token, logOut } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    openingTime: '',
    closingTime: '',
    selectedFoodTypeIds: [],
    address: {
      address_line: '',
      city: '',
      lat: '',
      lng: ''
    }
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isFoodTypeModalOpen, setIsFoodTypeModalOpen] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const {
    foodTypes: availableFoodTypes,
    isLoading: isLoadingFoodTypes,
    error: foodTypesError,
  } = useFoodTypes();

  useEffect(() => {
    if (!entity?.restaurantId) {
      // Redirect to login or home if not authenticated as a restaurant
      logOut(); // Clear any partial auth state
      navigate('/restaurant/login');
      return;
    }

    const fetchRestaurantDetails = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await fetchDataFromEndpoint(
          `/restaurants/${entity.restaurantId}`,
          'GET',
          null,
          true
        );
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          openingTime: data.openingTime || '',
          closingTime: data.closingTime || '',
          selectedFoodTypeIds: data.foodTypes?.map(ft => ft.id) || [],
          address: {
            address_line: data.address?.address_line || '',
            city: data.address?.city || '',
            lat: data.address?.lat || '',
            lng: data.address?.lng || ''
          }
        });
        setCurrentImageUrl(data.imageUrl || '');
      } catch (err) {
        setError(err.details?.message || err.message || 'Failed to fetch restaurant details.');
        if (err.details?.status === 401 || err.details?.status === 403) {
            logOut();
            navigate('/restaurant/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurantDetails();
  }, [entity, navigate, token, logOut]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setError('File is too large. Maximum size allowed is 4MB.');
        e.target.value = '';
        return;
      }
      
      setImageFile(file);
      setCurrentImageUrl('');
      setError('');
    }
  };

  const handleFoodTypeChange = (e) => {
    const { value, checked } = e.target;
    const foodTypeId = parseInt(value, 10);

    setFormData((prev) => {
      const newSelectedFoodTypeIds = checked
        ? [...prev.selectedFoodTypeIds, foodTypeId]
        : prev.selectedFoodTypeIds.filter((id) => id !== foodTypeId);
      return { ...prev, selectedFoodTypeIds: newSelectedFoodTypeIds };
    });
  };

  const handleAddressSelected = (addressDetails) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        address_line: addressDetails.addressLine || '',
        city: addressDetails.city || '',
        lat: addressDetails.lat || '',
        lng: addressDetails.lng || ''
      }
    }));
    if (error === 'Please select a valid address using the autocomplete search.') {
      setError('');
    }
  };

  const validatePasswordForm = () => {
    if (!passwordData.newPassword && !passwordData.confirmPassword) {
      return null; // No password change requested
    }

    if (!passwordData.newPassword) {
      return 'New password is required.';
    }

    if (passwordData.newPassword.length < 6) {
      return 'New password must be at least 6 characters long.';
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return 'New password and confirmation do not match.';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.selectedFoodTypeIds.length === 0 && availableFoodTypes.length > 0 && !foodTypesError) {
        setError("Please select at least one food type.");
        return;
    }

    // Validate password if changing
    const passwordError = validatePasswordForm();
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    const payload = new FormData();
    payload.append('name', formData.name);
    payload.append('phone', formData.phone);
    payload.append('openingTime', formData.openingTime);
    payload.append('closingTime', formData.closingTime);
    
    formData.selectedFoodTypeIds.forEach(id => {
      payload.append('food_type_ids[]', id);
    });

    // Add address data if provided
    if (formData.address.address_line) {
      payload.append('address[address_line]', formData.address.address_line);
      payload.append('address[city]', formData.address.city);
      payload.append('address[lat]', formData.address.lat);
      payload.append('address[lng]', formData.address.lng);
    }

    // Add password if changing
    if (passwordData.newPassword) {
      payload.append('password', passwordData.newPassword);
    }

    if (imageFile) {
      payload.append('imageFile', imageFile);
    }

    try {
      const responseData = await fetchDataFromEndpoint(
        `/restaurants/${entity.restaurantId}`,
        'POST', 
        payload,
        true
      );

      if (responseData && responseData.message === 'No changes detected. Profile data remains the same.') {
        setSuccess(responseData.message); 
        // Update form with data from response to ensure consistency, even if no changes
        if (responseData.data) {
            setFormData({
                name: responseData.data.name || '',
                email: responseData.data.email || '',
                phone: responseData.data.phone || '',
                openingTime: responseData.data.openingTime || '',
                closingTime: responseData.data.closingTime || '',
                selectedFoodTypeIds: responseData.data.foodTypes?.map(ft => ft.id) || [],
                address: {
                  address_line: responseData.data.address?.address_line || '',
                  city: responseData.data.address?.city || '',
                  lat: responseData.data.address?.lat || '',
                  lng: responseData.data.address?.lng || ''
                }
            });
            setCurrentImageUrl(responseData.data.imageUrl || '');
        }
      } else if (responseData) { // Assumes successful update if data is present
        setSuccess('Profile updated successfully! You will be logged out for security reasons.');
        // Update formData and currentImageUrl with the new data from responseData
        setFormData({
          name: responseData.name || '',
          email: responseData.email || '',
          phone: responseData.phone || '',
          openingTime: responseData.openingTime || '', 
          closingTime: responseData.closingTime || '', 
          selectedFoodTypeIds: responseData.foodTypes?.map(ft => ft.id) || [],
          address: {
            address_line: responseData.address?.address_line || '',
            city: responseData.address?.city || '',
            lat: responseData.address?.lat || '',
            lng: responseData.address?.lng || ''
          }
        });
        setCurrentImageUrl(responseData.imageUrl || '');
        if (imageFile) {
             setImageFile(null); // Clear pending file if it was part of this successful update
        }

        // Clear password fields after successful update
        setPasswordData({
          newPassword: '',
          confirmPassword: ''
        });
        setShowPasswordSection(false);

        // Logout after successful update for security
        setTimeout(() => {
          logOut();
          navigate('/restaurant/login');
        }, 2000); // Give user time to read the success message
      } else {
        // This case might occur if the server returns 200 OK but an empty body, which shouldn't happen with current backend logic
        setError('Profile update processed, but response data was unexpected.');
      }

    } catch (err) {
        let errorMessage = err.details?.message || err.message || 'Failed to update profile.';
        if (err.details?.errors) {
            const fieldErrors = Object.entries(err.details.errors)
                .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
                .join('; ');
            errorMessage = `${errorMessage} Details: ${fieldErrors}`;
        }
        setError(errorMessage);
         if (err.details?.status === 401 || err.details?.status === 403) {
            logOut();
            navigate('/restaurant/login');
        }
    } finally {
      setIsLoading(false);
    }
  };

  const openFoodTypeModal = () => setIsFoodTypeModalOpen(true);
  const closeFoodTypeModal = () => setIsFoodTypeModalOpen(false);

  if (!entity?.restaurantId && !isLoading) {
    // Should have been caught by useEffect, but as a safeguard
    return <div className="container mx-auto p-4 text-center">Redirecting to login...</div>;
  }
  if (isLoading && !formData.name) { // Initial load
    return <div className="container mx-auto p-4 text-center"><span className="loading loading-lg loading-spinner text-primary"></span></div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-center card-title">Restaurant Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-base-100 shadow-xl p-8 rounded-lg">
        {error && <AlertMessage type="error" message={error} />}
        {success && <AlertMessage type="success" message={success} />}

        <StyledInput
          id="name"
          name="name"
          label="Restaurant Name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="Delicious Bites"
          disabled={isLoading}
        />
        <StyledInput
          type="email"
          id="email"
          name="email"
          label="Business Email Address (Cannot be changed)"
          value={formData.email}
          onChange={handleChange}
          required
          autoComplete="email"
          placeholder="contact@restaurant.com"
          disabled
        />
        <StyledInput
          type="tel"
          id="phone"
          name="phone"
          label="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          placeholder="123-456-7890"
          disabled={isLoading}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StyledInput
            type="time"
            id="openingTime"
            name="openingTime"
            label="Opening Time"
            value={formData.openingTime}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
          <StyledInput
            type="time"
            id="closingTime"
            name="closingTime"
            label="Closing Time"
            value={formData.closingTime}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
            
        <div className="form-control w-full">
            <label className="label"><span className="label-text">Food Types *</span></label>
            {foodTypesError && <AlertMessage type="error" message={`Error loading food types: ${foodTypesError}`} />}
            <button
                type="button"
                className="btn btn-outline w-full justify-start font-normal"
                onClick={openFoodTypeModal}
                disabled={isLoadingFoodTypes || !!foodTypesError || isLoading}
            >
                {isLoadingFoodTypes
                    ? <span className="loading loading-spinner loading-xs"></span>
                    : formData.selectedFoodTypeIds.length > 0
                        ? `${formData.selectedFoodTypeIds.length} food type(s) selected`
                        : 'Select Food Types...'}
            </button>
            {!isLoadingFoodTypes && !isLoading && formData.selectedFoodTypeIds.length === 0 && availableFoodTypes.length > 0 && !foodTypesError &&
                <p className="text-error text-xs mt-1">Please select at least one food type.</p>
            }
        </div>

        <FoodTypeModal
            isOpen={isFoodTypeModalOpen}
            onClose={closeFoodTypeModal}
            availableFoodTypes={availableFoodTypes}
            selectedFoodTypeIds={formData.selectedFoodTypeIds}
            handleFoodTypeChange={handleFoodTypeChange}
            isLoading={isLoadingFoodTypes}
            error={foodTypesError}
        />

        {/* Address Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Restaurant Address</h3>
          <GoogleMapDisplay
            onAddressSelect={handleAddressSelected}
            showMap={false}
            placeholder="Start typing your restaurant address..."
            defaultValue={formData.address.address_line}
          />

          {formData.address.address_line && (
            <div className="text-xs text-base-content/70 mt-2 p-2 bg-base-200 rounded">
              Selected: {formData.address.address_line}
              {formData.address.city && `, ${formData.address.city}`}
              <br/>
              (Lat: {formData.address.lat}, Lng: {formData.address.lng})
            </div>
          )}
        </div>

        {/* Password Change Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Password</h3>
            <button
              type="button"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="btn btn-sm btn-outline"
              disabled={isLoading}
            >
              {showPasswordSection ? 'Cancel Password Change' : 'Change Password'}
            </button>
          </div>

          {showPasswordSection && (
            <div className="space-y-4 border border-base-300 p-4 rounded-lg bg-base-50">
              <StyledInput
                type="password"
                id="newPassword"
                name="newPassword"
                label="New Password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                placeholder="Enter new password"
                minLength="6"
                autoComplete="new-password"
                disabled={isLoading}
              />

              <StyledInput
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                label="Confirm New Password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Confirm new password"
                minLength="6"
                autoComplete="new-password"
                disabled={isLoading}
              />
            </div>
          )}
        </div>

        {/* Image Section */}
        <StyledInput
            type="file"
            id="imageFile"
            name="imageFile"
            label="Update Restaurant Image (Max 4MB, Optional)"
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/webp"
            className="file-input file-input-bordered file-input-primary w-full"
            disabled={isLoading}
        />
        {currentImageUrl && !imageFile && (
            <div className="mt-2">
              <p className="text-sm text-base-content/60 mb-1">Current Image:</p>
              <img src={currentImageUrl} alt="Current restaurant" className="max-h-48 rounded-md border border-base-300"/>
            </div>
        )}
        {imageFile && (
            <div className="mt-2">
              <p className="text-sm text-base-content/60 mb-1">New Image Preview:</p>
              <img src={URL.createObjectURL(imageFile)} alt="New preview" className="max-h-48 rounded-md border border-base-300"/>
            </div>
        )}

        <button type="submit" className="btn btn-primary w-full mt-8" disabled={isLoading || isLoadingFoodTypes}>
         {isLoading ? <span className="loading loading-spinner"></span> : 'Update Profile'}
       </button>
      </form>
    </div>
  );
};

export default RestaurantProfilePage; 