import { ERROR_MESSAGES } from './googleMapsConstants';

/**
 * Validates if Google Maps API key is properly configured
 * @param {string} apiKey - The API key to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidApiKey = (apiKey) => {
  return apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE';
};

/**
 * Checks if Google Maps API is loaded and ready
 * @returns {boolean} - True if loaded, false otherwise
 */
export const isGoogleMapsLoaded = () => {
  return !!(window.google && window.google.maps && window.google.maps.Map);
};

/**
 * Checks if Google Places API is loaded and ready
 * @returns {boolean} - True if loaded, false otherwise
 */
export const isGooglePlacesLoaded = () => {
  return !!(window.google && window.google.maps && window.google.maps.places);
};

/**
 * Extracts address components from Google Places result
 * @param {Object} addressComponents - Address components from Google Places
 * @returns {Object} - Formatted address data
 */
export const extractAddressComponents = (addressComponents) => {
  if (!addressComponents) return { streetNumber: '', route: '', city: '' };

  const streetNumber = addressComponents.find(comp => 
    comp.types?.includes('street_number'))?.longText || 
    addressComponents.find(comp => 
      comp.types?.includes('street_number'))?.long_name || '';
      
  const route = addressComponents.find(comp => 
    comp.types?.includes('route'))?.longText || 
    addressComponents.find(comp => 
      comp.types?.includes('route'))?.long_name || '';
      
  const city = addressComponents.find(comp => 
    comp.types?.includes('locality') || 
    comp.types?.includes('administrative_area_level_2'))?.longText || 
    addressComponents.find(comp => 
      comp.types?.includes('locality') || 
      comp.types?.includes('administrative_area_level_2'))?.long_name || '';

  return { streetNumber, route, city };
};

/**
 * Formats address line from components
 * @param {string} streetNumber - Street number
 * @param {string} route - Route/street name
 * @param {string} fallback - Fallback address if components are empty
 * @returns {string} - Formatted address line
 */
export const formatAddressLine = (streetNumber, route, fallback = '') => {
  if (streetNumber && route) {
    return `${streetNumber} ${route}`;
  }
  if (route) {
    return route;
  }
  return fallback;
};

/**
 * Creates standardized address data object
 * @param {Object} params - Address parameters
 * @returns {Object} - Standardized address object
 */
export const createAddressData = ({ 
  addressLine, 
  lat, 
  lng, 
  city, 
  fullAddress, 
  place 
}) => ({
  addressLine: addressLine || fullAddress || '',
  lat: lat?.toString() || '',
  lng: lng?.toString() || '',
  city: city || '',
  fullAddress: fullAddress || '',
  ...(place && { place })
});

/**
 * Handles Google Maps API errors and returns user-friendly messages
 * @param {Error} error - The error object
 * @returns {string} - User-friendly error message
 */
export const handleGoogleMapsError = (error) => {
  const errorMessage = error?.message || '';
  
  if (errorMessage.includes('RpcError') && errorMessage.includes('places.googleapis.com')) {
    return ERROR_MESSAGES.PLACES_API_BLOCKED;
  }
  
  if (errorMessage.includes('ApiNotActivatedMapError')) {
    return ERROR_MESSAGES.API_NOT_LOADED;
  }
  
  if (errorMessage.includes('blocked') || errorMessage.includes('not authorized')) {
    return ERROR_MESSAGES.PLACES_API_BLOCKED;
  }
  
  return errorMessage || ERROR_MESSAGES.API_NOT_LOADED;
};

/**
 * Creates a promise that rejects after a timeout
 * @param {number} timeout - Timeout in milliseconds
 * @param {string} message - Error message
 * @returns {Promise} - Promise that rejects after timeout
 */
export const createTimeoutPromise = (timeout, message = ERROR_MESSAGES.INITIALIZATION_TIMEOUT) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), timeout);
  });
};