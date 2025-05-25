# Migration from Radar to Google Maps

This document outlines the changes made to migrate the BeruFoods project from Radar SDK to Google Maps API.

## Changes Made

### Frontend Changes

#### 1. Removed Radar Dependencies
- Removed `radar-sdk-js` package from `package.json`
- Deleted `frontend/src/components/RadarMapDisplay.jsx`
- Deleted `frontend/src/hooks/useLocation.js`

#### 2. Added Google Maps Components
- Created `frontend/src/utils/googleMapsLoader.js` - Global script loader to prevent multiple script loading
- Created `frontend/src/components/GooglePlacesAutocomplete.jsx` - Autocomplete component with fallback support
- Created `frontend/src/components/GoogleMapView.jsx` - Separate map display component
- Updated `frontend/src/components/GoogleMapDisplay.jsx` - Refactored to use separated components
- Updated `frontend/src/hooks/useGoogleLocation.js` - Updated to use global script loader

#### 3. Updated Component Imports
- Updated `frontend/src/pages/Auth/UserRegister.jsx` to use `GoogleMapDisplay`
- Updated `frontend/src/pages/Auth/RestaurantRegister.jsx` to use `GoogleMapDisplay`
- Updated `frontend/src/pages/Restaurant/RestaurantProfilePage.jsx` comments to reference `GoogleMapDisplay`
- Updated `frontend/src/pages/Home/Home.jsx` to use `useGoogleLocation`

### Backend Changes
No backend changes were required as the existing implementation was already using generic lat/lng fields and didn't have any Radar-specific code.

## Environment Variables

### Old Environment Variables (Remove these)
```
VITE_RADAR_PUBLISHABLE_KEY=your_radar_key_here
```

### New Environment Variables (Add these)
```
# Google Maps API Configuration
VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE
```

## Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create credentials (API Key)
5. Restrict the API key to your domain for security
6. Add the API key to your environment variables

## Features Maintained

All existing functionality has been preserved:
- Address autocomplete with Spain-specific search
- Map display with markers
- Geolocation support
- Location search and radius filtering
- Restaurant registration with address selection
- User registration with address selection

## New Features Added

### Authentication-Based Location Logic (Home Page)
- **Logged-in Users**: Automatically uses the address from their JWT token for restaurant search
  - Extracts coordinates from token's address object (latitude, longitude)
  - Displays city name in location field
  - Prevents manual location changes (uses registered address)
  - Shows info alert indicating registered address is being used
  
- **Non-logged-in Users**: Falls back to browser geolocation
  - Uses browser geolocation API to determine current location
  - Allows manual location search and changes
  - Reverse geocodes coordinates to show city name

### Smart Location Handling
- Seamless switching between user address and geolocation
- Location-ready state management for proper restaurant loading
- Consistent interface regardless of location source

## Technical Details

### Global Script Loader (`googleMapsLoader.js`)
- Prevents multiple Google Maps script loading
- Centralized script loading with promise caching
- Proper error handling and cleanup

### GooglePlacesAutocomplete Component
- Uses new PlaceAutocompleteElement when available
- Falls back to traditional Autocomplete for compatibility
- Restricted to Spain (`componentRestrictions: { country: 'es' }`)
- Proper event handling and cleanup

### GoogleMapView Component
- Separate component for map display only
- Clean separation of concerns
- Proper marker management and cleanup

### GoogleMapDisplay Component
- Composed of GooglePlacesAutocomplete and GoogleMapView
- Maintains the same prop interface as the old RadarMapDisplay
- Better modularity and maintainability

### useGoogleLocation Hook
- Uses global script loader to prevent conflicts
- Uses Google Maps Geocoding API for forward/reverse geocoding
- Maintains the same return interface as the old useLocation hook
- Supports both Spain-specific and general location searches

## Testing

After migration, test the following features:
1. User registration with address selection
2. Restaurant registration with address selection
3. Home page location search and filtering
4. Map display functionality (if enabled)

## Rollback Plan

If issues arise, you can rollback by:
1. Restoring the deleted files from git history
2. Reinstalling `radar-sdk-js` package
3. Reverting the import changes
4. Switching back to `VITE_RADAR_PUBLISHABLE_KEY` environment variable 