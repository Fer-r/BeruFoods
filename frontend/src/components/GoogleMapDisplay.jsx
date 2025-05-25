import { useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { MdVisibilityOff, MdVisibility } from 'react-icons/md';
import { ERROR_MESSAGES } from '../utils/googleMapsConstants';
import { isValidApiKey } from '../utils/googleMapsHelpers';
import ModernGooglePlacesAutocomplete from './ModernGooglePlacesAutocomplete';
import SimpleGoogleMap from './SimpleGoogleMap';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const GoogleMapDisplay = ({ onAddressSelect, showMap = false, placeholder, defaultValue }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isMapVisible, setIsMapVisible] = useState(false);

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

  const toggleMapVisibility = () => {
    setIsMapVisible(!isMapVisible);
  };

  if (!isValidApiKey(GOOGLE_MAPS_API_KEY)) {
    return (
      <div className="p-4 border rounded-lg bg-error/10 text-error">
        <p className="font-semibold">Map and Autocomplete Configuration Error</p>
        <p>{ERROR_MESSAGES.API_KEY_MISSING}</p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <div>
        <ModernGooglePlacesAutocomplete onAddressSelect={handleAddressSelect} placeholder={placeholder} defaultValue={defaultValue} />
        
        {showMap && (
          <div className="mt-4">
            <div className="flex items-center justify-end mb-2">
              <button
                type="button"
                onClick={toggleMapVisibility}
                className="btn btn-sm btn-outline"
                aria-label={isMapVisible ? 'Hide map' : 'Show map'}
              >
                {isMapVisible ? (
                  <>
                    <MdVisibilityOff className="mr-1" />
                    Hide Map
                  </>
                ) : (
                  <>
                    <MdVisibility className="mr-1" />
                    Show Map
                  </>
                )}
              </button>
            </div>
            
            {isMapVisible && (
              <SimpleGoogleMap
                latitude={selectedLocation?.lat}
                longitude={selectedLocation?.lng}
                title={selectedLocation?.title || 'Selected Location'}
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