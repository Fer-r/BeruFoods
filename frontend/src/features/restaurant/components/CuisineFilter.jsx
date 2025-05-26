
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