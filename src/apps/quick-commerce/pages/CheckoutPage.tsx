import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, CreditCard, Banknote, Zap, AlertCircle } from 'lucide-react';
import DeliveryMap from '../components/DeliveryMap';
import { useStoreLocations, checkDeliveryEligibility } from '../hooks/useStoreLocations';
import { useQCOrders } from '../hooks/useQCOrders';
import { getGlobalCart } from './StorePage';
import { useCart } from '../hooks/useCart';
import { toast } from 'sonner';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const cart = getGlobalCart() || useCart();
  const { storeLocations } = useStoreLocations();
  const { placeOrder } = useQCOrders();

  const [address, setAddress] = useState('');
  const [deliveryLat, setDeliveryLat] = useState<number | null>(null);
  const [deliveryLng, setDeliveryLng] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const primaryStore = storeLocations[0];

  const deliveryCheck = deliveryLat && deliveryLng && primaryStore
    ? checkDeliveryEligibility(primaryStore.lat, primaryStore.lng, deliveryLat, deliveryLng, primaryStore.delivery_radius_km)
    : null;

  const handleLocationSelect = (lat: number, lng: number) => {
    setDeliveryLat(lat);
    setDeliveryLng(lng);
  };

  const handlePlaceOrder = async () => {
    if (!address) return toast.error('Please enter a delivery address');
    if (!deliveryLat || !deliveryLng) return toast.error('Please select delivery location on the map');
    if (deliveryCheck && !deliveryCheck.eligible) return toast.error('Delivery not available for this location');
    if (cart.items.length === 0) return toast.error('Cart is empty');

    try {
      await placeOrder.mutateAsync({
        items: cart.items,
        total: cart.total,
        delivery_address: address,
        delivery_lat: deliveryLat,
        delivery_lng: deliveryLng,
        payment_method: paymentMethod,
        store_location_id: primaryStore?.id,
      });
      cart.clearCart();
      navigate('/store/orders');
    } catch (e) {
      // error handled by hook
    }
  };

  const mapMarkers = [];
  if (primaryStore) {
    mapMarkers.push({ lat: primaryStore.lat, lng: primaryStore.lng, label: primaryStore.name, type: 'store' as const });
  }
  if (deliveryLat && deliveryLng) {
    mapMarkers.push({ lat: deliveryLat, lng: deliveryLng, label: 'Delivery Location', type: 'default' as const });
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Link to="/store/cart" className="inline-flex items-center text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Cart
      </Link>

      <h1 className="text-2xl font-bold">Checkout</h1>

      {/* Delivery Address */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5" /> Delivery Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Address</Label>
            <Input
              placeholder="Enter your delivery address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div>
            <Label>Select location on map</Label>
            <DeliveryMap
              center={primaryStore ? [primaryStore.lat, primaryStore.lng] : undefined}
              markers={mapMarkers}
              onLocationSelect={handleLocationSelect}
              height="300px"
            />
          </div>
          {deliveryCheck && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${deliveryCheck.eligible ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'}`}>
              {deliveryCheck.eligible ? (
                <>
                  <Zap className="w-5 h-5" />
                  <span className="font-medium">Delivery available in ~{deliveryCheck.estimatedTime} minutes</span>
                  <Badge variant="secondary">{deliveryCheck.distance} km</Badge>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Out of delivery range ({deliveryCheck.distance} km)</span>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5" /> Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cash" id="cash" />
              <Label htmlFor="cash" className="flex items-center gap-2">
                <Banknote className="w-4 h-4" /> Cash on Delivery
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="online" id="online" />
              <Label htmlFor="online" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Online Payment
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {cart.items.map(item => (
            <div key={item.inventory_item_id} className="flex justify-between text-sm">
              <span>{item.name} × {item.quantity}</span>
              <span>₹{(item.discount_price ?? item.price) * item.quantity}</span>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-primary">₹{cart.total}</span>
          </div>
        </CardContent>
      </Card>

      <Button
        className="w-full"
        size="lg"
        onClick={handlePlaceOrder}
        disabled={placeOrder.isPending || !address || !deliveryLat || (deliveryCheck ? !deliveryCheck.eligible : true)}
      >
        {placeOrder.isPending ? 'Placing Order...' : `Place Order • ₹${cart.total}`}
      </Button>
    </div>
  );
};

export default CheckoutPage;
