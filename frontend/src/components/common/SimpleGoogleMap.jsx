import { useEffect, useRef, useState } from 'react';
import { GOOGLE_MAPS_CONFIG, ERROR_MESSAGES } from '../../utils/googleMapsConstants';
import { isGoogleMapsLoaded } from '../../utils/googleMapsHelpers';

/**
 * SimpleGoogleMap renders a Google Map focused on a given latitude and longitude.
 * It can display a single marker at the map center (derived from latitude/longitude props),
 * multiple custom markers passed via the `markers` prop, and an optional info window
 * when a marker is clicked (if `showInfoWindow` is true).
 * The component handles map initialization, loading states, error states (e.g., if the Google Maps API fails to load),
 * and marker management.
 *
 * @param {object} props - The component's props.
 * @param {number} props.latitude - The latitude for the map center and the primary marker.
 * @param {number} props.longitude - The longitude for the map center and the primary marker.
 * @param {string} [props.title='Selected Location'] - Title for the primary marker and its info window.
 * @param {number} [props.zoom=GOOGLE_MAPS_CONFIG.DEFAULT_ZOOM] - The initial zoom level of the map.
 * @param {string | number} [props.height=GOOGLE_MAPS_CONFIG.DEFAULT_HEIGHT] - The height of the map container (e.g., '400px' or 400).
 * @param {string} [props.className=''] - Additional CSS classes for the main container div.
 * @param {boolean} [props.showInfoWindow=false] - Whether to show an info window when the primary marker (or any marker if not customized) is clicked.
 * @param {function} [props.onMarkerClick] - Optional callback function triggered when any marker is clicked. It receives the marker data (position, title).
 * @param {Array<{position: {lat: number, lng: number}, title?: string}>} [props.markers=[]] - An array of additional marker objects to display on the map. Each object should have a `position` {lat, lng} and can optionally include a `title`.
 */
const SimpleGoogleMap = ({ 
  latitude, 
  longitude, 
  title = 'Selected Location',
  zoom = GOOGLE_MAPS_CONFIG.DEFAULT_ZOOM,
  height = GOOGLE_MAPS_CONFIG.DEFAULT_HEIGHT,
  className = '',
  showInfoWindow = false,
  onMarkerClick,
  markers = []
}) => {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  const center = {
    lat: latitude ? parseFloat(latitude) : GOOGLE_MAPS_CONFIG.DEFAULT_CENTER.lat,
    lng: longitude ? parseFloat(longitude) : GOOGLE_MAPS_CONFIG.DEFAULT_CENTER.lng
  };

  const clearMarkers = () => {
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];
  };

  const createInfoWindowContent = (markerTitle, position) => {
    return `
      <div style="padding: 8px; font-family: system-ui;">
        <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600;">
          ${markerTitle}
        </h3>
        <p style="margin: 0; font-size: 12px; color: #666;">
          ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}
        </p>
      </div>
    `;
  };

  const createMarker = (position, markerTitle, markerData) => {
    if (!mapRef.current) return null;

    const marker = new window.google.maps.Marker({
      position: position,
      map: mapRef.current,
      title: markerTitle,
      animation: window.google.maps.Animation.DROP
    });

    marker.addListener('click', () => {
      if (onMarkerClick) {
        onMarkerClick(markerData || { position, title: markerTitle });
      }

      if (showInfoWindow) {
        if (infoWindowRef.current) {
          infoWindowRef.current.close();
        }

        infoWindowRef.current = new window.google.maps.InfoWindow({
          content: createInfoWindowContent(markerTitle, position)
        });

        infoWindowRef.current.open(mapRef.current, marker);
      }
    });

    return marker;
  };

  const createMapMarkers = () => {
    clearMarkers();
    
    if (latitude && longitude) {
      const mainMarker = createMarker(center, title, { position: center, title });
      if (mainMarker) {
        markersRef.current.push(mainMarker);
      }
    }

    markers.forEach((marker, index) => {
      const additionalMarker = createMarker(
        marker.position, 
        marker.title || `Marker ${index + 1}`,
        marker
      );
      if (additionalMarker) {
        markersRef.current.push(additionalMarker);
      }
    });
  };

  useEffect(() => {
    if (mapRef.current && latitude && longitude) {
      const newCenter = {
        lat: parseFloat(latitude),
        lng: parseFloat(longitude)
      };
      
      mapRef.current.setCenter(newCenter);
      createMapMarkers();
    }
  }, [latitude, longitude, title, markers]);

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    let retryTimeoutId = null;

    const initializeMap = () => {
      if (!mapContainerRef.current) {
        if (isMounted) {
          setError(ERROR_MESSAGES.MAP_CONTAINER_NOT_FOUND);
        }
        return;
      }

      if (!isGoogleMapsLoaded()) {
        retryCount++;
        if (retryCount <= GOOGLE_MAPS_CONFIG.MAX_RETRIES) {
          retryTimeoutId = setTimeout(() => {
            if (isMounted) initializeMap(); 
          }, GOOGLE_MAPS_CONFIG.RETRY_INTERVAL);
        } else {
          if (isMounted) {
            setError(ERROR_MESSAGES.API_NOT_LOADED);
          }
        }
        return;
      }

      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId);
      }

      try {
        const map = new window.google.maps.Map(mapContainerRef.current, {
          center: center,
          zoom: zoom,
          mapTypeControl: false,
          streetViewControl: false,
          gestureHandling: 'greedy',
          cameraControl: false,
        });

        mapRef.current = map;
        createMapMarkers();

        if (isMounted) {
          setIsLoaded(true);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || ERROR_MESSAGES.API_NOT_LOADED);
          setIsLoaded(false);
        }
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId);
      }
      clearMarkers();
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
        infoWindowRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      className={`relative bg-gray-50 border rounded-lg ${className}`}
      style={{ height, width: '100%' }}
    >
      <div
        ref={mapContainerRef}
        style={{ height: '100%', width: '100%' }}
      />

      {!isLoaded && !error && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-75"
          style={{ zIndex: 10 }}
        >
          <span className="loading loading-spinner loading-lg mb-2" aria-label="Loading map"></span>
          <p className="text-gray-600">Loading map...</p>
        </div>
      )}

      {error && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center bg-error/10 text-error p-4"
          style={{ zIndex: 10 }}
          role="alert"
        >
          <p className="font-semibold">Map unavailable</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}
    </div>
  );
};

export default SimpleGoogleMap;