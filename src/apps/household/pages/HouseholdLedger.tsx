import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { MonthlyLedger } from '../components/MonthlyLedger';
import { ImportLedgerDialog } from '../components/ImportLedgerDialog';
import { useNetworkMembers } from '@/hooks/useSettleBillNetworks';
import { useHouseholdCategories } from '@/hooks/useHouseholdCategories';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const HouseholdLedger: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const networkId = id || '';
  const { data: members } = useNetworkMembers(networkId);
  const { data: categories } = useHouseholdCategories(networkId);
  const { data: network } = useQuery({
    queryKey: ['household-network', networkId],
    queryFn: async () => {
      const { data, error } = await supabase.from('settlegara_networks').select('*').eq('id', networkId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!networkId,
  });

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link to={`/household/${networkId}`}>
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
          </Link>
          <h1 className="text-2xl font-bold text-sky-700 dark:text-sky-300">Monthly Ledger — {network?.name || 'Household'}</h1>
        </div>
        <ImportLedgerDialog networkId={networkId} members={members || []} />
      </div>
      <MonthlyLedger networkId={networkId} members={members || []} categories={categories || []} />
    </div>
  );
};

export default HouseholdLedger;
