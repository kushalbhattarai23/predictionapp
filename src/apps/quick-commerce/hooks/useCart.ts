import { useState, useCallback } from 'react';

export interface CartItem {
  inventory_item_id: string;
  name: string;
  price: number;
  discount_price: number | null;
  quantity: number;
  max_quantity: number;
  stock: number;
  unit: string;
  image?: string;
}

export const useCart = () => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existing = prev.find(i => i.inventory_item_id === item.inventory_item_id);
      if (existing) {
        return prev.map(i =>
          i.inventory_item_id === item.inventory_item_id
            ? { ...i, quantity: Math.min(i.quantity + 1, i.max_quantity, i.stock) }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.inventory_item_id !== itemId));
    } else {
      setItems(prev =>
        prev.map(i =>
          i.inventory_item_id === itemId
            ? { ...i, quantity: Math.min(quantity, i.max_quantity, i.stock) }
            : i
        )
      );
    }
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(i => i.inventory_item_id !== itemId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const total = items.reduce((sum, item) => {
    const price = item.discount_price ?? item.price;
    return sum + price * item.quantity;
  }, 0);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return { items, addItem, updateQuantity, removeItem, clearCart, total, itemCount };
};
