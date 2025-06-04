import GoogleMapDisplay from '../../../components/common/GoogleMapDisplay';
import { FaSearch } from 'react-icons/fa';

/**
 * FilterControls provides a set of input controls for filtering restaurant search results.
 * It includes a text search field, location search with Google Maps integration,
 * an "Open Now" toggle, and a radius selector for location-based searches.
 * 
 * @param {Object} props - Component props
 * @param {string} props.searchText - Current value of the text search input
 * @param {Function} props.onSearchChange - Callback function when the search text changes
 * @param {React.RefObject} props.searchInputRef - Ref object for the search input element
 * @param {string} props.locationInputText - Current value of the location input
 * @param {Function} props.onLocationSelect - Callback function when a location is selected
 * @param {boolean} props.isOpenNow - Whether the "Open Now" filter is active
 * @param {Function} props.onIsOpenNowChange - Callback function when the "Open Now" toggle changes
 * @param {number} props.selectedRadius - Currently selected search radius in meters
 * @param {Function} props.onRadiusChange - Callback function when the radius selection changes
 * @param {Array<{value: number, label: string}>} props.radiusOptions - Array of available radius options
 * @returns {JSX.Element} The rendered filter controls component
 */
const FilterControls = ({
  searchText,
  onSearchChange,
  searchInputRef,
  locationInputText,
  onLocationSelect,
  isOpenNow,
  onIsOpenNowChange,
  selectedRadius,
  onRadiusChange,
  radiusOptions,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-19 gap-4 justify-around items-end mb-8">
      {/* Name Search Bar */}
      <div className="col-span-1 sm:col-span-2 md:col-span-8">
        <label htmlFor="restaurantSearch" className="label">
          <span className="label-text font-medium">What are you hungry for?</span>
        </label>
        <div className="relative">
          <input
            id="restaurantSearch"
            ref={searchInputRef}
            type="text"
            placeholder="Restaurant name or keyword..."
            className="input input-bordered w-full pl-12 bg-base-200 focus:outline-none focus:border-primary shadow-inner"
            value={searchText}
            onChange={onSearchChange}
          />
          <span className="absolute inset-y-0 left-0 flex items-center pl-4">
            <FaSearch className="h-6 w-6 text-base-content opacity-50" />
          </span>
        </div>
      </div>

      {/* Location Search Bar */}
      <div className="col-span-1 sm:col-span-1 md:col-span-4">
        <div className="location-search-container">
          <GoogleMapDisplay 
            onAddressSelect={onLocationSelect} 
            showMap={false}
            placeholder="City or Address..."
            defaultValue={locationInputText}
          />
        </div>
      </div>

      {/* Open Now Filter */}
      <div className="form-control col-span-1 sm:col-span-1 md:col-span-3">
        <label className="label pb-1">
          <span className="label-text font-medium">Status</span>
        </label>
        <div className="cursor-pointer rounded-lg bg-base-200 shadow-inner flex items-center justify-start gap-3 h-12 px-4" onClick={() => onIsOpenNowChange(!isOpenNow)}>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={isOpenNow}
            onChange={() => onIsOpenNowChange(!isOpenNow)}
          />
          <span className="label-text">Open now</span>
        </div>
      </div>

      {/* Distance Filter */}
      <div className="form-control col-span-1 sm:col-span-1 md:col-span-4">
        <label htmlFor="radiusSelect" className="label pb-1">
          <span className="label-text font-medium">Distance</span>
        </label>
        <select 
          id="radiusSelect"
          className="select select-bordered w-full bg-base-200 shadow-inner h-12"
          value={selectedRadius}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
        >
          {radiusOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default FilterControls;