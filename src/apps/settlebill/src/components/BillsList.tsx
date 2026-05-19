
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Receipt, Calendar, DollarSign, Edit, Trash2, CheckCircle, Eye, Network, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBills, useDeleteBill, useUpdateBill } from '@/hooks/useSettleGaraBills';
import { useNetworks } from '@/hooks/useSettleBillNetworks';
import { supabase } from '@/integrations/supabase/client';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { toast } from 'sonner';

interface BillsListProps {
  statusFilter?: 'all' | 'pending' | 'settled';
}

export const BillsList: React.FC<BillsListProps> = ({ statusFilter = 'all' }) => {
  const { data: bills, isLoading } = useBills();
  const { data: networks } = useNetworks();
  const { data: userPreferences } = useUserPreferences();
  const deleteBillMutation = useDeleteBill();
  const updateBillMutation = useUpdateBill();

  const currency = userPreferences?.preferred_currency || 'USD';
  const getCurrencySymbol = (curr: string) => {
    const symbols: { [key: string]: string } = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      INR: '₹',
      NPR: 'रु',
      JPY: '¥'
    };
    return symbols[curr] || curr;
  };

  const handleDelete = (billId: string) => {
    if (confirm('Are you sure you want to delete this bill?')) {
      deleteBillMutation.mutate(billId, {
        onSuccess: () => {
          toast.success('Bill deleted successfully');
        },
        onError: () => {
          toast.error('Failed to delete bill');
        }
      });
    }
  };

  const handleMarkAsSettled = async (billId: string) => {
    try {
      // Update all pending/unpaid splits to paid
      const { error: splitsError } = await supabase
        .from('settlegara_bill_splits')
        .update({ status: 'paid', settled_at: new Date().toISOString() })
        .eq('bill_id', billId)
        .neq('status', 'paid');

      if (splitsError) {
        console.error('Error updating splits:', splitsError);
      }

      updateBillMutation.mutate(
        { id: billId, status: 'settled' },
        {
          onSuccess: () => {
            toast.success('Bill marked as settled — all payments updated');
          },
          onError: () => {
            toast.error('Failed to update bill status');
          }
        }
      );
    } catch (err) {
      toast.error('Failed to settle bill');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'settled': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'partial': return 'bg-orange-100 text-orange-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBills = React.useMemo(() => {
    if (!bills) return [];
    if (statusFilter === 'all') return bills;
    if (statusFilter === 'settled') return bills.filter(b => b.status === 'settled');
    return bills.filter(b => b.status !== 'settled');
  }, [bills, statusFilter]);

  const networkNameById = React.useMemo(() => {
    if (!networks) return new Map<string, string>();
    return new Map(networks.map((network) => [network.id, network.name]));
  }, [networks]);

  // Check if all splits for a bill are effectively paid (including paid_by member)
  const isBillEffectivelySettled = (bill: any) => {
    return bill.status === 'settled';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!bills || bills.length === 0) {
    return (
      <div className="text-center py-12">
        <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No bills yet</h3>
        <p className="text-gray-500 mb-6">Create your first bill to start tracking expenses</p>
        <Link to="/settlebill/bills/create">
          <Button className="bg-blue-600 hover:bg-blue-700">
            Create Bill
          </Button>
        </Link>
      </div>
    );
  }

  if (filteredBills.length === 0 && bills.length > 0) {
    return (
      <div className="text-center py-12">
        <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No {statusFilter} bills</h3>
        <p className="text-gray-500 dark:text-gray-400">No bills match the current filter.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredBills.map((bill) => (
        <Card key={bill.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-blue-600" />
                  {bill.title}
                </CardTitle>
                {bill.description && (
                  <p className="text-gray-600 mt-1">{bill.description}</p>
                )}
                <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                  <Network className="w-4 h-4" />
                  <span>From network:</span>
                  <Link
                    to={`/settlebill/networks/${bill.network_id}`}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline underline-offset-2"
                    title="Open network details"
                  >
                    {networkNameById.get(bill.network_id) ?? 'View Network'}
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </p>
              </div>
              <div className="flex gap-2">
                {bill.status !== 'settled' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleMarkAsSettled(bill.id)}
                    disabled={updateBillMutation.isPending}
                    title="Mark as Settled"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                )}
                <Link to={`/settlebill/bills/${bill.id}`}>
                  <Button size="sm" variant="outline" title="View Details">
                    <Eye className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to={`/settlebill/bills/${bill.id}/edit`}>
                  <Button size="sm" variant="outline" title="Edit Bill">
                    <Edit className="w-4 h-4" />
                  </Button>
                </Link>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleDelete(bill.id)}
                  disabled={deleteBillMutation.isPending}
                  title="Delete Bill"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {getCurrencySymbol(currency)} {bill.total_amount.toFixed(2)}
                  {bill.discount_amount && bill.discount_amount > 0 && (
                    <span className="text-green-600 ml-1">
                      (-{getCurrencySymbol(currency)} {bill.discount_amount.toFixed(2)} discount)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(bill.created_at).toLocaleDateString()}
                </div>
              </div>
              <Badge className={getStatusColor(bill.status)}>
                {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
