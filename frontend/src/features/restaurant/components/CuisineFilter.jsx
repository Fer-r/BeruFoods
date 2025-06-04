/**
 * CuisineFilter displays a set of buttons for filtering restaurants by cuisine type.
 * It shows all available cuisine options and highlights the currently selected ones.
 * The component handles loading and error states for cuisine data.
 * 
 * @param {Object} props - Component props
 * @param {Array} props.cuisineOptions - Array of cuisine objects with id and name properties
 * @param {Array<number>} props.selectedFoodTypeIds - Array of currently selected cuisine IDs
 * @param {Function} props.onCuisineFilterChange - Callback function when a cuisine filter is toggled
 * @param {boolean} props.isLoadingCuisines - Whether cuisine data is currently loading
 * @param {string|null} props.errorCuisines - Error message if cuisine data failed to load
 * @returns {JSX.Element} The rendered cuisine filter component
 */
const CuisineFilter = ({
  cuisineOptions,
  selectedFoodTypeIds,
  onCuisineFilterChange,
  isLoadingCuisines,
  errorCuisines,
}) => {
  if (isLoadingCuisines) return <p>Loading cuisines...</p>;
  if (errorCuisines) return <p className="text-error">Could not load cuisines: {errorCuisines}</p>;
  if (!cuisineOptions || cuisineOptions.length === 0) {
    return <p className="text-sm text-base-content opacity-70 py-2">No cuisines available.</p>;
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold mb-4">Pick a cuisine</h2>
      <div className="flex flex-wrap gap-2">
        {cuisineOptions.map((cuisine) => (
          <button 
            key={cuisine.id} 
            className={`btn btn-sm rounded-lg ${selectedFoodTypeIds.includes(cuisine.id) ? 'btn-primary' : 'bg-base-200 border-none hover:bg-base-300'}`}
            onClick={() => onCuisineFilterChange(cuisine.id)}
          >
            {cuisine.name}
          </button>
        ))}
      </div>
    </div>
  );
};



export default CuisineFilter;