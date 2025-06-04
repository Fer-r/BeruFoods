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
    <div className="border rounded-lg p-4 shadow-sm mb-4 flex flex-col sm:flex-row items-center">
      {item.imageUrl && (
        <img 
          src={item.imageUrl} 
          alt={item.name} 
          className="w-24 h-24 object-cover rounded-md mr-0 sm:mr-4 mb-4 sm:mb-0 flex-shrink-0"
        />
      )}
      <div className="flex-1 mb-4 sm:mb-0">
        <h3 className="text-lg font-semibold">{item.name}</h3>
        <p className="text-md text-gray-600">€{parseFloat(item.price).toFixed(2)} each</p>
      </div>
      <div className="flex items-center mb-4 sm:mb-0 sm:mx-4">
        <button onClick={handleDecreaseQuantity} className="btn btn-sm btn-ghost">
          <FaMinus />
        </button>
        <span className="mx-2 text-lg">{item.quantity}</span>
        <button onClick={handleIncreaseQuantity} className="btn btn-sm btn-ghost">
          <FaPlus />
        </button>
      </div>
      <div className="flex-none sm:text-right mb-4 sm:mb-0 sm:mx-4">
        <p className="text-lg font-bold">€{(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
      </div>
      <div className="flex-none">
        <button onClick={handleRemoveItem} className="btn btn-sm btn-error btn-outline">
          <FaTrash className="mr-1" /> Remove
        </button>
      </div>
    </div>
  );
};

export default CartItemCard;