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
      <h2 className="card-title text-2xl mb-6">Registro de Restaurante</h2>
      <div className="flex flex-col gap-6">
          <form onSubmit={handleFormSubmit} className="w-full space-y-4">
            {error && <AlertMessage type="error\" message={error} />}
            {success && <AlertMessage type="success" message={success} />}

            <StyledInput
              id="name"
              name="name"
              label="Nombre del Restaurante"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Delicias Gourmet"
            />
            <StyledInput
              type="email"
              id="email"
              name="email"
              label="Correo Electrónico del Negocio"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              placeholder="contacto@restaurante.com"
            />
            <StyledInput
              type="password"
              id="password"
              name="password"
              label="Contraseña"
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
              label="Confirmar Contraseña"
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
              label="Número de Teléfono (Opcional)"
              value={formData.phone}
              onChange={handleChange}
              placeholder="612 345 678"
            />

            <div className="grid grid-cols-2 gap-4">
              <StyledInput
                type="time"
                id="openingTime"
                name="openingTime"
                label="Hora de Apertura"
                value={formData.openingTime}
                onChange={handleChange}
                required
              />
              <StyledInput
                type="time"
                id="closingTime"
                name="closingTime"
                label="Hora de Cierre"
                value={formData.closingTime}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-control w-full">
                 <label className="label"><span className="label-text">Tipos de Cocina *</span></label>
                 {foodTypesError && <div className="text-error text-xs mb-1">Error al cargar tipos de cocina: {foodTypesError}</div>}
                 <button
                     type="button"
                     className="btn btn-outline w-full justify-start font-normal"
                     onClick={openFoodTypeModal}
                     disabled={isLoadingFoodTypes || !!foodTypesError}
                 >
                     {isLoadingFoodTypes
                         ? <span className="loading loading-spinner loading-xs"></span>
                         : formData.selectedFoodTypeIds.length > 0
                             ? `${formData.selectedFoodTypeIds.length} seleccionados`
                             : 'Seleccionar Tipos de Cocina...'}
                 </button>
                 {!isLoadingFoodTypes && !loading && !success && formData.selectedFoodTypeIds.length === 0 && availableFoodTypes.length > 0 &&
                     <p className="text-error text-xs mt-1">Por favor, selecciona al menos un tipo de cocina.</p>
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
              label="Imagen del Restaurante (Opcional)"
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/webp"
              className="file-input file-input-bordered file-input-primary w-full"
            />
            {imageFile && <p className="text-xs mt-1 text-gray-500">Seleccionado: {imageFile.name}</p>}

            <div className="w-full mt-4">
              <GoogleMapDisplay
                  onAddressSelect={onAddressSelect}
                  showMap={false}
                  placeholder="Comienza a escribir la dirección del restaurante..."
              />
            </div>

            <button type="submit" className="btn btn-primary w-full mt-6" disabled={loading}>
             {loading ? <span className="loading loading-spinner"></span> : 'Registrar Restaurante'}
           </button>

          <div className="text-center text-sm space-y-2 mt-4">
              <p>¿Ya tienes una cuenta de restaurante? <Link to="/restaurant/login" className="link link-secondary">Iniciar Sesión</Link></p>
              <p>¿No eres un restaurante? <Link to="/register" className="link link-accent">Registro de Usuario</Link></p>
            </div>
          </form>
      </div>
    </>
  );
};

export default RestaurantRegister;