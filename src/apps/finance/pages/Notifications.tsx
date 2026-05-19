import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppNotifications, AppNotification } from '@/hooks/useAppNotifications';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, Check, CheckCheck, Trash2, DollarSign, Users, Receipt, Info, AlertCircle,
  Clock, ExternalLink, Calendar, Film, Home, Package, Bug, Wallet, Tag, ArrowRightLeft, CreditCard
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'scheduled_payment':
      return <Calendar className="w-5 h-5 text-primary" />;
    case 'transaction_added':
    case 'transaction_deleted':
      return <DollarSign className="w-5 h-5 text-green-600" />;
    case 'transfer_created':
    case 'transfer_deleted':
      return <ArrowRightLeft className="w-5 h-5 text-indigo-600" />;
    case 'wallet_created':
    case 'wallet_deleted':
      return <Wallet className="w-5 h-5 text-violet-600" />;
    case 'budget_created':
    case 'budget_deleted':
      return <Tag className="w-5 h-5 text-emerald-600" />;
    case 'category_created':
    case 'category_deleted':
      return <Tag className="w-5 h-5 text-teal-600" />;
    case 'credit_created':
    case 'credit_deleted':
      return <CreditCard className="w-5 h-5 text-amber-600" />;
    case 'network_invite':
      return <Users className="w-5 h-5 text-blue-600" />;
    case 'payment_due':
    case 'bill_created':
      return <Receipt className="w-5 h-5 text-orange-600" />;
    case 'bill_deleted':
      return <Trash2 className="w-5 h-5 text-destructive" />;
    case 'movie_added':
    case 'movie_deleted':
      return <Film className="w-5 h-5 text-blue-600" />;
    case 'household':
      return <Home className="w-5 h-5 text-sky-600" />;
    case 'inventory_item_added':
    case 'inventory_store_created':
    case 'inventory_stock_updated':
      return <Package className="w-5 h-5 text-cyan-600" />;
    case 'qa_workspace_created':
    case 'qa_board_created':
    case 'qa_card_created':
      return <Bug className="w-5 h-5 text-red-600" />;
    case 'system':
      return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    default:
      return <Info className="w-5 h-5 text-muted-foreground" />;
  }
};

const getNotificationColor = (type: string) => {
  if (type.startsWith('transaction') || type.startsWith('transfer') || type.startsWith('wallet') || type.startsWith('budget') || type.startsWith('category') || type.startsWith('credit') || type === 'scheduled_payment')
    return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
  if (type.startsWith('bill') || type === 'payment_due')
    return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
  if (type.startsWith('movie'))
    return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
  if (type === 'household')
    return 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800';
  if (type.startsWith('inventory'))
    return 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800';
  if (type.startsWith('qa'))
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  if (type === 'system')
    return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
  return 'bg-muted border-border';
};

interface NotificationItemProps {
  notification: AppNotification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate: (link: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkRead, onDelete, onNavigate }) => {
  const link = notification.metadata?.link as string | undefined;

  const handleClick = () => {
    if (link) {
      if (!notification.is_read) onMarkRead(notification.id);
      onNavigate(link);
    }
  };

  return (
    <div 
      className={`p-4 rounded-lg border ${getNotificationColor(notification.type)} ${
        !notification.is_read ? 'ring-2 ring-primary/20' : 'opacity-75'
      } ${link ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-background">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm">{notification.title}</h4>
            {!notification.is_read && (
              <Badge variant="default" className="text-xs px-1.5 py-0">New</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{notification.message}</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
            </div>
            {link && (
              <div className="flex items-center gap-1 text-xs text-primary font-medium">
                <ExternalLink className="w-3 h-3" />
                <span>View</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {!notification.is_read && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onMarkRead(notification.id)}
            >
              <Check className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(notification.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount,
    isLoading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    clearAllNotifications 
  } = useAppNotifications();

  const handleMarkRead = (id: string) => markAsRead.mutate(id);
  const handleDelete = (id: string) => deleteNotification.mutate(id);
  const handleMarkAllRead = () => markAllAsRead.mutate();
  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all notifications?')) {
      clearAllNotifications.mutate();
    }
  };
  const handleNavigate = (link: string) => navigate(link);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <Bell className="w-8 h-8" />
            Notifications
          </h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllRead} disabled={markAllAsRead.isPending}>
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="outline" onClick={handleClearAll} disabled={clearAllNotifications.isPending}
              className="text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Activity & Notifications
          </CardTitle>
          <CardDescription>
            Click on a notification to navigate to the related item
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No notifications yet</p>
              <p className="text-sm">Your activity and updates will appear here</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={handleMarkRead}
                    onDelete={handleDelete}
                    onNavigate={handleNavigate}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;
