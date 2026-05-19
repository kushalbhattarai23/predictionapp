import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ShoppingCart, Package, Minus, Plus } from 'lucide-react';
import { SellableItem } from '../hooks/useSellableItems';
import { getGlobalCart } from './StorePage';
import { toast } from 'sonner';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);

  const { data: item, isLoading } = useQuery({
    queryKey: ['product-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items_tracker')
        .select('*, category:inventory_categories(*), store:inventory_stores(*)')
        .eq('id', id!)
        .eq('is_sellable', true)
        .single();
      if (error) throw error;
      return data as unknown as SellableItem;
    },
    enabled: !!user && !!id,
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  if (!item) return <div className="text-center py-12 text-muted-foreground">Product not found</div>;

  const hasDiscount = item.discount_price && item.discount_price < item.selling_price;
  const displayPrice = hasDiscount ? item.discount_price! : item.selling_price;

  const handleAddToCart = () => {
    const cart = getGlobalCart();
    if (cart) {
      for (let i = 0; i < quantity; i++) {
        cart.addItem({
          inventory_item_id: item.id,
          name: item.name,
          price: item.selling_price,
          discount_price: item.discount_price,
          max_quantity: item.max_order_quantity,
          stock: item.quantity,
          unit: item.unit,
          image: item.product_images?.[0],
        });
      }
      toast.success(`Added ${quantity}x ${item.name} to cart`);
    } else {
      toast.error('Please visit the store page first');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link to="/store" className="inline-flex items-center text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Store
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
          {item.product_images && item.product_images.length > 0 ? (
            <img src={item.product_images[0]} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <Package className="w-24 h-24 text-muted-foreground" />
          )}
        </div>

        {/* Details */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">{item.name}</h1>

          {item.category && (
            <Badge variant="secondary">{item.category.name}</Badge>
          )}

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">₹{displayPrice}</span>
            {hasDiscount && (
              <span className="text-xl text-muted-foreground line-through">₹{item.selling_price}</span>
            )}
            {hasDiscount && (
              <Badge className="bg-destructive text-destructive-foreground">
                {Math.round(((item.selling_price - item.discount_price!) / item.selling_price) * 100)}% OFF
              </Badge>
            )}
          </div>

          <p className="text-muted-foreground">{item.product_description || 'No description available.'}</p>

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Stock</span>
                <span className="font-medium">{item.quantity} {item.unit}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Max per order</span>
                <span className="font-medium">{item.max_order_quantity}</span>
              </div>
            </CardContent>
          </Card>

          {item.product_tags && item.product_tags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {item.product_tags.map(tag => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
          )}

          {/* Quantity + Add to Cart */}
          <div className="flex items-center gap-4">
            <div className="flex items-center border rounded-md">
              <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                <Minus className="w-4 h-4" />
              </Button>
              <span className="px-4 font-medium">{quantity}</span>
              <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.min(item.max_order_quantity, item.quantity, quantity + 1))}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <Button className="flex-1" onClick={handleAddToCart} disabled={item.quantity <= 0}>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart • ₹{displayPrice * quantity}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
