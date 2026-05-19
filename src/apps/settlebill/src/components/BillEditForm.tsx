
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/hooks/useCurrency';
import { useUpdateBill } from '@/hooks/useSettleGaraBills';
import { useBillItemsWithAssignments, useUpdateBillItems } from '@/hooks/useSettleGaraBillItems';
import type { Bill } from '@/hooks/useSettleGaraBills';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, Users, User, Plus, Trash2, Pencil, Check, ShoppingCart } from 'lucide-react';

// Normalize member quantities so they sum to the item's total quantity
const normalizeQuantitiesToItemTotal = (
  assignedMembers: string[],
  memberQuantities: Record<string, number>,
  itemQuantity: number
): Record<string, number> => {
  if (assignedMembers.length === 0) return memberQuantities;
  const total = assignedMembers.reduce((sum, id) => sum + (memberQuantities[id] || 0), 0);
  if (total === 0) {
    const equal = itemQuantity / assignedMembers.length;
    return assignedMembers.reduce<Record<string, number>>((acc, id) => { acc[id] = equal; return acc; }, {});
  }
  if (total === itemQuantity) return memberQuantities;
  const factor = itemQuantity / total;
  return assignedMembers.reduce<Record<string, number>>((acc, id) => {
    acc[id] = (memberQuantities[id] || 0) * factor;
    return acc;
  }, {});
};

// Color palette for member badges
const memberColors = [
  'bg-red-200 text-red-800',
  'bg-green-200 text-green-800',
  'bg-blue-200 text-blue-800',
  'bg-yellow-200 text-yellow-800',
  'bg-purple-200 text-purple-800',
  'bg-pink-200 text-pink-800',
  'bg-cyan-200 text-cyan-800',
  'bg-orange-200 text-orange-800',
];

interface NetworkMember {
  id: string;
  network_id: string;
  user_email: string;
  user_name: string;
  role: string;
  status: string;
}

interface MemberSplit {
  memberId: string;
  memberName: string;
  amount: number;
}

interface EditableItem {
  id: string;
  name: string;
  quantity: number;
  rate: number;
  amount: number;
  assignedMembers: string[];
  memberQuantities: Record<string, number>;
  isNew?: boolean;
  isEditing?: boolean;
}

interface BillEditFormProps {
  bill: Bill;
  onClose?: () => void;
  onSuccess?: () => void;
}

const roundTo = (value: number, decimals = 6) => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

const distributeEvenly = (total: number, count: number, decimals = 6) => {
  if (count <= 0) return [];
  const perMember = total / count;
  const values = Array.from({ length: count }, () => roundTo(perMember, decimals));
  const allocated = values.reduce((sum, value) => sum + value, 0);
  const remainder = roundTo(total - allocated, decimals);
  values[count - 1] = roundTo(values[count - 1] + remainder, decimals);
  return values;
};

