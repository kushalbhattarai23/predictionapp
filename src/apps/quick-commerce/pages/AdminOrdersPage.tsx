import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Eye, Bike } from 'lucide-react';
import { format } from 'date-fns';
import OrderStatusBadge from '../components/OrderStatusBadge';
import { useQCOrders, QCOrder } from '../hooks/useQCOrders';
import { useRiders } from '../hooks/useRiders';

const AdminOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const { updateOrderStatus } = useQCOrders();
  const { riders } = useRiders();
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: allOrders = [], isLoading } = useQuery({
    queryKey: ['admin-all-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qc_orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as QCOrder[];
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  const filtered = statusFilter === 'all' ? allOrders : allOrders.filter(o => o.status === statusFilter);

  const handleAssignRider = async (orderId: string, riderId: string) => {
    await supabase
      .from('qc_orders')
      .update({ assigned_rider_id: riderId, status: 'rider_assigned' } as any)
      .eq('id', orderId);
    updateOrderStatus.mutate({ orderId, status: 'rider_assigned' });
  };

  const handleStatusChange = (orderId: string, status: string) => {
    updateOrderStatus.mutate({ orderId, status });
  };

  const availableRiders = riders.filter(r => r.status === 'available');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package className="w-7 h-7" /> Order Management
        </h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="preparing">Preparing</SelectItem>
            <SelectItem value="rider_assigned">Rider Assigned</SelectItem>
            <SelectItem value="on_the_way">On the Way</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{order.id.slice(0, 8)}</span>
                      <OrderStatusBadge status={order.status} size="sm" />
                    </div>
                    <p className="font-semibold">₹{order.total_amount}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.created_at), 'MMM d, h:mm a')}
                    </p>
                    <p className="text-sm text-muted-foreground">{order.delivery_address}</p>
                  </div>
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    {/* Assign Rider */}
                    {!order.assigned_rider_id && order.status !== 'cancelled' && order.status !== 'delivered' && (
                      <Select onValueChange={(val) => handleAssignRider(order.id, val)}>
                        <SelectTrigger>
                          <Bike className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="Assign Rider" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRiders.map(r => (
                            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {/* Update Status */}
                    <Select value={order.status} onValueChange={(val) => handleStatusChange(order.id, val)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['pending', 'confirmed', 'preparing', 'rider_assigned', 'picked_up', 'on_the_way', 'delivered', 'cancelled'].map(s => (
                          <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
