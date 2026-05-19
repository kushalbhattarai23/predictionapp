
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, Calculator } from 'lucide-react';
import { Link } from 'react-router-dom';
import { NetworksList } from '../components/NetworksList';

export const NetworksPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-red-700 mb-2 flex items-center gap-3">
              <Users className="w-8 h-8 text-red-600" />
              Networks
            </h1>
            <p className="text-red-500">Manage your bill-splitting networks</p>
          </div>
          <div className="flex gap-3">
            <Link to="/settlebill/networks/create">
              <Button className="bg-red-600 hover:bg-red-700 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Network
              </Button>
            </Link>
          </div>
        </div>
        
        <Card className="shadow-lg bg-white/70 border border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle>Your Networks</CardTitle>
          </CardHeader>
          <CardContent>
            <NetworksList />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
