import { useState, useEffect, useRef, useCallback } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { GOOGLE_MAPS_CONFIG, PLACE_FIELDS } from '../../utils/googleMapsConstants';
import { 
  extractAddressComponents, 
  formatAddressLine, 
  createAddressData,
  handleGoogleMapsError 
} from '../../utils/googleMapsHelpers';

/**
 * PlaceAutocomplete handles the core logic for fetching and displaying Google Places Autocomplete suggestions,
 * managing user input, keyboard navigation, and selection. This is an internal component used by
 * ModernGooglePlacesAutocomplete.
 *
 * @param {object} props - The component's props.
 * @param {function} props.onPlaceSelect - Callback function triggered when a place is selected from the suggestions. It receives an object containing the address details.
 * @param {string} [props.placeholder='Start typing restaurant address...'] - Placeholder text for the input field.
 * @param {string} [props.defaultValue=''] - The default value for the input field.
 */
const PlaceAutocomplete = ({ onPlaceSelect, placeholder = "Comienza a escribir la dirección del restaurante...", defaultValue = '' }) => {
  const [inputValue, setInputValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState(null);
  const [hasSelectedAddress, setHasSelectedAddress] = useState(false);
  
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const places = useMapsLibrary('places');

  // Update input value when defaultValue changes
  useEffect(() => {
    if (defaultValue && defaultValue !== inputValue) {
      setInputValue(defaultValue);
      setHasSelectedAddress(true); // Mark as selected to prevent auto-suggestions
    }
  }, [defaultValue]);

  const fetchSuggestions = useCallback(async (input) => {
    if (!places || !input.trim() || input.length < GOOGLE_MAPS_CONFIG.MIN_SEARCH_LENGTH) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const request = {
        input: input,
        includedRegionCodes: [GOOGLE_MAPS_CONFIG.COUNTRY_RESTRICTION],
      };

      const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
      
      setSuggestions(suggestions || []);
      // Only show dropdown if input is focused and user is actively typing
      if (document.activeElement === inputRef.current) {
        setShowDropdown((suggestions || []).length > 0);
      }
      setSelectedIndex(-1);
    } catch (err) {
      const errorMessage = handleGoogleMapsError(err);
      setError(errorMessage);
      setSuggestions([]);
      setShowDropdown(false);
    } finally {
      setIsLoading(false);
    }
  }, [places]);

  useEffect(() => {
    if (hasSelectedAddress) {
      return;
    }
    
    const timeoutId = setTimeout(() => {
      fetchSuggestions(inputValue);
    }, GOOGLE_MAPS_CONFIG.DEBOUNCE_DELAY);

    return () => clearTimeout(timeoutId);
  }, [inputValue, fetchSuggestions, hasSelectedAddress]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (hasSelectedAddress) {
      setHasSelectedAddress(false);
    }
  };

  const handleSuggestionSelect = async (suggestion) => {
    try {
      setIsLoading(true);
      
      const { place } = await suggestion.placePrediction.toPlace().fetchFields({
        fields: PLACE_FIELDS
      });

      const lat = place.location.lat();
      const lng = place.location.lng();
      
      const { streetNumber, route, city } = extractAddressComponents(place.addressComponents);
      const addressLine = formatAddressLine(
        streetNumber, 
        route, 
        place.displayName || place.formattedAddress
      );

      setInputValue(place.formattedAddress || place.displayName || '');
      setShowDropdown(false);
      setSuggestions([]);
      setSelectedIndex(-1);
      setHasSelectedAddress(true);

      if (typeof onPlaceSelect === 'function') {
        onPlaceSelect(createAddressData({
          addressLine,
          lat,
          lng,
          city,
          fullAddress: place.formattedAddress || '',
          place
        }));
      }
    } catch (err) {
      const errorMessage = handleGoogleMapsError(err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleInputFocus = () => {
    if (hasSelectedAddress || suggestions.length === 0) {
      return;
    }
    setShowDropdown(true);
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    }, GOOGLE_MAPS_CONFIG.BLUR_DELAY);
  };

  return (
    <div className="autocomplete-container relative w-full">
      <input
        ref={inputRef}
        type="text"
        className="input input-bordered w-full"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        aria-label="Address search"
        aria-expanded={showDropdown}
        aria-haspopup="listbox"
        role="combobox"
      />
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <span className="loading loading-spinner loading-sm\" aria-label="Loading suggestions"></span>
        </div>
      )}

      {showDropdown && (suggestions.length > 0 || error) && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg overflow-y-auto"
          style={{ maxHeight: GOOGLE_MAPS_CONFIG.DROPDOWN_MAX_HEIGHT }}
          role="listbox"
        >
          {error && (
            <div className="p-3 text-error text-sm" role="alert">
              {error}
            </div>
          )}
          
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.placePrediction.placeId}
              className={`p-3 cursor-pointer text-sm border-b border-base-200 last:border-b-0 hover:bg-base-200 ${
                index === selectedIndex ? 'bg-primary/10' : ''
              }`}
              onClick={() => handleSuggestionSelect(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <div className="font-medium text-base-content">
                {suggestion.placePrediction.text.text}
              </div>
              {suggestion.placePrediction.structuredFormat && (
                <div className="text-xs text-base-content/70 mt-1">
                  {suggestion.placePrediction.structuredFormat.secondaryText?.text}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * ModernGooglePlacesAutocomplete is a wrapper component that provides a styled address input field
 * with Google Places Autocomplete functionality. It uses the `PlaceAutocomplete` component internally
 * to handle the search and selection logic.
 *
 * @param {object} props - The component's props.
 * @param {function} props.onAddressSelect - Callback function triggered when an address is selected. It receives an object containing the detailed address information.
 * @param {string} [props.placeholder='Start typing restaurant address...'] - Placeholder text for the address input field.
 * @param {string} [props.defaultValue] - The default value for the address input field.
 */
const ModernGooglePlacesAutocomplete = ({ onAddressSelect, placeholder = "Comienza a escribir la dirección del restaurante...", defaultValue }) => {
  return (
    <div className="form-control w-full">
      <label className="label">
        <span className="label-text">Address</span>
      </label>
      <PlaceAutocomplete 
        onPlaceSelect={onAddressSelect} 
        placeholder={placeholder}
        defaultValue={defaultValue}
      />
    </div>
  );
};

export default ModernGooglePlacesAutocomplete;