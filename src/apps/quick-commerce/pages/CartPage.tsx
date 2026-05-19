import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import { getGlobalCart } from './StorePage';

const CartPage: React.FC = () => {
  const cart = getGlobalCart() || useCart();

  if (cart.items.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground" />
        <h2 className="text-xl font-semibold">Your cart is empty</h2>
        <p className="text-muted-foreground">Browse the store and add items to get started</p>
        <Link to="/store">
          <Button>Browse Store</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Link to="/store" className="inline-flex items-center text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4 mr-1" /> Continue Shopping
      </Link>

      <h1 className="text-2xl font-bold">Shopping Cart ({cart.itemCount} items)</h1>

      <div className="space-y-3">
        {cart.items.map(item => {
          const price = item.discount_price ?? item.price;
          return (
            <Card key={item.inventory_item_id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-16 h-16 bg-muted rounded flex items-center justify-center shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded" />
                  ) : (
                    <ShoppingBag className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">₹{price} × {item.quantity}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center border rounded-md">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => cart.updateQuantity(item.inventory_item_id, item.quantity - 1)}>
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="px-2 text-sm font-medium">{item.quantity}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => cart.updateQuantity(item.inventory_item_id, item.quantity + 1)}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <span className="font-semibold w-20 text-right">₹{price * item.quantity}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => cart.removeItem(item.inventory_item_id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">₹{cart.total}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={cart.clearCart}>
          Clear Cart
        </Button>
        <Link to="/store/checkout" className="flex-1">
          <Button className="w-full">
            Proceed to Checkout
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default CartPage;
