import { useEffect, useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import GoogleMapDisplay from '../../components/common/GoogleMapDisplay';
import useFoodTypes from '../../features/restaurant/hooks/useFoodTypes';
import useRestaurantRegistration from '../../features/restaurant/hooks/useRestaurantRegistration';
import FoodTypeModal from '../../features/auth/components/FoodTypeModal';
import StyledInput from '../../components/common/StyledInput';
import AlertMessage from '../../components/common/AlertMessage';

const RestaurantRegister = () => {
  const {
    foodTypes: availableFoodTypes,
    isLoading: isLoadingFoodTypes,
    error: foodTypesError
  } = useFoodTypes();

  const {
    formData,
    imageFile,
    error,
    success,
    loading,
    handleChange,
    handleFileChange,
    handleFoodTypeChange,
    handleAddressSelected,
    handleSubmit: handleRegistrationSubmit,
    setError
  } = useRestaurantRegistration();

  const [isFoodTypeModalOpen, setIsFoodTypeModalOpen] = useState(false);

  const navigate = useNavigate();

  const openFoodTypeModal = () => setIsFoodTypeModalOpen(true);
  const closeFoodTypeModal = () => setIsFoodTypeModalOpen(false);

  const onAddressSelect = useCallback((addressDetails) => {
      handleAddressSelected(addressDetails);
      if (error === 'Please select a valid address using the autocomplete search.') {
          setError('');
      }
  }, [handleAddressSelected, error, setError]);

  const handleFormSubmit = (e) => {
      handleRegistrationSubmit(e, foodTypesError);
  };

  useEffect(() => {
      if (success) {
          const timer = setTimeout(() => {
              navigate('/restaurant/login');
          }, 2000);
          return () => clearTimeout(timer);
      }
  }, [success, navigate]);

  return (
    <>
      <h2 className="card-title text-2xl mb-6">Restaurant Sign Up</h2>
      <div className="flex flex-col gap-6">
          <form onSubmit={handleFormSubmit} className="w-full space-y-4">
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
            />
            <StyledInput
              type="email"
              id="email"
              name="email"
              label="Business Email Address"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              placeholder="contact@restaurant.com"
            />
            <StyledInput
              type="password"
              id="password"
              name="password"
              label="Password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              autoComplete="new-password"
              placeholder="******"
            />
            <StyledInput
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
              placeholder="******"
            />
            <StyledInput
              type="tel"
              id="phone"
              name="phone"
              label="Phone Number (Optional)"
              value={formData.phone}
              onChange={handleChange}
              placeholder="123-456-7890"
            />

            <div className="grid grid-cols-2 gap-4">
              <StyledInput
                type="time"
                id="openingTime"
                name="openingTime"
                label="Opening Time"
                value={formData.openingTime}
                onChange={handleChange}
                required
              />
              <StyledInput
                type="time"
                id="closingTime"
                name="closingTime"
                label="Closing Time"
                value={formData.closingTime}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-control w-full">
                 <label className="label"><span className="label-text">Food Types *</span></label>
                 {foodTypesError && <div className="text-error text-xs mb-1">Error loading food types: {foodTypesError}</div>}
                 <button
                     type="button"
                     className="btn btn-outline w-full justify-start font-normal"
                     onClick={openFoodTypeModal}
                     disabled={isLoadingFoodTypes || !!foodTypesError}
                 >
                     {isLoadingFoodTypes
                         ? <span className="loading loading-spinner loading-xs"></span>
                         : formData.selectedFoodTypeIds.length > 0
                             ? `${formData.selectedFoodTypeIds.length} selected`
                             : 'Select Food Types...'}
                 </button>
                 {!isLoadingFoodTypes && !loading && !success && formData.selectedFoodTypeIds.length === 0 && availableFoodTypes.length > 0 &&
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
              label="Restaurant Image (Optional)"
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/webp"
              className="file-input file-input-bordered file-input-primary w-full"
            />
            {imageFile && <p className="text-xs mt-1 text-gray-500">Selected: {imageFile.name}</p>}

            <div className="w-full mt-4">
              <GoogleMapDisplay
                  onAddressSelect={onAddressSelect}
                  showMap={false}
              />
            </div>

            <button type="submit" className="btn btn-primary w-full mt-6" disabled={loading}>
             {loading ? <span className="loading loading-spinner"></span> : 'Sign Up Restaurant'}
           </button>

          <div className="text-center text-sm space-y-2 mt-4">
              <p>Already have a restaurant account? <Link to="/restaurant/login" className="link link-secondary">Sign In</Link></p>
              <p>Not a restaurant? <Link to="/register" className="link link-accent">User Sign Up</Link></p>
            </div>
          </form>
      </div>
    </>
  );
};

export default RestaurantRegister; 