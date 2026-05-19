import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  CheckCircle, 
  ChefHat, 
  Bike, 
  Package, 
  MapPin, 
  Truck, 
  XCircle 
} from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: CheckCircle },
  preparing: { label: 'Preparing', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', icon: ChefHat },
  rider_assigned: { label: 'Rider Assigned', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200', icon: Bike },
  picked_up: { label: 'Picked Up', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', icon: Package },
  on_the_way: { label: 'On the Way', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: MapPin },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle },
};

interface OrderStatusBadgeProps {
  status: string;
  size?: 'sm' | 'default';
}

const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, size = 'default' }) => {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <Badge className={`${config.color} ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'px-3 py-1'}`}>
      <Icon className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} mr-1`} />
      {config.label}
    </Badge>
  );
};

export default OrderStatusBadge;
