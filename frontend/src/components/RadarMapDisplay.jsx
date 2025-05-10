import { useEffect, useRef, useState } from 'react';
import Radar from 'radar-sdk-js';
import 'radar-sdk-js/dist/radar.css';


const RADAR_PUBLISHABLE_KEY = import.meta.env.VITE_RADAR_PUBLISHABLE_KEY || 'YOUR_RADAR_PUBLISHABLE_KEY_HERE';

if (RADAR_PUBLISHABLE_KEY === 'YOUR_RADAR_PUBLISHABLE_KEY_HERE') {
  console.warn("Radar API Key not found in environment variables. Please set VITE_RADAR_PUBLISHABLE_KEY.");
}

const DEFAULT_COORDS = { longitude: -3.617425374147124, latitude: 37.183953677649626 }; // Granada, Spain

// Accept onAddressSelect as prop, apiKey is now handled internally
const RadarMapDisplay = ({ onAddressSelect, showMap = false }) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const autocompleteRef = useRef(null);
  const mapContainerId = `radar-map-display-${Math.random().toString(36).substring(2, 15)}`;
  const autocompleteContainerId = `radar-autocomplete-${Math.random().toString(36).substring(2, 15)}`;
  
  const [initialCoords, setInitialCoords] = useState(null); // Start with null to wait for geolocation or default
  const [mapInitialized, setMapInitialized] = useState(false);
  const [autocompleteInitialized, setAutocompleteInitialized] = useState(false);
  const [sdkInitialized, setSdkInitialized] = useState(false);

  // Function to update map and marker
  const updateMapAndMarker = (longitude, latitude, addressLabel = 'Selected Location') => {
    if (showMap && mapRef.current) {
      const coords = [parseFloat(longitude), parseFloat(latitude)];
      if (!markerRef.current) {
        try {
          const marker = Radar.ui.marker({ text: addressLabel })
            .setLngLat(coords)
            .addTo(mapRef.current);
          markerRef.current = marker;
          mapRef.current.flyTo({ center: coords, zoom: 15 });
        } catch (markerError) { console.error("Error creating/adding marker:", markerError); }
      } else {
        try {
          markerRef.current.setLngLat(coords).setText(addressLabel);
          mapRef.current.flyTo({ center: coords, zoom: 15 });
        } catch (updateError) { console.error("Error updating marker/map view:", updateError); }
      }
    }
  };

  useEffect(() => {
    // Initialize Radar SDK once
    if (!sdkInitialized && RADAR_PUBLISHABLE_KEY && RADAR_PUBLISHABLE_KEY !== 'YOUR_RADAR_PUBLISHABLE_KEY_HERE') {
      try {
        Radar.initialize(RADAR_PUBLISHABLE_KEY);
        setSdkInitialized(true);
        console.log("Radar SDK Initialized");
      } catch (initError) {
        console.error("Error initializing Radar SDK:", initError);
      }
    } else if (!RADAR_PUBLISHABLE_KEY || RADAR_PUBLISHABLE_KEY === 'YOUR_RADAR_PUBLISHABLE_KEY_HERE') {
      console.error('RadarMapDisplay: API key is missing for SDK initialization.');
    }

    // Attempt to get user's current location using browser Geolocation API
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Browser geolocation success:', position.coords);
          setInitialCoords({ 
            longitude: position.coords.longitude, 
            latitude: position.coords.latitude 
          });
        },
        (error) => {
          console.warn(`Browser geolocation error: ${error.message}. Falling back to default coordinates.`);
          setInitialCoords(DEFAULT_COORDS);
        }
      );
    } else {
      console.warn('Browser does not support geolocation. Falling back to default coordinates.');
      setInitialCoords(DEFAULT_COORDS);
    }
  }, [sdkInitialized]); // Re-run if sdkInitialized changes, but primarily for initial setup

  useEffect(() => {
    if (!sdkInitialized || !initialCoords) {
        // Wait for SDK to be initialized and initialCoords to be determined (either from geolocation or default)
        return;
    }

    const mapContainer = document.getElementById(mapContainerId);
    const autocompleteContainer = document.getElementById(autocompleteContainerId);

    if (!autocompleteContainer || (showMap && !mapContainer)) {
        return; 
    }

    if (showMap && mapContainer && !mapInitialized) {
      console.log('Initializing map with coords:', initialCoords);
      try {
        const map = Radar.ui.map({
          container: mapContainerId,
          style: 'radar-default-v1',
          center: [initialCoords.longitude, initialCoords.latitude],
          zoom: 12,
        });
        mapRef.current = map;
        setMapInitialized(true);
        // Check if the initialCoords are different from DEFAULT_COORDS to decide marker text
        const isDefault = initialCoords.latitude === DEFAULT_COORDS.latitude && initialCoords.longitude === DEFAULT_COORDS.longitude;
        updateMapAndMarker(initialCoords.longitude, initialCoords.latitude, isDefault ? "Default Location" : "Your Current Location (Approx.)");
      } catch (mapError) {
        console.error("Error creating Radar map:", mapError);
      }
    }

    if (autocompleteContainer && !autocompleteInitialized) {
      console.log('Initializing autocomplete...');
      try {
        autocompleteRef.current = Radar.ui.autocomplete({
          container: autocompleteContainerId,
          responsive: true,
          debounceMS: 200,
          minCharacters: 3,
          placeholder: "Start typing restaurant address...",
          onSelection: (address) => {
            console.log('Selected address via autocomplete:', address);
            const { latitude, longitude } = address;
            const isValidCoords = longitude != null && latitude != null && longitude !== '' && latitude !== '';

            if (isValidCoords) {
                updateMapAndMarker(longitude, latitude, address.addressLabel || address.formattedAddress);
            }
            
            if (typeof onAddressSelect === 'function') {
              onAddressSelect({
                addressLine: address.addressLabel || `${address.number || ''} ${address.street || ''}`.trim(),
                lat: latitude?.toString() ?? '',
                lng: longitude?.toString() ?? '',
                province: address.state || address.county || '',
                fullAddress: address.formattedAddress || '',
              });
            } else {
              console.warn('onAddressSelect prop is not a function');
            }
          },
          onError: (err) => {
            console.error("Radar Autocomplete Error:", err);
          }
        });
        setAutocompleteInitialized(true);
      } catch (autocompleteError) {
        console.error("Error creating Radar autocomplete:", autocompleteError);
      }
    }
  }, [initialCoords, showMap, onAddressSelect, mapInitialized, autocompleteInitialized, sdkInitialized, mapContainerId, autocompleteContainerId]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (removeError) {
          console.error("Error removing Radar map:", removeError);
        }
        mapRef.current = null;
        markerRef.current = null;
      }
      autocompleteRef.current = null; 
      setMapInitialized(false); 
      setAutocompleteInitialized(false);
      // setSdkInitialized(false); // SDK init is global, probably don't reset this flag on unmount
    };
  }, []);

  if (!initialCoords && !sdkInitialized) {
      // Still waiting for SDK init and initial location attempt
      return <p>Loading map and location services...</p>;
  }

  return (
    <div>
      <div className="form-control w-full mb-4">
        <label className="label">
          <span className="label-text">Search Address *</span>
        </label>
        <input
          type="text"
          id={autocompleteContainerId} 
          className="input input-bordered w-full"
          placeholder="Start typing restaurant address..."
        />
      </div>
      
      {showMap && (
        <div className="mt-2">
          <h3 className="text-lg font-semibold mb-2">Selected Location on Map</h3>
          <div
            id={mapContainerId} 
            style={{ height: '350px', width: '100%', borderRadius: '8px' }} 
          ></div>
        </div>
      )}
    </div>
  );
};



export default RadarMapDisplay; 