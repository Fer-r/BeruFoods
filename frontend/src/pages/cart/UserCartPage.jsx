import { useState } from 'react';
import { useCart } from '../../context/CartContext.jsx';
import CartItemCard from '../../features/cart/components/CartItemCard.jsx';
import { Link, useNavigate } from 'react-router';
import { fetchDataFromEndpoint } from '../../services/useApiService';
import AlertMessage from '../../components/common/AlertMessage.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * @component UserCartPage
 * Displays the user's shopping cart. It allows users to review items in their cart,
 * see the total price, and proceed to checkout. Cart item modifications (like quantity changes
 * or removal) are handled by the `CartItemCard` components rendered within this page.
 *
 * This component utilizes the `useCart` context to access and manage cart items and
 * the `useAuth` context to get authentication details (like the token for API calls).
 *
 * It manages local state for:
 * - `error` {string | null}: Stores error messages related to checkout processing.
 * - `loading` {boolean}: Indicates if the checkout process is currently in progress.
 *
 * @returns {JSX.Element} The rendered user cart page.
 */
const UserCartPage = () => {
  const { cartItems, getCartTotalPrice, clearCart, getRestaurantIdInCart } = useCart();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const totalPrice = getCartTotalPrice();
  const restaurantId = getRestaurantIdInCart();

  /**
   * Handles the "Proceed to Checkout" action.
   * It assembles the order data from the cart items, including article IDs and quantities,
   * and submits this data to the backend API endpoint `/orders` using a POST request
   * via the `fetchDataFromEndpoint` service.
   *
   * On successful order creation, it clears the cart and navigates the user to the
   * newly created order's detail page.
   * If an error occurs during the API call or if the order data is invalid,
   * it sets an error message in the local `error` state.
   * The `loading` state is managed to provide user feedback during the API call.
   *
   * @async
   */
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
      <div className="container mx-auto p-4 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-base-100 p-8 rounded-lg shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-base-content opacity-30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-lg mb-4">Your cart is currently empty.</p>
          <Link to="/" className="btn btn-primary">Start Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Shopping Cart</h1>
      {error && <AlertMessage type="error" message={error} className="mb-6" />}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map(item => (
            <CartItemCard key={`${item.restaurantId}-${item.id}`} item={item} />
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-base-200 p-6 rounded-lg shadow-lg sticky top-24">
            <h2 className="text-xl font-semibold mb-6 pb-2 border-b border-base-300">Order Summary</h2>
            
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
            
            <div className="space-y-3">
              <button 
                onClick={handleProceedToCheckout} 
                className="btn btn-primary btn-block shadow-md" 
                disabled={loading || cartItems.length === 0}
              >
                {loading ? (
                  <><span className="loading loading-spinner"></span></>
                ) : (
                  'Proceed to Checkout'
                )}
              </button>
              
              <button 
                onClick={() => clearCart()} 
                className="btn btn-outline btn-block"
                disabled={loading || cartItems.length === 0}
              >
                 Clear Cart
              </button>
              
              <Link to="/" className="btn btn-ghost btn-block">
                 Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCartPage;