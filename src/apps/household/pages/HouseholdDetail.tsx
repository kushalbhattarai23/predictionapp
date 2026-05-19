import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, BookOpen, Wallet, RefreshCw, Tag, Users, Activity, BarChart3, Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const HouseholdDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const networkId = id || '';

  const { data: network } = useQuery({
    queryKey: ['household-network', networkId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settlegara_networks')
        .select('*')
        .eq('id', networkId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!networkId,
  });

  const pages = [
    { name: 'Ledger', href: `/household/${networkId}/ledger`, icon: BookOpen, description: 'Monthly expense ledger' },
    { name: 'Balance', href: `/household/${networkId}/balance`, icon: Wallet, description: 'Balance summary & settlements' },
    { name: 'Recurring', href: `/household/${networkId}/recurring`, icon: RefreshCw, description: 'Recurring expenses' },
    { name: 'Categories', href: `/household/${networkId}/categories`, icon: Tag, description: 'Manage expense categories' },
    { name: 'Members', href: `/household/${networkId}/members`, icon: Users, description: 'Household members' },
    { name: 'Activity', href: `/household/${networkId}/activity`, icon: Activity, description: 'Activity timeline' },
    { name: 'Analytics', href: `/household/${networkId}/analytics`, icon: BarChart3, description: 'Spending insights' },
    { name: 'Settings', href: `/household/${networkId}/settings`, icon: Settings, description: 'Currency & preferences' },
  ];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/household">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-sky-700 dark:text-sky-300">
            <Home className="h-6 w-6" />
            {network?.name || 'Household'}
          </h1>
          {network?.description && (
            <p className="text-sm text-muted-foreground">{network.description}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map((page) => {
          const Icon = page.icon;
          return (
            <Link key={page.href} to={page.href}>
              <Card className="hover:shadow-lg transition-all hover:border-sky-300 dark:hover:border-sky-600 cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <CardTitle className="text-lg text-sky-700 dark:text-sky-300">{page.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{page.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default HouseholdDetail;
