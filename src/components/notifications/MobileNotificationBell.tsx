import React, { useState } from 'react';
import { Bell, Check, X, Clock, Calendar, DollarSign, Users, Receipt, Info, AlertCircle, Package, Bug, Wallet, ArrowRightLeft, CreditCard, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppNotifications, AppNotification } from '@/hooks/useAppNotifications';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'scheduled_payment':
      return <Calendar className="w-4 h-4 text-primary" />;
    case 'transaction_added':
    case 'transaction_deleted':
      return <DollarSign className="w-4 h-4 text-green-600" />;
    case 'transfer_created':
    case 'transfer_deleted':
      return <ArrowRightLeft className="w-4 h-4 text-indigo-600" />;
    case 'wallet_created':
    case 'wallet_deleted':
      return <Wallet className="w-4 h-4 text-violet-600" />;
    case 'budget_created':
    case 'budget_deleted':
    case 'category_created':
    case 'category_deleted':
      return <Tag className="w-4 h-4 text-teal-600" />;
    case 'credit_created':
    case 'credit_deleted':
      return <CreditCard className="w-4 h-4 text-amber-600" />;
    case 'network_invite':
      return <Users className="w-4 h-4 text-blue-600" />;
    case 'payment_due':
    case 'bill_created':
      return <Receipt className="w-4 h-4 text-orange-600" />;
    case 'inventory_item_added':
    case 'inventory_store_created':
    case 'inventory_stock_updated':
      return <Package className="w-4 h-4 text-cyan-600" />;
    case 'qa_workspace_created':
    case 'qa_board_created':
    case 'qa_card_created':
      return <Bug className="w-4 h-4 text-red-600" />;
    case 'system':
      return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    default:
      return <Info className="w-4 h-4 text-muted-foreground" />;
  }
};

interface NotificationItemProps {
  notification: AppNotification;
  onMarkRead: (id: string) => void;
  onClose: () => void;
}

const MobileNotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkRead, onClose }) => {
  const navigate = useNavigate();
  const link = notification.metadata?.link as string | undefined;

  const handleClick = () => {
    if (link) {
      if (!notification.is_read) onMarkRead(notification.id);
      onClose();
      navigate(link);
    }
  };

  return (
    <div 
      className={`p-3 rounded-lg border bg-card ${
        !notification.is_read ? 'border-primary/30 bg-primary/5' : 'border-border'
      } ${link ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-full bg-muted">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="font-medium text-sm truncate">{notification.title}</h4>
            {!notification.is_read && (
              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
          </div>
        </div>
        {!notification.is_read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 flex-shrink-0"
            onClick={(e) => { e.stopPropagation(); onMarkRead(notification.id); }}
          >
            <Check className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
};

export const MobileNotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAllNotifications } = useAppNotifications();

  const handleMarkRead = (id: string) => {
    markAsRead.mutate(id);
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate('/finance/notifications');
  };

  const recentNotifications = notifications.slice(0, 10);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </SheetTitle>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => markAllAsRead.mutate()}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
          </div>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
            </p>
          )}
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="p-4 space-y-2">
            {recentNotifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              recentNotifications.map((notification) => (
                <MobileNotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={handleMarkRead}
                  onClose={() => setIsOpen(false)}
                />
              ))
            )}
          </div>
        </ScrollArea>
        
        {notifications.length > 0 && (
          <div className="p-4 border-t space-y-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleViewAll}
            >
              View All Notifications
            </Button>
            <Button 
              variant="outline" 
              className="w-full text-destructive hover:text-destructive"
              onClick={() => {
                if (confirm('Are you sure you want to clear all notifications?')) {
                  clearAllNotifications.mutate();
                }
              }}
              disabled={clearAllNotifications.isPending}
            >
              <X className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default MobileNotificationBell;
