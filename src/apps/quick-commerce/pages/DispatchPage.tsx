import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRiders, useRiderLocations } from '../hooks/useRiders';
import { useStoreLocations } from '../hooks/useStoreLocations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Map } from 'lucide-react';
import DeliveryMap from '../components/DeliveryMap';
import { QCOrder } from '../hooks/useQCOrders';

const DispatchPage: React.FC = () => {
  const { user } = useAuth();
  const { riders } = useRiders();
  const { locations } = useRiderLocations();
  const { storeLocations } = useStoreLocations();

  const { data: activeOrders = [] } = useQuery({
    queryKey: ['dispatch-active-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qc_orders')
        .select('*')
        .not('status', 'in', '("delivered","cancelled")')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as QCOrder[];
    },
    enabled: !!user,
    refetchInterval: 5000,
  });

  const mapMarkers = [
    ...storeLocations.map(s => ({
      lat: s.lat,
      lng: s.lng,
      label: `🏪 ${s.name}`,
      type: 'store' as const,
    })),
    ...locations.map(l => ({
      lat: l.lat,
      lng: l.lng,
      label: `🚴 ${riders.find(r => r.id === l.rider_id)?.name || 'Rider'}`,
      type: 'rider' as const,
    })),
    ...activeOrders
      .filter(o => o.delivery_lat && o.delivery_lng)
      .map(o => ({
        lat: Number(o.delivery_lat),
        lng: Number(o.delivery_lng),
        label: `📦 Order ${o.id.slice(0, 6)}`,
        type: 'default' as const,
      })),
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Map className="w-7 h-7" /> Live Dispatch
      </h1>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{activeOrders.length}</p>
            <p className="text-sm text-muted-foreground">Active Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{riders.filter(r => r.status === 'available').length}</p>
            <p className="text-sm text-muted-foreground">Available Riders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{riders.filter(r => r.status === 'on_delivery').length}</p>
            <p className="text-sm text-muted-foreground">On Delivery</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Map</CardTitle>
        </CardHeader>
        <CardContent>
          <DeliveryMap
            center={storeLocations[0] ? [storeLocations[0].lat, storeLocations[0].lng] : undefined}
            markers={mapMarkers}
            height="500px"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default DispatchPage;
