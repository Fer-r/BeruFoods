// Google Maps Configuration Constants
export const GOOGLE_MAPS_CONFIG = {
  // Default locations
  DEFAULT_CENTER: { lat: 37.183953677649626, lng: -3.617425374147124 }, // Granada, Spain
  MADRID_CENTER: { lat: 40.416775, lng: -3.703790 },
  
  // Map settings
  DEFAULT_ZOOM: 15,
  DEFAULT_HEIGHT: '350px',
  DEFAULT_RADIUS: 25000, // 25km
  
  // API settings
  COUNTRY_RESTRICTION: 'es', // Spain
  DEBOUNCE_DELAY: 300, // milliseconds
  MIN_SEARCH_LENGTH: 2,
  
  // Retry settings
  MAX_RETRIES: 15,
  RETRY_INTERVAL: 400, // milliseconds
  API_TIMEOUT: 10000, // 10 seconds
  
  // UI settings
  DROPDOWN_MAX_HEIGHT: '240px', // 60 * 4 items
  BLUR_DELAY: 150, // milliseconds
};

// Error messages
export const ERROR_MESSAGES = {
  API_KEY_MISSING: 'Google Maps API key is not configured. Please set VITE_GOOGLE_MAPS_API_KEY.',
  API_NOT_LOADED: 'Google Maps API failed to load. Please check your internet connection.',
  PLACES_API_BLOCKED: 'Google Places API blocked. Please enable "Places API (New)" in your Google Cloud Console.',
  GEOCODING_FAILED: 'Unable to find location. Please try a different search term.',
  GEOLOCATION_DENIED: 'Location access denied. Using default location.',
  GEOLOCATION_UNAVAILABLE: 'Geolocation is not supported by this browser.',
  MAP_CONTAINER_NOT_FOUND: 'Map container not found.',
  INITIALIZATION_TIMEOUT: 'Google Maps initialization timed out. Please check your API key configuration.',
};

// Place types for autocomplete
export const PLACE_TYPES = ['establishment', 'geocode'];

// Required fields for place details
export const PLACE_FIELDS = ['location', 'formattedAddress', 'displayName', 'addressComponents'];

// Legacy API fields (for backward compatibility)
export const LEGACY_PLACE_FIELDS = ['formatted_address', 'geometry', 'address_components', 'name'];