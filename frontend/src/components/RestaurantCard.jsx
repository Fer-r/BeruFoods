const RestaurantCard = ({ restaurant }) => {
  if (!restaurant) return null;
  return (
    <div className="card card-compact bg-base-100 shadow-md hover:shadow-lg transition-shadow group w-full h-full flex flex-col">
      <figure className="relative w-full h-48">
        <img
          src={restaurant.imageUrl || `https://picsum.photos/seed/${restaurant.id}/400/200`}
          alt={restaurant.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:opacity-90 transition-opacity"
        />
      </figure>
      <div className="card-body py-3 px-4 flex-grow">
        <h3 className="card-title text-lg font-semibold truncate">{restaurant.name}</h3>
        <p className="text-base text-base-content opacity-80 truncate">
          {restaurant.foodTypes && restaurant.foodTypes.length > 0
            ? restaurant.foodTypes.map(ft => ft.name).join(', ')
            : 'Cuisine not specified'}
        </p>
        <p className="text-sm text-base-content opacity-70">
          {restaurant.openingTime && restaurant.closingTime
            ? `Open: ${restaurant.openingTime} - ${restaurant.closingTime}`
            : 'Hours not specified'}
        </p>
      </div>
    </div>
  );
};


export default RestaurantCard; 