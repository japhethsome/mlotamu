import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext({});

const STORAGE_KEY = "cafeteria-cart";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (item) => {
    setItems((current) => {
      const existing = current.find((entry) => entry.id === item.id);
      if (existing) {
        return current.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                quantity: entry.quantity + 1,
                notes: item.notes || entry.notes,
              }
            : entry,
        );
      }
      return [
        ...current,
        { ...item, quantity: item.quantity || 1, notes: item.notes || "" },
      ];
    });
  };

  const updateQuantity = (id, amount) => {
    setItems((current) =>
      current
        .map((entry) =>
          entry.id === id
            ? { ...entry, quantity: Math.max(0, entry.quantity + amount) }
            : entry,
        )
        .filter((entry) => entry.quantity > 0),
    );
  };

  const removeItem = (id) => {
    setItems((current) => current.filter((entry) => entry.id !== id));
  };

  const clearCart = () => setItems([]);

  const value = useMemo(
    () => ({ items, addItem, updateQuantity, removeItem, clearCart }),
    [items],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