export const BillEditForm: React.FC<BillEditFormProps> = ({ bill, onClose, onSuccess }) => {
  const [title, setTitle] = useState(bill.title);
  const [description, setDescription] = useState(bill.description || '');
  const [totalAmount, setTotalAmount] = useState(bill.total_amount.toString());
  const [discountAmount, setDiscountAmount] = useState((bill.discount_amount || 0).toString());
  const [discountExcludedMembers, setDiscountExcludedMembers] = useState<string[]>(bill.discount_excluded_members || []);
  const [paidBy, setPaidBy] = useState(bill.paid_by || '');
  const [isItemized, setIsItemized] = useState(bill.is_itemized || false);
  const [members, setMembers] = useState<NetworkMember[]>([]);
  const [memberSplits, setMemberSplits] = useState<MemberSplit[]>([]);
  const [items, setItems] = useState<EditableItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { currency, formatAmount } = useCurrency();
  const updateBillMutation = useUpdateBill();
  const updateBillItemsMutation = useUpdateBillItems();
  const { data: billItemsWithAssignments } = useBillItemsWithAssignments(bill.id);

  // Fetch members
  useEffect(() => {
    const fetchMembers = async () => {
      const { data } = await supabase
        .from('settlegara_network_members')
        .select('*')
        .eq('network_id', bill.network_id);

      if (data) {
        setMembers(data);
      }
    };
    fetchMembers();
  }, [bill.network_id]);

  // Initialize member splits from existing bill splits - only once
  const [splitsInitialized, setSplitsInitialized] = useState(false);
  useEffect(() => {
    if (!splitsInitialized && members.length > 0) {
      const fetchSplits = async () => {
        const { data: existingSplits } = await supabase
          .from('settlegara_bill_splits')
          .select('*')
          .eq('bill_id', bill.id);

        const splits = members.map(member => {
          const existingSplit = existingSplits?.find(s => s.member_id === member.id);
          return {
            memberId: member.id,
            memberName: member.user_name,
            amount: existingSplit ? Number(existingSplit.amount) : 0
          };
        });
        setMemberSplits(splits);
        setSplitsInitialized(true);
      };
      fetchSplits();
    }
  }, [members, bill.id, splitsInitialized]);

  // Load existing items - only on initial load
  const [itemsInitialized, setItemsInitialized] = useState(false);
  useEffect(() => {
    if (billItemsWithAssignments && billItemsWithAssignments.length > 0) {
      const loadedItems: EditableItem[] = billItemsWithAssignments.map(item => {
        const assignedMembers = item.assignments.map(a => a.member_id);
        const memberQuantities = item.assignments.reduce<Record<string, number>>((acc, assignment) => {
          acc[assignment.member_id] = Number(assignment.consumed_quantity || 0);
          return acc;
        }, {});

        return {
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
          assignedMembers,
          memberQuantities: normalizeQuantitiesToItemTotal(assignedMembers, memberQuantities, item.quantity),
          isNew: false,
          isEditing: false
        };
      });
      setItems(loadedItems);
      setItemsInitialized(true);
    }
  }, [billItemsWithAssignments, itemsInitialized]);

  const handleTotalAmountChange = (value: string) => {
    setTotalAmount(value);
    recalculateSplits(value, discountAmount);
  };

  const handleDiscountChange = (value: string) => {
    setDiscountAmount(value);
    recalculateSplits(totalAmount, value);
  };

  const recalculateSplits = (totalStr: string, discountStr: string) => {
    const total = parseFloat(totalStr) || 0;
    const discount = parseFloat(discountStr) || 0;
    const effectiveAmount = total - discount;

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
    const total = parseFloat(totalAmount) || 0;
    const discount = parseFloat(discountAmount) || 0;
    return total - discount;
  };

  const getTotalSplitAmount = () => {
    return memberSplits.reduce((sum, split) => sum + split.amount, 0);
  };

  // Item management functions
  const handleAddItem = () => {
    const newItem: EditableItem = {
      id: `new-${Date.now()}`,
      name: '',
      quantity: 1,
      rate: 0,
      amount: 0,
      assignedMembers: [],
      memberQuantities: {},
      isNew: true,
      isEditing: true
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const handleItemChange = (itemId: string, field: keyof EditableItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          updated.amount = updated.quantity * updated.rate;
        }
        return updated;
      }
      return item;
    }));
  };

  const handleToggleMemberForItem = (itemId: string, memberId: string) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const isAssigned = item.assignedMembers.includes(memberId);
        const newAssigned = isAssigned
          ? item.assignedMembers.filter(id => id !== memberId)
          : [...item.assignedMembers, memberId];
        const newQuantities: Record<string, number> = {};
        const distributedQuantities = distributeEvenly(item.quantity, newAssigned.length);

        newAssigned.forEach((id, idx) => {
          newQuantities[id] = distributedQuantities[idx] || 0;
        });

        return {
          ...item,
          assignedMembers: newAssigned,
          memberQuantities: newQuantities,
        };
      }
      return item;
    }));
  };

  const handleMemberQuantityChange = (itemId: string, memberId: string, nextQuantity: number) => {
    setItems(items.map(item => {
      if (item.id !== itemId) return item;
      const quantity = Math.max(0, nextQuantity || 0);
      const nextMemberQuantities: Record<string, number> = { ...item.memberQuantities };
      if (quantity > 0) {
        nextMemberQuantities[memberId] = roundTo(quantity);
      } else {
        delete nextMemberQuantities[memberId];
      }
      return {
        ...item,
        assignedMembers: quantity > 0
          ? Array.from(new Set([...item.assignedMembers, memberId]))
          : item.assignedMembers.filter((id) => id !== memberId),
        memberQuantities: nextMemberQuantities,
      };
    }));
  };

  const toggleAllMembersForItem = (itemId: string) => {
    setItems(items.map(item => {
      if (item.id !== itemId) return item;
      const allSelected = members.length > 0 && item.assignedMembers.length === members.length;
      if (allSelected) {
        return { ...item, assignedMembers: [], memberQuantities: {} };
      }
      const newAssigned = members.map(m => m.id);
      const distributedQuantities = distributeEvenly(item.quantity, newAssigned.length);
      const newQuantities: Record<string, number> = {};
      newAssigned.forEach((id, idx) => {
        newQuantities[id] = distributedQuantities[idx] || 0;
      });
      return { ...item, assignedMembers: newAssigned, memberQuantities: newQuantities };
    }));
  };

  const getDistributionError = (item: EditableItem) => {
    const assigned = Object.values(item.memberQuantities).reduce((sum, qty) => sum + qty, 0);
    if (Math.abs(assigned - item.quantity) <= 0.0001) return null;
    if (assigned > item.quantity) return 'Assigned quantity exceeds total quantity.';
    if (assigned !== item.quantity) return `Assigned ${roundTo(assigned)} / ${roundTo(item.quantity)}`;
    return null;
  };

  const handleToggleEdit = (itemId: string) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        return { ...item, isEditing: !item.isEditing };
      }
      return item;
    }));
  };

  const calculateItemsTotal = () => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };

  const [splitItemId, setSplitItemId] = useState<string | null>(null);

  const hasInvalidDistribution = isItemized && items.some((item) => !!getDistributionError(item));

  const getMemberColor = (memberId: string) => {
    const index = members.findIndex(m => m.id === memberId);
    return memberColors[index % memberColors.length];
  };

  const getAssignedQuantity = (item: EditableItem) =>
    roundTo(Object.values(item.memberQuantities).reduce((sum, qty) => sum + qty, 0));

  const evenSplitItem = (itemId: string) => {
    setItems(items.map((item) => {
      if (item.id !== itemId) return item;
      if (item.assignedMembers.length === 0) return item;

      const distributedQuantities = distributeEvenly(item.quantity, item.assignedMembers.length);
      const memberQuantities = item.assignedMembers.reduce<Record<string, number>>((acc, memberId, index) => {
        acc[memberId] = distributedQuantities[index] || 0;
        return acc;
      }, {});

      return {
        ...item,
        memberQuantities,
      };
    }));
  };

  const getMemberPayableAmount = (item: EditableItem, memberId: string) => {
    const consumed = item.memberQuantities[memberId] || 0;
    const perUnitRate = item.quantity > 0 ? item.amount / item.quantity : 0;
    return consumed * perUnitRate;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!title.trim()) {
        setError('Bill title is required');
        setIsLoading(false);
        return;
      }

      const totalAmountNum = parseFloat(totalAmount);
      const discountAmountNum = parseFloat(discountAmount) || 0;

      if (!totalAmountNum || totalAmountNum <= 0) {
        setError('Please enter a valid total amount');
        setIsLoading(false);
        return;
      }

      if (!paidBy) {
        setError('Please select who paid the bill');
        setIsLoading(false);
        return;
      }

      if (!isItemized) {
        const effectiveTotal = totalAmountNum - discountAmountNum;
        const splitTotal = getTotalSplitAmount();
        if (Math.abs(effectiveTotal - splitTotal) > 0.01) {
          setError(`Split amounts (${formatAmount(splitTotal)}) must equal total after discount (${formatAmount(effectiveTotal)})`);
          setIsLoading(false);
          return;
        }
      }

      // Update the bill
      await updateBillMutation.mutateAsync({
        id: bill.id,
        title,
        description,
        total_amount: totalAmountNum,
        discount_amount: discountAmountNum,
        discount_excluded_members: discountExcludedMembers,
        currency: currency.code,
        paid_by: paidBy || null,
        is_itemized: isItemized,
      });

      // Handle items if bill is itemized
      if (isItemized && items.length > 0) {
        const invalidItems = items.filter((item) => item.assignedMembers.length === 0 || getDistributionError(item));
        if (invalidItems.length > 0) {
          throw new Error('Please assign quantities correctly for each item before saving.');
        }
        await updateBillItemsMutation.mutateAsync({
          billId: bill.id,
          items: items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.amount,
            memberQuantities: item.memberQuantities
          }))
        });
        // Recalculate splits based on item assignments
        const memberShares: Record<string, number> = {};
        items.forEach(item => {
          if (item.assignedMembers.length > 0) {
            const perUnitRate = item.quantity > 0 ? item.amount / item.quantity : 0;
            Object.entries(item.memberQuantities)
              .filter(([, consumedQty]) => consumedQty > 0)
              .forEach(([memberId, consumedQty]) => {
                memberShares[memberId] = (memberShares[memberId] || 0) + (perUnitRate * consumedQty);
              });
          }
        });

        const discount = discountAmountNum;
        const membersWithShares = Object.keys(memberShares);
        const eligibleMembers = membersWithShares.filter(id => !discountExcludedMembers.includes(id));
        const discountPerMember = eligibleMembers.length > 0 ? discount / eligibleMembers.length : 0;

        for (const [memberId, shareAmount] of Object.entries(memberShares)) {
          const isExcluded = discountExcludedMembers.includes(memberId);
          const finalAmount = Math.max(0, shareAmount - (isExcluded ? 0 : discountPerMember));
          await supabase
            .from('settlegara_bill_splits')
            .update({ amount: Math.round(finalAmount * 100) / 100 })
            .eq('bill_id', bill.id)
            .eq('member_id', memberId);
        }
      } else if (!isItemized) {
        // Update splits for non-itemized bill
        for (const split of memberSplits) {
          if (split.amount > 0) {
            // Upsert split
            const { data: existingSplit } = await supabase
              .from('settlegara_bill_splits')
              .select('id')
              .eq('bill_id', bill.id)
              .eq('member_id', split.memberId)
              .maybeSingle();

            if (existingSplit) {
              await supabase
                .from('settlegara_bill_splits')
                .update({ amount: split.amount })
                .eq('id', existingSplit.id);
            } else {
              await supabase
                .from('settlegara_bill_splits')
                .insert({
                  bill_id: bill.id,
                  member_id: split.memberId,
                  amount: split.amount,
                  status: 'unpaid'
                });
            }
          }
        }

        // Delete items if switching from itemized to non-itemized
        const { data: existingItems } = await supabase
          .from('settlegara_bill_items')
          .select('id')
          .eq('bill_id', bill.id);

        if (existingItems && existingItems.length > 0) {
          const existingItemIds = existingItems.map(item => item.id);
          await supabase
            .from('settlegara_item_assignments')
            .delete()
            .in('item_id', existingItemIds);
          await supabase
            .from('settlegara_bill_items')
            .delete()
            .eq('bill_id', bill.id);
        }
      }

      toast({
        title: "Success",
        description: "Bill updated successfully",
      });

      if (onSuccess) {
        onSuccess();
      } else {
        navigate(`/settlebill/bills/${bill.id}`);
      }
    } catch (error: any) {
      console.error('Error updating bill:', error);
      setError(error.message || 'Failed to update bill');
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Dinner at Restaurant"
              required
              disabled={isLoading}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details about the bill..."
              rows={3}
              disabled={isLoading}
              className="w-full resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  value={totalAmount}
                  onChange={(e) => handleTotalAmountChange(e.target.value)}
                  placeholder="0.00"
                  required
                  disabled={isLoading}
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
                  value={discountAmount}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                  placeholder="0.00"
                  disabled={isLoading}
                  className="pl-8 w-full"
                />
              </div>
              {discountAmount && parseFloat(discountAmount) > 0 && (
                <p className="text-xs text-green-600">
                  Effective total: {formatAmount(getEffectiveTotal())}
                </p>
              )}
            </div>
          </div>

          {/* Discount Exclusion */}
          {discountAmount && parseFloat(discountAmount) > 0 && members.length > 0 && (
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

          {members.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="paid_by">Paid By *</Label>
              <Select value={paidBy} onValueChange={setPaidBy} disabled={isLoading}>
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

        {/* Itemized Toggle */}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="space-y-0.5">
            <Label htmlFor="itemized-toggle" className="text-base font-medium">Itemized Bill</Label>
            <p className="text-sm text-muted-foreground">
              Track individual items and assign them to specific members
            </p>
          </div>
          <Switch
            id="itemized-toggle"
            checked={isItemized}
            onCheckedChange={setIsItemized}
          />
        </div>

        {/* Non-itemized: Member Splits */}
        {!isItemized && members.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5" />
                Split Between Members ({memberSplits.filter(s => s.amount > 0).length} of {memberSplits.length})
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
                    <span className="text-muted-foreground">{currency.symbol}</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={split.amount}
                      onChange={(e) => handleMemberAmountChange(split.memberId, e.target.value)}
                      className="w-20 sm:w-24"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center pt-3 border-t">
                <span className="font-medium text-sm md:text-base">Total Split Amount:</span>
                <span className={`font-bold text-sm md:text-base ${Math.abs(getEffectiveTotal() - getTotalSplitAmount()) > 0.01 ? 'text-destructive' : 'text-teal-600'}`}>
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

        {/* Items Section - Only for itemized bills */}
        {isItemized && (
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold">Bill Items</h3>
                <Badge variant="secondary">{items.length} items</Badge>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            </div>

            {items.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead className="w-16">Qty</TableHead>
                      <TableHead className="w-24">Rate</TableHead>
                      <TableHead className="w-24">Amount</TableHead>
                      <TableHead>Person</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          {item.isEditing ? (
                            <Input
                              value={item.name}
                              onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                              placeholder="Item name"
                              className="h-8"
                            />
                          ) : (
                            <span className="font-medium">{item.name || 'Unnamed item'}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.isEditing ? (
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                              className="h-8 w-16"
                              min="1"
                            />
                          ) : (
                            item.quantity
                          )}
                        </TableCell>
                        <TableCell>
                          {item.isEditing ? (
                            <Input
                              type="number"
                              value={item.rate}
                              onChange={(e) => handleItemChange(item.id, 'rate', parseFloat(e.target.value) || 0)}
                              className="h-8 w-20"
                              min="0"
                              step="0.01"
                            />
                          ) : (
                            formatAmount(item.rate)
                          )}
                        </TableCell>
                        <TableCell className="font-semibold">{formatAmount(item.amount)}</TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {members.map((member) => {
                                const isAssigned = item.assignedMembers.includes(member.id);
                                return (
                                  <label
                                    key={member.id}
                                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-colors ${
                                      isAssigned 
                                        ? getMemberColor(member.id) 
                                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    }`}
                                  >
                                    <Checkbox
                                      checked={isAssigned}
                                      onCheckedChange={() => handleToggleMemberForItem(item.id, member.id)}
                                      className="h-3.5 w-3.5"
                                    />
                                    <span className="text-xs font-medium">{member.user_name}</span>
                                    {isAssigned && (
                                      <span className="text-xs opacity-75">
                                        ({(item.memberQuantities[member.id] ?? 0).toFixed(2)})
                                      </span>
                                    )}
                                  </label>
                                );
                              })}
                            </div>
                            {item.assignedMembers.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => evenSplitItem(item.id)}
                                >
                                  Evenly Divide
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => setSplitItemId(item.id)}
                                >
                                  <Users className="w-3 h-3 mr-1" />
                                  Split / Distribution
                                </Button>
                              </div>
                            )}
                            {getDistributionError(item) && (
                              <p className="text-xs text-destructive">{getDistributionError(item)}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleEdit(item.id)}
                              className="h-8 w-8 p-0"
                            >
                              {item.isEditing ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Pencil className="w-4 h-4 text-muted-foreground" />
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(item.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 border rounded-lg bg-muted/50">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">No items added yet</p>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="mt-3">
                  <Plus className="w-4 h-4 mr-1" />
                  Add First Item
                </Button>
              </div>
            )}

            {items.length > 0 && (
              <div className="flex justify-end">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <span className="text-sm text-muted-foreground">Items Total: </span>
                  <span className="font-bold text-lg">{formatAmount(calculateItemsTotal())}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
          <Button
            type="submit"
            disabled={isLoading || hasInvalidDistribution || !title.trim() || !paidBy}
            className="flex-1 bg-teal-600 hover:bg-teal-700"
          >
            {isLoading ? 'Updating Bill...' : 'Update Bill'}
          </Button>
          {onClose && (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>

    {/* Split Distribution Dialog */}
    <Dialog open={!!splitItemId} onOpenChange={(open) => !open && setSplitItemId(null)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Item Distribution</DialogTitle>
        </DialogHeader>
        {splitItemId && (() => {
          const currentItem = items.find((item) => item.id === splitItemId);
          if (!currentItem) return <p className="text-sm text-muted-foreground">Item not found.</p>;
          const assignedQuantity = getAssignedQuantity(currentItem);
          const distributionError = getDistributionError(currentItem);
          const perUnitRate = currentItem.quantity > 0 ? currentItem.amount / currentItem.quantity : 0;

          return (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{currentItem.name}</p>
                <p>Total Qty: {currentItem.quantity} • Per Unit Rate: {perUnitRate.toFixed(2)}</p>
              </div>
              <div className="flex justify-end gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAllMembersForItem(currentItem.id)}
                >
                  {members.length > 0 && currentItem.assignedMembers.length === members.length
                    ? 'Deselect All'
                    : 'Select All'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => evenSplitItem(currentItem.id)}
                >
                  Evenly Divide This Item
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Person</TableHead>
                    <TableHead className="text-right">Consumed Quantity</TableHead>
                    <TableHead className="text-right">Amount Preview</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => {
                    const isAssigned = currentItem.assignedMembers.includes(member.id);
                    const currentQty = currentItem.memberQuantities[member.id] ?? 0;
                    const presets = [0, 0.25, 0.5, 1];
                    if (currentItem.quantity > 1 && !presets.includes(currentItem.quantity)) {
                      presets.push(currentItem.quantity);
                    }
                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={isAssigned}
                              onCheckedChange={() => handleToggleMemberForItem(currentItem.id, member.id)}
                            />
                            <span>{member.user_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-1 justify-end flex-wrap">
                            {presets.map((val) => (
                              <Button
                                key={val}
                                type="button"
                                variant={currentQty === val ? 'default' : 'outline'}
                                size="sm"
                                className="h-7 px-2 text-xs min-w-[36px]"
                                onClick={() => handleMemberQuantityChange(currentItem.id, member.id, val)}
                              >
                                {val}
                              </Button>
                            ))}
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={currentQty || ''}
                              placeholder="0"
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || val === '.') {
                                  handleMemberQuantityChange(currentItem.id, member.id, 0);
                                  return;
                                }
                                const parsed = parseFloat(val);
                                if (!isNaN(parsed)) {
                                  handleMemberQuantityChange(currentItem.id, member.id, parsed);
                                }
                              }}
                              className="h-7 w-16 text-center text-sm"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {getMemberPayableAmount(currentItem, member.id).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between text-sm">
                <p>Total allocated quantity: <span className="font-semibold">{assignedQuantity.toFixed(2)}</span></p>
                {distributionError ? (
                  <p className="text-destructive font-medium">{distributionError}</p>
                ) : (
                  <p className="text-green-600 font-medium">Balanced distribution</p>
                )}
              </div>
            </div>
          );
        })()}
      </DialogContent>
    </Dialog>
    </>
  );
};
