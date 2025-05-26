import { useState } from 'react';
import { useCart } from '../../context/CartContext.jsx';
import CartItemCard from '../../features/cart/components/CartItemCard.jsx';
import { Link, useNavigate } from 'react-router';
import { fetchDataFromEndpoint } from '../../services/useApiService';
import AlertMessage from '../../components/common/AlertMessage.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const UserCartPage = () => {
  const { cartItems, getCartTotalPrice, clearCart, getRestaurantIdInCart } = useCart();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const totalPrice = getCartTotalPrice();
  const restaurantId = getRestaurantIdInCart();

  const handleProceedToCheckout = async () => {
    if (!restaurantId || cartItems.length === 0) {
      setError("Cart is empty or restaurant information is missing.");
      return;
    }

    const orderItems = cartItems.map(item => ({
      articleId: item.id,
      quantity: item.quantity,
    }));

    setLoading(true);
    setError(null);

    try {
      const orderData = {
        restaurantId: restaurantId,
        items: orderItems,
      };
      
      const result = await fetchDataFromEndpoint('/orders', 'POST', orderData, true, token);
      
      if (result && result.id) { // Assuming backend returns the created order with an id
        clearCart();
        navigate(`/user/orders/${result.id}`); // Navigate to the new order details page
      } else {
        throw new Error(result?.message || 'Failed to create order. No ID returned.');
      }
    } catch (err) {
      console.error("Order creation failed:", err);
      setError(err.details?.message || err.message || 'Could not create the order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Shopping Cart</h1>
        <p className="text-lg mb-4">Your cart is currently empty.</p>
        <Link to="/" className="btn btn-primary">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>
      {error && <AlertMessage type="error" message={error} className="mb-4" />}
      
      <div className="mb-6">
        {cartItems.map(item => (
          <CartItemCard key={`${item.restaurantId}-${item.id}`} item={item} />
        ))}
      </div>

      <div className="bg-base-200 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
        <div className="flex justify-between mb-2">
          <span className="text-lg">Subtotal:</span>
          <span className="text-lg font-bold">€{totalPrice.toFixed(2)}</span>
        </div>
        {/* Add more details like shipping, taxes if applicable later */}
        <div className="divider"></div>
        <div className="flex justify-between mb-4">
          <span className="text-xl font-bold">Total:</span>
          <span className="text-xl font-bold text-primary">€{totalPrice.toFixed(2)}</span>
        </div>
        <button 
          onClick={handleProceedToCheckout} 
          className="btn btn-primary btn-block" 
          disabled={loading || cartItems.length === 0}
        >
          {loading ? <span className="loading loading-spinner"></span> : 'Proceed to Checkout'}
        </button>
        <button 
          onClick={() => clearCart()} 
          className="btn btn-ghost btn-block mt-2"
          disabled={loading || cartItems.length === 0}
        >
          Clear Cart
        </button>
      </div>
    </div>
  );
};

export default UserCartPage; 