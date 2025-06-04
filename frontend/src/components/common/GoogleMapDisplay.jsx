import { useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { MdVisibilityOff, MdVisibility } from 'react-icons/md';
import { ERROR_MESSAGES } from '../../utils/googleMapsConstants';
import { isValidApiKey } from '../../utils/googleMapsHelpers';
import ModernGooglePlacesAutocomplete from './ModernGooglePlacesAutocomplete';
import SimpleGoogleMap from './SimpleGoogleMap';

/**
 * @constant GOOGLE_MAPS_API_KEY
 * @description The API key for Google Maps services, loaded from environment variables.
 * This key is essential for enabling Google Maps and Places API functionalities.
 */
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

/**
 * @component GoogleMapDisplay
 * @description Provides an address autocomplete input field powered by Google Places API.
 * Optionally, it can display a map of the selected address and allow toggling its visibility.
 * It requires a valid Google Maps API key to be configured.
 *
 * @param {object} props - The component's props.
 * @param {function} props.onAddressSelect - Callback function invoked when an address is selected
 *                                           from the autocomplete dropdown. It receives an object
 *                                           containing details of the selected address (e.g., lat, lng, formatted address).
 * @param {boolean} [props.showMap=false] - If true, a button to toggle map visibility and the map
 *                                          itself will be rendered. Defaults to false.
 * @param {string} [props.placeholder] - Placeholder text for the address autocomplete input field.
 * @param {string} [props.defaultValue] - Default value to pre-fill the address autocomplete input field.
 */
const GoogleMapDisplay = ({ onAddressSelect, showMap = false, placeholder, defaultValue }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isMapVisible, setIsMapVisible] = useState(false);

  /**
   * @function handleAddressSelect
   * @description Internal handler called when an address is selected from the ModernGooglePlacesAutocomplete component.
   * It updates the `selectedLocation` state with the coordinates and title of the selected address,
   * and then calls the `onAddressSelect` prop function with the full address details.
   * @param {object} addressDetails - An object containing the details of the selected address,
   *                                  including latitude, longitude, and formatted address string.
   */
  const handleAddressSelect = (addressDetails) => {
    setSelectedLocation({
      lat: addressDetails.lat,
      lng: addressDetails.lng,
      title: addressDetails.addressLine || addressDetails.fullAddress
    });

    if (typeof onAddressSelect === 'function') {
      onAddressSelect(addressDetails);
    }
  };

  /**
   * @function toggleMapVisibility
   * @description Internal handler for toggling the visibility state of the map display.
   * It updates the `isMapVisible` state, causing the map to be shown or hidden.
   */
  const toggleMapVisibility = () => {
    setIsMapVisible(!isMapVisible);
  };

  if (!isValidApiKey(GOOGLE_MAPS_API_KEY)) {
    return (
      <div className="p-4 border rounded-lg bg-error/10 text-error">
        <p className="font-semibold">Error de configuración de mapa y autocompletado</p>
        <p>{ERROR_MESSAGES.API_KEY_MISSING}</p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <div>
        <ModernGooglePlacesAutocomplete 
          onAddressSelect={handleAddressSelect} 
          placeholder={placeholder || "Comienza a escribir una dirección..."} 
          defaultValue={defaultValue} 
        />
        
        {showMap && (
          <div className="mt-4">
            <div className="flex items-center justify-end mb-2">
              <button
                type="button"
                onClick={toggleMapVisibility}
                className="btn btn-sm btn-outline"
                aria-label={isMapVisible ? 'Ocultar mapa' : 'Mostrar mapa'}
              >
                {isMapVisible ? (
                  <>
                    <MdVisibilityOff className="mr-1" />
                    Ocultar Mapa
                  </>
                ) : (
                  <>
                    <MdVisibility className="mr-1" />
                    Mostrar Mapa
                  </>
                )}
              </button>
            </div>
            
            {isMapVisible && (
              <SimpleGoogleMap
                latitude={selectedLocation?.lat}
                longitude={selectedLocation?.lng}
                title={selectedLocation?.title || 'Ubicación Seleccionada'}
                showInfoWindow={true}
              />
            )}
          </div>
        )}
      </div>
    </APIProvider>
  );
};

export default GoogleMapDisplay;