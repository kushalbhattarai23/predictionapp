
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useBills } from '@/hooks/useSettleGaraBills';
import { useBillSplits } from '@/hooks/useSettleGaraBillSplits';
import { supabase } from '@/integrations/supabase/client';
import { useNetworkMembers } from '@/hooks/useSettleBillNetworks';
import { useMemberItemsBreakdown } from '@/hooks/useSettleGaraBillItems';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
import { ArrowLeft, Receipt, Calendar, Edit, Users, DollarSign, ChevronDown, ChevronUp, ShoppingCart, Image as ImageIcon, ExternalLink } from 'lucide-react';

export const BillDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const { data: bills } = useBills();
  const { data: splits } = useBillSplits(id || '');
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());
  
  const bill = bills?.find(b => b.id === id);
  const { data: members } = useNetworkMembers(bill?.network_id || '');
  const { data: memberItemsBreakdown } = useMemberItemsBreakdown(id || '');

  // The person who paid the bill (paid_by) should always be considered "paid"
  const paidByMemberId = bill?.paid_by;
  
  const splitsWithCorrectedStatus = React.useMemo(() => 
    splits?.map(s => ({
      ...s,
      status: s.member_id === paidByMemberId ? 'paid' : s.status
    })),
    [splits, paidByMemberId]
  );

  const allPaid = splitsWithCorrectedStatus && splitsWithCorrectedStatus.length > 0 && splitsWithCorrectedStatus.every(s => s.status === 'paid');

  // Auto-settle: if all splits are paid, update bill status
  React.useEffect(() => {
    if (allPaid && bill && bill.status !== 'settled') {
      supabase
        .from('settlegara_bills')
        .update({ status: 'settled' })
        .eq('id', bill.id)
        .then(() => {
          // Trigger refetch
        });
    }
  }, [allPaid, bill?.status, bill?.id]);

  const toggleMemberExpanded = (memberId: string) => {
    setExpandedMembers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };

  if (!bill) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border border-teal-200 dark:border-teal-800">
            <CardContent className="p-8 text-center">
              <Receipt className="w-16 h-16 mx-auto mb-4 text-red-300 dark:text-red-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Bill not found</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">The bill you're looking for doesn't exist or has been deleted.</p>
              <Button onClick={() => navigate('/settlebill/bills')} className="bg-red-600 hover:bg-red-700">
                Back to Bills
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalAmount = Number(bill.total_amount);
  const currentUserMember = members?.find(m => m.user_email === user?.email);

  const handleBack = () => {
    navigate('/settlebill/bills');
  };

  const handleEdit = () => {
    navigate(`/settlebill/bills/${id}/edit`);
  };

  // Calculate totals for display
  const totalPaid = splitsWithCorrectedStatus?.filter(s => s.status === 'paid').reduce((sum, s) => sum + Number(s.amount), 0) || 0;
  const totalOwed = splitsWithCorrectedStatus?.filter(s => s.status !== 'paid').reduce((sum, s) => sum + Number(s.amount), 0) || 0;
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack} className="flex-shrink-0 hover:bg-red-100 dark:hover:bg-red-800">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 truncate">{bill.title}</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Added on {new Date(bill.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleEdit} className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>

        {/* Bill Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-red-200 dark:border-red-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatAmount(totalAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Paid</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatAmount(totalPaid)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-orange-200 dark:border-orange-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Owed</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {formatAmount(totalOwed)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bill Details */}
        <Card className="border border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-700 dark:text-red-300 flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Bill Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Bill Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Title:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{bill.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{formatAmount(totalAmount)}</span>
                  </div>
                  {bill.discount_amount && bill.discount_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                      <span className="font-medium text-green-600 dark:text-green-400">-{formatAmount(bill.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Final Amount:</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      {formatAmount(totalAmount - (bill.discount_amount || 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Currency:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{bill.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <Badge 
                      variant={bill.status === 'settled' ? 'default' : 'destructive'}
                      className={bill.status === 'settled' ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'}
                    >
                      {bill.status === 'settled' ? 'Settled' : 'Active'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Payment Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">People involved:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{splits?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Payments made:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">{splits?.filter(s => s.status === 'paid').length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Pending payments:</span>
                    <span className="font-medium text-orange-600 dark:text-orange-400">{splits?.filter(s => s.status === 'pending').length || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attached Bill Image */}
        {(bill as any).bill_image_url && (
          <Card className="border border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="text-purple-700 dark:text-purple-300 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Attached Bill / Receipt
                <a
                  href={(bill as any).bill_image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto inline-flex items-center gap-1 text-sm font-normal text-purple-600 hover:underline"
                >
                  Open <ExternalLink className="w-3 h-3" />
                </a>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href={(bill as any).bill_image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block max-h-[600px] overflow-hidden rounded-lg border border-purple-200 dark:border-purple-800"
              >
                <img
                  src={(bill as any).bill_image_url}
                  alt={`Receipt for ${bill.title}`}
                  className="w-full h-auto object-contain"
                  loading="lazy"
                />
              </a>
            </CardContent>
          </Card>
        )}

        {/* Payment Details with Itemized Breakdown */}
        <Card className="border border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-700 dark:text-red-300 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Payment Details
              {bill.is_itemized && (
                <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                  <ShoppingCart className="w-3 h-3 mr-1" />
                  Itemized
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {splitsWithCorrectedStatus && splitsWithCorrectedStatus.length > 0 ? (
              <div className="space-y-2">
                {splitsWithCorrectedStatus.map((split) => {
                  const member = members?.find(m => m.id === split.member_id);
                  const isCurrentUser = member?.user_email === user?.email;
                  const splitAmount = Number(split.amount);
                  const isPaid = split.status === 'paid';
                  const memberItems = memberItemsBreakdown?.[split.member_id] || [];
                  const hasItems = memberItems.length > 0;
                  const isExpanded = expandedMembers.has(split.member_id);
                  
                  // Calculate per-person discount share (excluding excluded members)
                  const excludedMembers = (bill as any).discount_excluded_members || [];
                  const isExcludedFromDiscount = excludedMembers.includes(split.member_id);
                  const eligibleSplitCount = (splits || []).filter(s => !excludedMembers.includes(s.member_id)).length;
                  const discountPerPerson = isExcludedFromDiscount ? 0 : ((bill.discount_amount || 0) / (eligibleSplitCount || 1));
                  const itemsTotal = memberItems.reduce((sum, i) => sum + i.shareAmount, 0);
                  
                  return (
                    <Collapsible key={split.id} open={isExpanded} onOpenChange={() => toggleMemberExpanded(split.member_id)}>
                      <div className={`rounded-lg border ${hasItems ? 'border-purple-200 dark:border-purple-800' : 'border-gray-200 dark:border-gray-700'}`}>
                        <CollapsibleTrigger asChild>
                          <div className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800`}>
                            <div className="flex items-center gap-4">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member?.user_email}`} />
                                <AvatarFallback className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400">
                                  {member?.user_name?.charAt(0).toUpperCase() || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                  {member?.user_name}
                                  {isCurrentUser && <span className="text-sm text-gray-500 dark:text-gray-400">(You)</span>}
                                  {hasItems && (
                                    <Badge variant="outline" className="text-xs">
                                      {memberItems.length} item{memberItems.length !== 1 ? 's' : ''}
                                    </Badge>
                                  )}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {isPaid ? 'Paid' : 'Owes'} {formatAmount(splitAmount)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <Badge 
                                  variant={isPaid ? 'default' : 'destructive'}
                                  className={isPaid ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'}
                                >
                                  {isPaid ? 'Paid' : 'Pending'}
                                </Badge>
                                <p className={`text-lg font-bold mt-1 ${isPaid ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                  {formatAmount(splitAmount)}
                                </p>
                              </div>
                              <div className="text-gray-400">
                                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                              </div>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 p-4">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                              <Receipt className="w-4 h-4" />
                              Amount Calculation for {member?.user_name}
                            </h4>
                            
                            {/* Show itemized breakdown */}
                            {bill.is_itemized ? (
                              <div className="space-y-2 mb-3">
                                <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-2">
                                  <ShoppingCart className="w-3 h-3 inline mr-1" />
                                  Items ordered:
                                </p>
                                {hasItems ? (
                                  memberItems.map((itemInfo, index) => (
                                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-white dark:bg-gray-800 rounded-md border border-purple-100 dark:border-purple-900">
                                      <div className="flex-1">
                                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                          {itemInfo.item.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          {itemInfo.item.quantity} × {formatAmount(itemInfo.item.rate)} = {formatAmount(itemInfo.item.amount)}
                                          {itemInfo.sharedWith > 1 && (
                                            <span className="ml-2 text-purple-600 dark:text-purple-400">
                                              ÷ {itemInfo.sharedWith} people
                                            </span>
                                          )}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-semibold text-purple-700 dark:text-purple-300">
                                          {formatAmount(itemInfo.shareAmount)}
                                        </p>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="py-2 px-3 bg-white dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                      No items assigned to this member
                                    </p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="py-2 px-3 bg-white dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700 mb-3">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Equal share of bill total
                                  </p>
                                  <p className="font-medium text-gray-900 dark:text-gray-100">
                                    {formatAmount(totalAmount)} ÷ {splits?.length || 1} = {formatAmount(totalAmount / (splits?.length || 1))}
                                  </p>
                                </div>
                              </div>
                            )}
                            
                            {/* Calculation Summary */}
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                              {hasItems && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">Items subtotal:</span>
                                  <span className="font-medium text-gray-900 dark:text-gray-100">
                                    {formatAmount(itemsTotal)}
                                  </span>
                                </div>
                              )}
                              
                              {(bill.discount_amount || 0) > 0 && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {isExcludedFromDiscount ? (
                                      <span className="text-red-500">Excluded from discount</span>
                                    ) : (
                                      <>Discount share ({formatAmount(bill.discount_amount || 0)} ÷ {eligibleSplitCount}):</>
                                    )}
                                  </span>
                                  <span className={`font-medium ${isExcludedFromDiscount ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                                    {isExcludedFromDiscount ? 'N/A' : `-${formatAmount(discountPerPerson)}`}
                                  </span>
                                </div>
                              )}
                              
                              <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-200 dark:border-gray-600">
                                <span className="text-gray-700 dark:text-gray-300">Final amount:</span>
                                <span className={isPaid ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}>
                                  {formatAmount(splitAmount)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-sm md:text-base">No payment details available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes and Comments Section */}
        <Card className="border border-teal-200 dark:border-teal-800">
          <CardHeader>
            <CardTitle className="text-teal-700 dark:text-teal-300">Notes and Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <textarea
                placeholder="Add a comment about this bill..."
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                rows={3}
              />
              <div className="flex justify-end">
                <Button className="bg-teal-600 hover:bg-teal-700 text-white px-6">
                  Post Comment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
