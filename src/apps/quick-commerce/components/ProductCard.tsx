import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Package } from 'lucide-react';
import { SellableItem } from '../hooks/useSellableItems';

interface ProductCardProps {
  item: SellableItem;
  onAddToCart: (item: SellableItem) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ item, onAddToCart }) => {
  const hasDiscount = item.discount_price && item.discount_price < item.selling_price;
  const displayPrice = hasDiscount ? item.discount_price! : item.selling_price;
  const isLowStock = item.quantity <= 5;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
        {item.product_images && item.product_images.length > 0 ? (
          <img
            src={item.product_images[0]}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <Package className="w-12 h-12 text-muted-foreground" />
        )}
        {hasDiscount && (
          <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground">
            {Math.round(((item.selling_price - item.discount_price!) / item.selling_price) * 100)}% OFF
          </Badge>
        )}
        {isLowStock && (
          <Badge variant="outline" className="absolute top-2 right-2 bg-background/80">
            Only {item.quantity} left
          </Badge>
        )}
      </div>
      <CardContent className="p-4 space-y-2">
        <h3 className="font-semibold text-sm line-clamp-2">{item.name}</h3>
        {item.product_tags && item.product_tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {item.product_tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">₹{displayPrice}</span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">₹{item.selling_price}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {item.quantity} {item.unit} in stock
        </p>
        <Button
          size="sm"
          className="w-full"
          onClick={() => onAddToCart(item)}
          disabled={item.quantity <= 0}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Add to Cart
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
