import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from '../utils/constants';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const localData = localStorage.getItem(STORAGE_KEYS.CART_ITEMS);
    return localData ? JSON.parse(localData) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CART_ITEMS, JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = useCallback((article, quantity = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === article.id && item.restaurantId === article.restaurantId);
      if (existingItem) {


        if (prevItems.length > 0 && prevItems[0].restaurantId !== article.restaurantId) {

          return [{ ...article, quantity }]; 
        }
        return prevItems.map(item =>
          item.id === article.id && item.restaurantId === article.restaurantId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      // If cart is empty or item is from the same restaurant
      if (prevItems.length === 0 || prevItems[0].restaurantId === article.restaurantId) {
        return [...prevItems, { ...article, quantity }];
      } else {
         // alert("You can only order from one restaurant at a time. Starting a new cart.");
         // This case implies clearing the cart and adding the new item.
         return [{ ...article, quantity }];
      }
    });
  }, []);

  const removeFromCart = useCallback((articleId, restaurantId) => {
    setCartItems(prevItems => prevItems.filter(item => !(item.id === articleId && item.restaurantId === restaurantId)));
  }, []);

  const updateQuantity = useCallback((articleId, restaurantId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(articleId, restaurantId);
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === articleId && item.restaurantId === restaurantId ? { ...item, quantity } : item
        )
      );
    }
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const getCartTotalItems = useCallback(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const getCartTotalPrice = useCallback(() => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cartItems]);

  const getRestaurantIdInCart = useCallback(() => {
    return cartItems.length > 0 ? cartItems[0].restaurantId : null;
  }, [cartItems]);

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotalItems,
    getCartTotalPrice,
    getRestaurantIdInCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 