import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { HouseholdMembers } from '../components/HouseholdMembers';
import { useNetworkMembers } from '@/hooks/useSettleBillNetworks';

const HouseholdMembersPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const networkId = id || '';
  const { data: members } = useNetworkMembers(networkId);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to={`/household/${networkId}`}>
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
        </Link>
        <h1 className="text-2xl font-bold text-sky-700 dark:text-sky-300">Members</h1>
      </div>
      <HouseholdMembers networkId={networkId} members={members || []} />
    </div>
  );
};

export default HouseholdMembersPage;
