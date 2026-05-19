import React from 'react';
import { Link } from 'react-router-dom';
import { useQCOrders } from '../hooks/useQCOrders';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Eye, ArrowLeft } from 'lucide-react';
import OrderStatusBadge from '../components/OrderStatusBadge';
import { format } from 'date-fns';

const OrdersPage: React.FC = () => {
  const { orders, isLoading } = useQCOrders();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/store" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Store
          </Link>
          <h1 className="text-2xl font-bold">My Orders</h1>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <Package className="w-16 h-16 mx-auto text-muted-foreground" />
          <h2 className="text-xl font-semibold">No orders yet</h2>
          <Link to="/store"><Button>Start Shopping</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.created_at), 'MMM d, yyyy • h:mm a')}
                    </p>
                    <p className="font-semibold text-lg">₹{order.total_amount}</p>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="text-right space-y-2">
                    <p className="text-xs text-muted-foreground font-mono">{order.id.slice(0, 8)}</p>
                    <Link to={`/store/order/${order.id}`}>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-1" /> Track
                      </Button>
                    </Link>
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

export default OrdersPage;
