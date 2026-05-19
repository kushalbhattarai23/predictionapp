
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BillForm } from '../components/BillForm';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ItemizedBillPage } from './ItemizedBillPage';

export const CreateBillPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const networkId = searchParams.get('networkId');
  const [isItemized, setIsItemized] = useState(false);

  const handleSuccess = () => {
    navigate('/settlebill/bills');
  };

  const handleClose = () => {
    navigate('/settlebill/bills');
  };

  if (isItemized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-4 md:mb-6">
            <Link to="/settlebill/bills">
              <Button variant="ghost" size="sm" className="flex items-center">
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Back to Bills</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-bold text-red-700">Create New Bill</h1>
              <p className="text-sm text-gray-600 hidden sm:block">Split expenses with your network members</p>
            </div>
          </div>

          <div className="flex items-center justify-between border rounded-lg bg-white p-4 mb-6 shadow-sm">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-purple-600" />
              <div>
                <Label htmlFor="itemized-create-toggle" className="text-base font-medium cursor-pointer">Itemized Bill</Label>
                <p className="text-sm text-muted-foreground">Track individual items and assign to members</p>
              </div>
            </div>
            <Switch
              id="itemized-create-toggle"
              checked={isItemized}
              onCheckedChange={setIsItemized}
            />
          </div>

          <ItemizedBillPage embedded />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-4 md:mb-6">
          <Link to="/settlebill/bills">
            <Button variant="ghost" size="sm" className="flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Back to Bills</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-red-700">Create New Bill</h1>
            <p className="text-sm text-gray-600 hidden sm:block">Split expenses with your network members</p>
          </div>
        </div>

        <div className="flex items-center justify-between border rounded-lg bg-white p-4 mb-6 shadow-sm">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-purple-600" />
            <div>
              <Label htmlFor="itemized-toggle" className="text-base font-medium cursor-pointer">Itemized Bill</Label>
              <p className="text-sm text-muted-foreground">Track individual items and assign to members</p>
            </div>
          </div>
          <Switch
            id="itemized-toggle"
            checked={isItemized}
            onCheckedChange={setIsItemized}
          />
        </div>
        
        <Card className="shadow-lg border border-orange-200 dark:border-orange-800">
          <CardHeader className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-t-lg">
            <CardTitle className="text-lg md:text-xl">Bill Information</CardTitle>
            <p className="text-red-100 text-sm md:text-base">Add a new expense to split among your network members</p>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <BillForm 
              onClose={handleClose}
              onSuccess={handleSuccess}
              selectedNetworkId={networkId || undefined}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
