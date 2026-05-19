import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useHouseholdActivity } from '@/hooks/useHouseholdActivity';
import { Activity, DollarSign, Repeat, Users, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useCurrency } from '@/hooks/useCurrency';

interface Props {
  networkId: string;
}

const actionIcons: Record<string, React.ReactNode> = {
  expense_added: <DollarSign className="h-4 w-4 text-green-500" />,
  recurring_created: <Repeat className="h-4 w-4 text-blue-500" />,
  member_added: <Users className="h-4 w-4 text-purple-500" />,
  expense_deleted: <Trash2 className="h-4 w-4 text-red-500" />,
};

export const HouseholdActivityFeed: React.FC<Props> = ({ networkId }) => {
  const { data: activities, isLoading } = useHouseholdActivity(networkId);
  const { currency } = useCurrency();

  const formatDescription = (desc: string) => {
    return desc.replace(/\$/g, currency.symbol);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Activity Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : activities && activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map(entry => (
              <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="mt-0.5">
                  {actionIcons[entry.action_type] || <Activity className="h-4 w-4 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{formatDescription(entry.description)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No activity yet
          </div>
        )}
      </CardContent>
    </Card>
  );
};
