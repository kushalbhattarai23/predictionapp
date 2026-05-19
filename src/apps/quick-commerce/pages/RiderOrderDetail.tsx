import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Navigation } from 'lucide-react';
import DeliveryMap from '../components/DeliveryMap';
import OrderStatusBadge from '../components/OrderStatusBadge';
import { useQCOrders, QCOrder } from '../hooks/useQCOrders';

const statusFlow = ['rider_assigned', 'picked_up', 'on_the_way', 'delivered'];

const RiderOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { updateOrderStatus } = useQCOrders();

  const { data: order } = useQuery({
    queryKey: ['rider-order', id],
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

  if (!order) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;

  const currentIdx = statusFlow.indexOf(order.status);
  const nextStatus = currentIdx >= 0 && currentIdx < statusFlow.length - 1 ? statusFlow[currentIdx + 1] : null;

  const handleStatusUpdate = () => {
    if (nextStatus) {
      updateOrderStatus.mutate({ orderId: order.id, status: nextStatus });
    }
  };

  const mapMarkers = [];
  if (order.delivery_lat && order.delivery_lng) {
    mapMarkers.push({ lat: Number(order.delivery_lat), lng: Number(order.delivery_lng), label: 'Customer', type: 'default' as const });
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Link to="/rider/dashboard" className="inline-flex items-center text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Delivery #{order.id.slice(0, 8)}</h1>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Navigation Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5" /> Navigation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DeliveryMap
            center={order.delivery_lat ? [Number(order.delivery_lat), Number(order.delivery_lng)] : undefined}
            markers={mapMarkers}
            height="350px"
          />
          {order.delivery_lat && order.delivery_lng && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${order.delivery_lat},${order.delivery_lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block"
            >
              <Button variant="outline" className="w-full">
                <Navigation className="w-4 h-4 mr-2" /> Open in Google Maps
              </Button>
            </a>
          )}
        </CardContent>
      </Card>

      {/* Delivery Info */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Delivery Address</p>
              <p className="text-sm text-muted-foreground">{order.delivery_address || 'Not provided'}</p>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Amount</span>
            <span className="font-bold">₹{order.total_amount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payment</span>
            <span className="capitalize">{order.payment_method}</span>
          </div>
        </CardContent>
      </Card>

      {/* Update Status */}
      {nextStatus && (
        <Button
          className="w-full"
          size="lg"
          onClick={handleStatusUpdate}
          disabled={updateOrderStatus.isPending}
        >
          Mark as: {nextStatus.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
        </Button>
      )}

      {order.status === 'delivered' && (
        <div className="text-center py-4 text-green-600 font-semibold">
          ✅ Delivery Completed
        </div>
      )}
    </div>
  );
};

export default RiderOrderDetail;
