import GoogleMapDisplay from '../../../components/common/GoogleMapDisplay';

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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end mb-8">
      {/* Name Search Bar */}
      <div className="md:col-span-2">
        <label htmlFor="restaurantSearch" className="label">
          <span className="label-text">What are you hungry for?</span>
        </label>
        <div className="relative">
          <input
            id="restaurantSearch"
            ref={searchInputRef}
            type="text"
            placeholder="Restaurant name or keyword..."
            className="input input-bordered w-full p-4 pl-12 bg-base-200 text-lg focus:outline-none focus:border-primary"
            value={searchText}
            onChange={onSearchChange}
          />
          <span className="absolute inset-y-0 left-0 flex items-center pl-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-base-content opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
        </div>
      </div>

      {/* Location Search Bar */}
      <div className="md:col-span-1">
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
      <div className="form-control md:col-span-1">
        <label className="label pb-1">
          <span className="label-text font-medium">Status</span>
        </label>
        <label className="label cursor-pointer py-2 justify-start gap-3 rounded-lg p-3 h-full items-center">
          <input 
            type="checkbox" 
            className="toggle toggle-primary"
            checked={isOpenNow} 
            onChange={() => onIsOpenNowChange(!isOpenNow)} 
          />
          <span className="label-text">Open now</span> 
        </label>
      </div>

      {/* Distance Filter */}
      <div className="form-control md:col-span-1">
        <label htmlFor="radiusSelect" className="label pb-1">
          <span className="label-text font-medium">Distance</span>
        </label>
        <select 
          id="radiusSelect"
          className="select select-bordered w-full bg-base-200 shadow-sm h-full p-3"
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