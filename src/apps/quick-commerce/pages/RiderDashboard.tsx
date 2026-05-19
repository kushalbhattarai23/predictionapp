import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRiders, useRiderLocations } from '../hooks/useRiders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bike, MapPin, Package, Wifi, WifiOff } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QCOrder } from '../hooks/useQCOrders';
import OrderStatusBadge from '../components/OrderStatusBadge';
import DeliveryMap from '../components/DeliveryMap';
import { Link } from 'react-router-dom';

const RiderDashboard: React.FC = () => {
  const { user } = useAuth();
  const { riders } = useRiders();
  const { updateLocation } = useRiderLocations();
  const [tracking, setTracking] = useState(false);

  const myRider = riders.find(r => r.user_id === user?.id);

  const { data: assignedOrders = [] } = useQuery({
    queryKey: ['rider-assigned-orders', myRider?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qc_orders')
        .select('*')
        .eq('assigned_rider_id', myRider!.id)
        .not('status', 'in', '("delivered","cancelled")')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as QCOrder[];
    },
    enabled: !!myRider,
    refetchInterval: 5000,
  });

  // GPS tracking
  useEffect(() => {
    if (!tracking || !myRider) return;
    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          updateLocation.mutate({
            rider_id: myRider.id,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => console.error('GPS error:', err),
        { enableHighAccuracy: true }
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [tracking, myRider]);

  if (!myRider) {
    return (
      <div className="text-center py-16 space-y-4">
        <Bike className="w-16 h-16 mx-auto text-muted-foreground" />
        <h2 className="text-xl font-semibold">You are not registered as a rider</h2>
        <p className="text-muted-foreground">Contact admin to get rider access</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bike className="w-7 h-7" /> Rider Dashboard
          </h1>
          <p className="text-muted-foreground">Welcome, {myRider.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={myRider.status === 'available' ? 'default' : 'secondary'}>
            {myRider.status}
          </Badge>
          <Button
            variant={tracking ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTracking(!tracking)}
          >
            {tracking ? <Wifi className="w-4 h-4 mr-1" /> : <WifiOff className="w-4 h-4 mr-1" />}
            {tracking ? 'Tracking On' : 'Start Tracking'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{assignedOrders.length}</p>
            <p className="text-sm text-muted-foreground">Active Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold capitalize">{myRider.status}</p>
            <p className="text-sm text-muted-foreground">Status</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{myRider.vehicle_type}</p>
            <p className="text-sm text-muted-foreground">Vehicle</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Deliveries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" /> Active Deliveries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignedOrders.length === 0 ? (
            <p className="text-center py-6 text-muted-foreground">No active deliveries</p>
          ) : (
            <div className="space-y-3">
              {assignedOrders.map(order => (
                <Link key={order.id} to={`/rider/order/${order.id}`}>
                  <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">₹{order.total_amount}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {order.delivery_address || 'No address'}
                        </p>
                      </div>
                      <OrderStatusBadge status={order.status} size="sm" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RiderDashboard;
