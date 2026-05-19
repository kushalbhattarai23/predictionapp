import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, MapPin, CreditCard, Clock } from 'lucide-react';
import { format } from 'date-fns';
import OrderStatusBadge from '../components/OrderStatusBadge';
import DeliveryMap from '../components/DeliveryMap';
import { useRiderLocations } from '../hooks/useRiders';
import { QCOrder, QCOrderItem } from '../hooks/useQCOrders';

const ORDER_STEPS = ['pending', 'confirmed', 'preparing', 'rider_assigned', 'picked_up', 'on_the_way', 'delivered'];

const OrderTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { locations } = useRiderLocations();

  const { data: order } = useQuery({
    queryKey: ['qc-order', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qc_orders')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as unknown as QCOrder;
    },
    enabled: !!user && !!id,
    refetchInterval: 5000,
  });

  const { data: orderItems = [] } = useQuery({
    queryKey: ['qc-order-items', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qc_order_items')
        .select('*')
        .eq('order_id', id!);
      if (error) throw error;
      return data as unknown as QCOrderItem[];
    },
    enabled: !!user && !!id,
  });

  if (!order) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;

  const currentStepIdx = ORDER_STEPS.indexOf(order.status);
  const riderLocation = order.assigned_rider_id
    ? locations.find(l => l.rider_id === order.assigned_rider_id)
    : null;

  const mapMarkers = [];
  if (order.delivery_lat && order.delivery_lng) {
    mapMarkers.push({ lat: Number(order.delivery_lat), lng: Number(order.delivery_lng), label: 'Delivery', type: 'default' as const });
  }
  if (riderLocation) {
    mapMarkers.push({ lat: riderLocation.lat, lng: riderLocation.lng, label: 'Rider', type: 'rider' as const });
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Link to="/store/orders" className="inline-flex items-center text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Orders
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order Tracking</h1>
          <p className="text-sm text-muted-foreground font-mono">{order.id.slice(0, 8)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {ORDER_STEPS.filter(s => s !== 'cancelled').map((step, idx) => (
              <div key={step} className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                  ${idx <= currentStepIdx ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                `}>
                  {idx + 1}
                </div>
                <span className="text-[10px] mt-1 text-center capitalize hidden sm:block">
                  {step.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Map */}
      {(order.delivery_lat || riderLocation) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5" /> Live Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DeliveryMap
              center={order.delivery_lat ? [Number(order.delivery_lat), Number(order.delivery_lng)] : undefined}
              markers={mapMarkers}
              height="300px"
            />
          </CardContent>
        </Card>
      )}

      {/* Order Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{format(new Date(order.created_at), 'MMM d, yyyy • h:mm a')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span>{order.delivery_address || 'No address'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="w-4 h-4 text-muted-foreground" />
            <span className="capitalize">{order.payment_method}</span>
          </div>
          <div className="border-t pt-3">
            {orderItems.map(item => (
              <div key={item.id} className="flex justify-between text-sm py-1">
                <span>× {item.quantity}</span>
                <span>₹{item.subtotal}</span>
              </div>
            ))}
            <div className="border-t mt-2 pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span>₹{order.total_amount}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderTrackingPage;
