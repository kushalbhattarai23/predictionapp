import React from 'react';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppNotifications } from '@/hooks/useAppNotifications';
import { Link } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const NotificationBadge: React.FC = () => {
  const { unreadCount } = useAppNotifications();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link to="/finance/notifications">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{unreadCount > 0 ? `${unreadCount} unread notifications` : 'No new notifications'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default NotificationBadge;
