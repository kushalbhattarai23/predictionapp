import React, { useState } from 'react';
import { useSellableItems, SellableItem } from '../hooks/useSellableItems';
import ProductCard from '../components/ProductCard';
import { useCart, CartItem } from '../hooks/useCart';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, Zap, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Global cart context - using simple module-level state for now
let globalCart: ReturnType<typeof useCart> | null = null;
export const getGlobalCart = () => globalCart;

const StorePage: React.FC = () => {
  const { items, isLoading } = useSellableItems();
  const cart = useCart();
  globalCart = cart;

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceSort, setPriceSort] = useState<string>('none');

  const categories = Array.from(new Set(items.map(i => i.category?.name).filter(Boolean))) as string[];

  let filtered = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.product_description || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category?.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (priceSort === 'low') {
    filtered.sort((a, b) => (a.discount_price ?? a.selling_price) - (b.discount_price ?? b.selling_price));
  } else if (priceSort === 'high') {
    filtered.sort((a, b) => (b.discount_price ?? b.selling_price) - (a.discount_price ?? a.selling_price));
  }

  const handleAddToCart = (item: SellableItem) => {
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
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="w-8 h-8 text-primary" />
            QuickCommerce Store
          </h1>
          <p className="text-muted-foreground">10-minute delivery • Fresh from inventory</p>
        </div>
        <Link to="/store/cart">
          <Button variant="outline" className="relative">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Cart
            {cart.itemCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {cart.itemCount}
              </Badge>
            )}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priceSort} onValueChange={setPriceSort}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Price" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Default</SelectItem>
            <SelectItem value="low">Price: Low → High</SelectItem>
            <SelectItem value="high">Price: High → Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Category badges */}
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Badge
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedCategory('all')}
          >
            All
          </Badge>
          {categories.map(cat => (
            <Badge
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      )}

      {/* Products Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading products...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No products found. Mark inventory items as sellable to list them here.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(item => (
            <ProductCard key={item.id} item={item} onAddToCart={handleAddToCart} />
          ))}
        </div>
      )}
    </div>
  );
};

export default StorePage;
