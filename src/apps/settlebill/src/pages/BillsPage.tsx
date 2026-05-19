
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Receipt, Calculator } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BillsList } from '../components/BillsList';

type StatusFilter = 'all' | 'pending' | 'settled';

export const BillsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-red-700 mb-2 flex items-center gap-3">
              <Receipt className="w-8 h-8 text-red-600" />
              Bills
            </h1>
            <p className="text-red-500">Track and manage all your shared expenses</p>
          </div>
          <div className="flex gap-3">
            <Link to="/settlebill/bills/create">
              <Button className="bg-red-600 hover:bg-red-700 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Bill
              </Button>
            </Link>
          </div>
        </div>
        
        <Card className="shadow-lg bg-white/70 border border-orange-200 dark:border-orange-800">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <CardTitle>Your Bills</CardTitle>
              <div className="flex gap-2">
                {(['all', 'pending', 'settled'] as StatusFilter[]).map((filter) => (
                  <Button
                    key={filter}
                    variant={statusFilter === filter ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(filter)}
                    className={statusFilter === filter ? 'bg-red-600 hover:bg-red-700' : ''}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <BillsList statusFilter={statusFilter} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
