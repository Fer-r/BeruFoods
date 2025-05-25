import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import useFoodTypes from '../../hooks/useFoodTypes';
import { fetchDataFromEndpoint } from '../../services/useApiService';
import FoodTypeModal from '../Auth/components/FoodTypeModal'; 
import StyledInput from '../../components/StyledInput';
import AlertMessage from '../../components/AlertMessage';
// import GoogleMapDisplay from '../../components/GoogleMapDisplay'; // Address update deferred

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
    // address fields can be added here if GoogleMapDisplay is used
    // fullAddress: '',
    // lat: null,
    // lng: null,
    // Restaurant addresses don't use city
  });
  const [imageFile, setImageFile] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isFoodTypeModalOpen, setIsFoodTypeModalOpen] = useState(false);

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
          email: data.email || '', // Email might not be editable, depends on backend logic/constraints
          phone: data.phone || '',
          openingTime: data.openingTime || '', // Ensure format matches input type='time' (HH:mm)
          closingTime: data.closingTime || '', // Ensure format matches input type='time' (HH:mm)
          selectedFoodTypeIds: data.foodTypes?.map(ft => ft.id) || [],
          // fullAddress: data.address?.address_line || '',
          // lat: data.address?.lat || null,
          // lng: data.address?.lng || null,
          // Restaurant addresses don't use city
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
    setCurrentImageUrl(''); // Clear old preview if a new file is selected
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

  // const handleAddressSelected = useCallback((addressDetails) => {
  //   setFormData(prev => ({
  //       ...prev,
  //       fullAddress: addressDetails.fullAddress,
  //       lat: addressDetails.lat,
  //       lng: addressDetails.lng,
        //       Restaurant addresses don't use city
  //   }));
  //   if (error === 'Please select a valid address using the autocomplete search.') {
  //       setError('');
  //   }
  // }, [error, setError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.selectedFoodTypeIds.length === 0 && availableFoodTypes.length > 0 && !foodTypesError) {
        setError("Please select at least one food type.");
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
            });
            setCurrentImageUrl(responseData.data.imageUrl || '');
        }
      } else if (responseData) { // Assumes successful update if data is present
        setSuccess('Profile updated successfully!');
        // Update formData and currentImageUrl with the new data from responseData
        setFormData({
          name: responseData.name || '',
          email: responseData.email || '',
          phone: responseData.phone || '',
          openingTime: responseData.openingTime || '', 
          closingTime: responseData.closingTime || '', 
          selectedFoodTypeIds: responseData.foodTypes?.map(ft => ft.id) || [],
        });
        setCurrentImageUrl(responseData.imageUrl || '');
        if (imageFile) {
             setImageFile(null); // Clear pending file if it was part of this successful update
        }
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

        <StyledInput
          type="file"
          id="imageFile"
          name="imageFile"
          label="Update Restaurant Image (Optional)"
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp"
          className="file-input file-input-bordered file-input-primary w-full"
          disabled={isLoading}
        />
        {currentImageUrl && !imageFile && (
            <div className="mt-2">
                <p className="text-sm text-gray-500 mb-1">Current Image:</p>
                <img src={currentImageUrl} alt="Current restaurant" className="max-h-48 rounded-md border border-base-300"/>
            </div>
        )}
        {imageFile && (
            <div className="mt-2">
                <p className="text-sm text-gray-500 mb-1">New Image Preview:</p>
                <img src={URL.createObjectURL(imageFile)} alt="New preview" className="max-h-48 rounded-md border border-base-300"/>
            </div>
        )}
        
        {/* GoogleMapDisplay for address update - Deferred
        <div className="w-full mt-4">
            <label className="label"><span className="label-text">Update Address (Optional)</span></label>
            <GoogleMapDisplay
                onAddressSelect={handleAddressSelected}
                initialLat={formData.lat}
                initialLng={formData.lng}
                initialAddress={formData.fullAddress}
            />
            {formData.fullAddress && (
            <div className="text-xs text-gray-600 mt-2 p-2 bg-base-200 rounded">
                Selected: {formData.fullAddress}<br/>
                (Lat: {formData.lat}, Lng: {formData.lng})
            </div>
            )}
        </div>
        */}

        <button type="submit" className="btn btn-primary w-full mt-8" disabled={isLoading || isLoadingFoodTypes}>
         {isLoading ? <span className="loading loading-spinner"></span> : 'Update Profile'}
       </button>
      </form>
    </div>
  );
};

export default RestaurantProfilePage; 