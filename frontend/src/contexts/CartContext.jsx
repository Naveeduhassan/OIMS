import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('store_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('store_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        // Prevent exceeding stock
        if (existing.qty + quantity > product.stock) return prev;
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, qty: item.qty + quantity } : item
        );
      }
      return [...prev, { product, qty: quantity }];
    });
    setCartOpen(true);
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, qty: Math.max(1, Math.min(item.qty + delta, item.product.stock)) }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + parseFloat(item.product.price) * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        cartTotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartOpen,
        setCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
