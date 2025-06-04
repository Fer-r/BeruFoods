import { useCart } from '../../../context/CartContext';
import { FaPlus, FaMinus, FaTrash } from 'react-icons/fa';

/**
 * CartItemCard displays a single item in the shopping cart.
 * It shows the item's image (if available), name, price, quantity, and total price.
 * The component provides controls to increase/decrease quantity or remove the item entirely.
 * It uses the CartContext to access cart management functions.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.item - The cart item to display
 * @param {number} props.item.id - Unique identifier for the item
 * @param {number} props.item.restaurantId - ID of the restaurant this item belongs to
 * @param {string} props.item.name - Name of the item
 * @param {string|number} props.item.price - Price of a single unit of the item
 * @param {number} props.item.quantity - Quantity of this item in the cart
 * @param {string} [props.item.imageUrl] - Optional URL to the item's image
 * @returns {JSX.Element|null} The rendered cart item card or null if item is invalid
 */
const CartItemCard = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  if (!item) return null;

  const handleIncreaseQuantity = () => {
    updateQuantity(item.id, item.restaurantId, item.quantity + 1);
  };

  const handleDecreaseQuantity = () => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.restaurantId, item.quantity - 1);
    } else {
      // Optionally, confirm before removing if quantity becomes 0, or just remove
      removeFromCart(item.id, item.restaurantId);
    }
  };

  const handleRemoveItem = () => {
    removeFromCart(item.id, item.restaurantId);
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm mb-4 flex flex-col sm:flex-row items-center relative overflow-hidden">
      {/* Add subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-base-100 to-base-200 opacity-50 pointer-events-none"></div>
      
      {item.imageUrl && (
        <div className="w-24 h-24 mr-0 sm:mr-4 mb-4 sm:mb-0 flex-shrink-0 overflow-hidden rounded-md">
          <img 
            src={item.imageUrl} 
            alt={item.name} 
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
          />
        </div>
      )}
      
      <div className="flex-1 mb-4 sm:mb-0 z-10">
        <h3 className="text-lg font-semibold">{item.name}</h3>
        <p className="text-md text-base-content/70">€{parseFloat(item.price).toFixed(2)} each</p>
      </div>
      
      <div className="flex items-center mb-4 sm:mb-0 sm:mx-4 z-10">
        <button 
          onClick={handleDecreaseQuantity} 
          className="btn btn-sm btn-circle btn-ghost hover:bg-base-300"
          aria-label="Decrease quantity"
        >
          <FaMinus />
        </button>
        <span className="mx-3 text-lg font-medium">{item.quantity}</span>
        <button 
          onClick={handleIncreaseQuantity} 
          className="btn btn-sm btn-circle btn-ghost hover:bg-base-300"
          aria-label="Increase quantity"
        >
          <FaPlus />
        </button>
      </div>
      
      <div className="flex-none sm:text-right mb-4 sm:mb-0 sm:mx-4 z-10">
        <p className="text-lg font-bold text-primary">€{(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
      </div>
      
      <div className="flex-none z-10">
        <button 
          onClick={handleRemoveItem} 
          className="btn btn-sm btn-error btn-outline"
          aria-label="Remove item"
        >
          <FaTrash className="mr-1" /> Remove
        </button>
      </div>
    </div>
  );
};

export default CartItemCard;