import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useHouseholdNetworks } from '@/hooks/useHouseholdNetworks';
import { Home, Plus, Users, ArrowRight, Receipt } from 'lucide-react';
import { CreateHouseholdDialog } from '../components/CreateHouseholdDialog';

const HouseholdDashboard: React.FC = () => {
  const { data: networks, isLoading } = useHouseholdNetworks();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Home className="h-7 w-7 text-primary" />
            Household Ledger
          </h1>
          <p className="text-muted-foreground mt-1">Manage shared household expenses with your roommates or family</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Household
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 h-32" />
            </Card>
          ))}
        </div>
      ) : networks && networks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {networks.map((network) => (
            <Link key={network.id} to={`/household/${network.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-primary">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Home className="h-5 w-5 text-primary" />
                    {network.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {network.description || 'No description'}
                  </p>
                  <div className="flex items-center gap-1 mt-3 text-sm text-primary">
                    View Ledger <ArrowRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Home className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No households yet</h3>
            <p className="text-muted-foreground mb-4">Create your first household to start tracking shared expenses</p>
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Household
            </Button>
          </CardContent>
        </Card>
      )}

      <CreateHouseholdDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
};

export default HouseholdDashboard;
