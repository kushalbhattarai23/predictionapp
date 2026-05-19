
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Bill } from '@/hooks/useSettleGaraBills';
import { BillEditForm } from '../components/BillEditForm';

export const BillEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: bill, isLoading } = useQuery({
    queryKey: ['bill-edit', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settlegara_bills')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as Bill;
    },
    enabled: !!id,
  });

  const handleSuccess = () => {
    navigate(`/settlebill/bills/${id}`);
  };

  const handleClose = () => {
    navigate(`/settlebill/bills/${id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-destructive mb-4">Bill not found</h2>
              <p className="text-muted-foreground mb-6">The bill you're trying to edit doesn't exist.</p>
              <Button onClick={() => navigate('/settlebill/bills')} variant="destructive">
                Back to Bills
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-4 md:mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClose}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Back to Bill</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-red-700">Edit Bill</h1>
            <p className="text-sm text-red-500 hidden sm:block">Update bill information</p>
          </div>
        </div>
        
        <Card className="shadow-lg border border-orange-200 dark:border-orange-800">
          <CardHeader className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-t-lg">
            <CardTitle className="text-lg md:text-xl">Edit Bill Information</CardTitle>
            <p className="text-red-100 text-sm md:text-base">Update the expense details</p>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <BillEditForm 
              bill={bill}
              onClose={handleClose}
              onSuccess={handleSuccess}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
