import { useNavigate } from 'react-router';

const RestaurantCard = ({ restaurant }) => {
  const navigate = useNavigate();

  if (!restaurant) return null;

  const handleClick = () => {
    navigate(`/restaurants/${restaurant.id}/articles`);
  };

  return (
    <div 
      className="card card-compact bg-base-100 shadow-md hover:shadow-lg transition-shadow group w-full h-full flex flex-col cursor-pointer"
      onClick={handleClick}
    >
      <figure className="relative w-full h-48">
        <img
          src={restaurant.imageUrl || `https://picsum.photos/seed/${restaurant.id}/400/200`}
          alt={restaurant.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:opacity-90 transition-opacity"
        />
      </figure>
      <div className="card-body py-3 px-4 flex-grow">
        <h3 className="card-title text-lg font-semibold truncate">{restaurant.name}</h3>
        <div className="flex flex-wrap gap-1 my-1">
          {restaurant.foodTypes && restaurant.foodTypes.length > 0
            ? restaurant.foodTypes.map(ft => (
                <span key={ft.id || ft.name} className="badge badge-secondary badge-sm">
                  {ft.name}
                </span>
              ))
            : <span className="text-base text-base-content opacity-80 italic">Cuisine not specified</span>}
        </div>
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