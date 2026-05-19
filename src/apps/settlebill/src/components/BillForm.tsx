
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNetworks, useNetworkMembers } from '@/hooks/useSettleBillNetworks';
import { useCreateBill } from '@/hooks/useSettleGaraBills';
import { useCurrency } from '@/hooks/useCurrency';
import { AlertCircle, Users, DollarSign, User } from 'lucide-react';
import { toast } from 'sonner';

interface BillFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  selectedNetworkId?: string;
}

interface MemberSplit {
  memberId: string;
  memberName: string;
  amount: number;
}

export const BillForm: React.FC<BillFormProps> = ({ onClose, onSuccess, selectedNetworkId }) => {
  const { data: networks } = useNetworks();
  const [selectedNetwork, setSelectedNetwork] = useState(selectedNetworkId || '');
  const { data: members } = useNetworkMembers(selectedNetwork);
  const createBillMutation = useCreateBill();
  const { currency, formatAmount } = useCurrency();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    total_amount: '',
    discount_amount: '',
    currency: currency.code,
    network_id: selectedNetworkId || '',
    paid_by: ''
  });
  
  const [memberSplits, setMemberSplits] = useState<MemberSplit[]>([]);
  const [discountExcludedMembers, setDiscountExcludedMembers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialize member splits when network members are loaded
  useEffect(() => {
    if (members && members.length > 0) {
      const splits = members.map(member => ({
        memberId: member.id,
        memberName: member.user_name,
        amount: 0
      }));
      setMemberSplits(splits);
    }
  }, [members]);

  // Update network in form data when selected network changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, network_id: selectedNetwork, paid_by: '' }));
  }, [selectedNetwork]);

  // Update currency when user's preferred currency changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, currency: currency.code }));
  }, [currency.code]);

  const handleTotalAmountChange = (value: string) => {
    setFormData(prev => ({ ...prev, total_amount: value }));
    recalculateSplits(value, formData.discount_amount);
  };

  const handleDiscountChange = (value: string) => {
    setFormData(prev => ({ ...prev, discount_amount: value }));
    recalculateSplits(formData.total_amount, value);
  };

  const recalculateSplits = (totalStr: string, discountStr: string) => {
    const totalAmount = parseFloat(totalStr) || 0;
    const discountAmount = parseFloat(discountStr) || 0;
    const effectiveAmount = totalAmount - discountAmount;
    
    if (memberSplits.length > 0 && effectiveAmount > 0) {
      const amountPerMember = effectiveAmount / memberSplits.length;
      setMemberSplits(prev => prev.map(split => ({
        ...split,
        amount: Math.round(amountPerMember * 100) / 100
      })));
    }
  };

  const handleMemberAmountChange = (memberId: string, amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    setMemberSplits(prev => prev.map(split => 
      split.memberId === memberId ? { ...split, amount: numAmount } : split
    ));
  };

  const getEffectiveTotal = () => {
    const total = parseFloat(formData.total_amount) || 0;
    const discount = parseFloat(formData.discount_amount) || 0;
    return total - discount;
  };

  const getTotalSplitAmount = () => {
    return memberSplits.reduce((sum, split) => sum + split.amount, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      if (!formData.title.trim()) {
        setError('Bill title is required');
        return;
      }
      
      if (!formData.network_id) {
        setError('Please select a network');
        return;
      }

      if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) {
        setError('Please enter a valid total amount');
        return;
      }

      if (!formData.paid_by) {
        setError('Please select who paid the bill');
        return;
      }

      const totalAmount = parseFloat(formData.total_amount);
      const discountAmount = parseFloat(formData.discount_amount) || 0;
      const effectiveTotal = totalAmount - discountAmount;
      const splitTotal = getTotalSplitAmount();
      
      if (Math.abs(effectiveTotal - splitTotal) > 0.01) {
        setError(`Split amounts (${formatAmount(splitTotal)}) must equal total after discount (${formatAmount(effectiveTotal)})`);
        return;
      }

      const billData = {
        network_id: formData.network_id,
        title: formData.title,
        description: formData.description || null,
        total_amount: totalAmount,
        discount_amount: discountAmount,
        discount_excluded_members: discountExcludedMembers,
        currency: formData.currency,
        status: 'active',
        paid_by: formData.paid_by
      };

      const splits = memberSplits
        .filter(split => split.amount > 0)
        .map(split => ({
          member_id: split.memberId,
          amount: split.amount
        }));

      await createBillMutation.mutateAsync({
        bill: billData,
        splits: splits
      });

      toast.success('Bill created successfully!');
      setFormData({ title: '', description: '', total_amount: '', discount_amount: '', currency: currency.code, network_id: selectedNetworkId || '', paid_by: '' });
      setMemberSplits([]);
      onSuccess?.();
      
    } catch (error: any) {
      console.error('Error creating bill:', error);
      setError(error.message || 'Failed to create bill');
      toast.error('Failed to create bill');
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Bill Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Dinner at Restaurant"
              required
              disabled={createBillMutation.isPending}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional details about the bill..."
              rows={3}
              disabled={createBillMutation.isPending}
              className="w-full resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="network">Network *</Label>
              <Select
                value={selectedNetwork}
                onValueChange={setSelectedNetwork}
                disabled={createBillMutation.isPending || !!selectedNetworkId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a network" />
                </SelectTrigger>
                <SelectContent>
                  {networks?.map((network) => (
                    <SelectItem key={network.id} value={network.id}>
                      {network.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_amount">Total Amount *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  {currency.symbol}
                </span>
                <Input
                  id="total_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.total_amount}
                  onChange={(e) => handleTotalAmountChange(e.target.value)}
                  placeholder="0.00"
                  required
                  disabled={createBillMutation.isPending}
                  className="pl-8 w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount_amount">Discount (Fixed)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  {currency.symbol}
                </span>
                <Input
                  id="discount_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.discount_amount}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                  placeholder="0.00"
                  disabled={createBillMutation.isPending}
                  className="pl-8 w-full"
                />
              </div>
              {formData.discount_amount && parseFloat(formData.discount_amount) > 0 && (
                <p className="text-xs text-green-600">
                  Effective total: {formatAmount(getEffectiveTotal())}
                </p>
              )}
            </div>
          </div>

          {/* Discount Exclusion */}
          {formData.discount_amount && parseFloat(formData.discount_amount) > 0 && members && members.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm">Exclude from Discount ({discountExcludedMembers.length} excluded)</Label>
              <p className="text-xs text-muted-foreground">
                Selected members will NOT receive any discount share
              </p>
              <div className="flex flex-wrap gap-2">
                {members.map((member) => {
                  const isExcluded = discountExcludedMembers.includes(member.id);
                  return (
                    <label
                      key={member.id}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-colors ${
                        isExcluded
                          ? 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      <Checkbox
                        checked={isExcluded}
                        onCheckedChange={() => {
                          setDiscountExcludedMembers(prev =>
                            prev.includes(member.id)
                              ? prev.filter(id => id !== member.id)
                              : [...prev, member.id]
                          );
                        }}
                        className="h-3.5 w-3.5"
                      />
                      <span className="text-xs font-medium">{member.user_name}</span>
                      {isExcluded && <span className="text-xs opacity-75">(No discount)</span>}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {selectedNetwork && members && members.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="paid_by">Paid By *</Label>
              <Select
                value={formData.paid_by}
                onValueChange={(value) => setFormData({ ...formData, paid_by: value })}
                disabled={createBillMutation.isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select who paid the bill" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {member.user_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {selectedNetwork && members && members.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5" />
                Split Between Members
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4">
              {memberSplits.map((split) => (
                <div key={split.memberId} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg space-y-2 sm:space-y-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-teal-600">
                        {split.memberName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium text-sm md:text-base">{split.memberName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">{currency.symbol}</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={split.amount}
                      onChange={(e) => handleMemberAmountChange(split.memberId, e.target.value)}
                      className="w-20 sm:w-24"
                      disabled={createBillMutation.isPending}
                    />
                  </div>
                </div>
              ))}
              
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="font-medium text-sm md:text-base">Total Split Amount:</span>
                <span className={`font-bold text-sm md:text-base ${Math.abs(getEffectiveTotal() - getTotalSplitAmount()) > 0.01 ? 'text-red-600' : 'text-teal-600'}`}>
                  {formatAmount(getTotalSplitAmount())}
                  {getEffectiveTotal() > 0 && (
                    <span className="text-xs font-normal text-muted-foreground ml-2">
                      / {formatAmount(getEffectiveTotal())} expected
                    </span>
                  )}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-4">
          <Button 
            type="submit"
            disabled={createBillMutation.isPending || !formData.title.trim() || !selectedNetwork || !formData.paid_by}
            className="flex-1 bg-teal-600 hover:bg-teal-700"
          >
            {createBillMutation.isPending ? 'Creating Bill...' : 'Create Bill'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose} 
            className="flex-1"
            disabled={createBillMutation.isPending}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};
