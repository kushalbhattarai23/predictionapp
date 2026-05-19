
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, Calculator, Trash2, Eye, ArrowRight, Check, Info, Undo2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNetworks, useDeleteNetwork } from '@/hooks/useSettleBillNetworks';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useNetworkBillSplits, useMarkMultipleSplitsAsPaid, useMarkSplitAsUnpaid } from '@/hooks/useSettleGaraBillSplits';
import { useQuery } from '@tanstack/react-query';

interface NetworkSettlement {
  from_user_name: string;
  to_user_name: string;
  amount: number;
}

export const NetworksList: React.FC = () => {
  const { data: networks, isLoading } = useNetworks();
  const deleteNetworkMutation = useDeleteNetwork();
  const { data: userPreferences } = useUserPreferences();
  const [viewingNetwork, setViewingNetwork] = useState<string | null>(null);
  const [settlements, setSettlements] = useState<NetworkSettlement[]>([]);
  const [loadingSettlements, setLoadingSettlements] = useState(false);
  const markMultipleAsPaidMutation = useMarkMultipleSplitsAsPaid();
  const markAsUnpaidMutation = useMarkSplitAsUnpaid();
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const { data: billSplits, refetch: refetchSplits } = useNetworkBillSplits(viewingNetwork || '');

  const { data: networkUnpaidCounts = {}, isLoading: isLoadingStatuses } = useQuery({
    queryKey: ['network-unpaid-counts', networks?.map((network) => network.id).join(',')],
    enabled: !!networks?.length,
    queryFn: async () => {
      const networkIds = (networks || []).map((network) => network.id);
      if (networkIds.length === 0) return {} as Record<string, number>;

      const { data: bills, error: billsError } = await supabase
        .from('settlegara_bills')
        .select('id, network_id')
        .in('network_id', networkIds)
        .eq('source_app', 'settlebill');

      if (billsError) throw billsError;
      if (!bills || bills.length === 0) return {} as Record<string, number>;

      const billToNetwork = new Map(bills.map((bill) => [bill.id, bill.network_id]));
      const billIds = bills.map((bill) => bill.id);

      const { data: unpaidSplitsByBill, error: splitsError } = await supabase
        .from('settlegara_bill_splits')
        .select('bill_id')
        .in('bill_id', billIds)
        .eq('status', 'unpaid');

      if (splitsError) throw splitsError;

      const counts: Record<string, number> = {};
      unpaidSplitsByBill?.forEach((split) => {
        const networkId = billToNetwork.get(split.bill_id);
        if (!networkId) return;
        counts[networkId] = (counts[networkId] || 0) + 1;
      });

      return counts;
    },
  });

  const currency = userPreferences?.preferred_currency || 'USD';
  const getCurrencySymbol = (curr: string) => {
    const symbols: { [key: string]: string } = {
      USD: '$', EUR: '€', GBP: '£', INR: '₹', NPR: 'रु', JPY: '¥'
    };
    return symbols[curr] || curr;
  };

  const handleViewSettlements = async (networkId: string) => {
    setViewingNetwork(networkId);
    setLoadingSettlements(true);
    try {
      const { data, error } = await supabase.rpc('get_network_settlements', { _network_id: networkId });
      if (error) throw error;
      setSettlements((data as NetworkSettlement[]) || []);
    } catch (error) {
      console.error('Error fetching settlements:', error);
      toast.error('Failed to load settlements');
      setSettlements([]);
    } finally {
      setLoadingSettlements(false);
    }
  };

  const handleMarkAllAsPaid = async (fromMemberName: string, toMemberName: string, targetAmount?: number) => {
    // Try direct match first (A -> C splits)
    const directSplits = unpaidSplits.filter(
      split => split.member_name === fromMemberName && split.payer_name === toMemberName
    );

    let splitIdsToMark: string[] = [];

    if (directSplits.length > 0) {
      splitIdsToMark = directSplits.map(s => s.id);
    } else {
      // No direct splits — this is a SIMPLIFIED/transitive settlement (A -> B -> C).
      // Build a debt graph of unpaid splits and find a path from A to C.
      // Group splits by debtor -> creditor edge.
      const edges = new Map<string, Map<string, typeof unpaidSplits>>();
      const debtors = new Set<string>();
      const creditors = new Set<string>();
      unpaidSplits.forEach(s => {
        const from = s.member_name || '';
        const to = s.payer_name || '';
        if (!from || !to) return;
        debtors.add(from);
        creditors.add(to);
        if (!edges.has(from)) edges.set(from, new Map());
        const inner = edges.get(from)!;
        if (!inner.has(to)) inner.set(to, []);
        inner.get(to)!.push(s);
      });

      // BFS to find shortest path from fromMemberName to toMemberName
      const prev = new Map<string, string>();
      const visited = new Set<string>([fromMemberName]);
      const queue: string[] = [fromMemberName];
      let found = false;
      while (queue.length > 0) {
        const node = queue.shift()!;
        if (node === toMemberName) { found = true; break; }
        const next = edges.get(node);
        if (!next) continue;
        for (const neighbor of next.keys()) {
          if (visited.has(neighbor)) continue;
          visited.add(neighbor);
          prev.set(neighbor, node);
          queue.push(neighbor);
        }
      }

      if (!found) {
        toast.error('No matching splits found');
        return;
      }

      // Reconstruct path
      const path: string[] = [toMemberName];
      let cur = toMemberName;
      while (prev.has(cur)) {
        cur = prev.get(cur)!;
        path.unshift(cur);
      }

      // For each hop on the path, greedily pick unpaid splits totalling ~targetAmount.
      const remaining = targetAmount ?? Infinity;
      for (let i = 0; i < path.length - 1; i++) {
        const hopSplits = edges.get(path[i])?.get(path[i + 1]) || [];
        // Sort largest first; consume up to remaining amount.
        const sorted = [...hopSplits].sort((a, b) => Number(b.amount) - Number(a.amount));
        let consumed = 0;
        for (const sp of sorted) {
          if (consumed >= remaining - 0.01) break;
          splitIdsToMark.push(sp.id);
          consumed += Number(sp.amount);
        }
      }

      if (splitIdsToMark.length === 0) {
        toast.error('No matching splits found');
        return;
      }
    }

    try {
      await markMultipleAsPaidMutation.mutateAsync(splitIdsToMark);
      toast.success(`Marked ${splitIdsToMark.length} split(s) as paid!`);
      // Refresh settlements
      if (viewingNetwork) {
        const { data, error } = await supabase.rpc('get_network_settlements', { _network_id: viewingNetwork });
        if (!error) {
          setSettlements((data as NetworkSettlement[]) || []);
        }
      }
      refetchSplits();
    } catch (error) {
      toast.error('Failed to mark as paid');
    }
  };

  const handleMarkAsUnpaid = async (splitId: string) => {
    try {
      await markAsUnpaidMutation.mutateAsync(splitId);
      toast.success('Payment marked as unpaid');
      if (viewingNetwork) {
        const { data, error } = await supabase.rpc('get_network_settlements', { _network_id: viewingNetwork });
        if (!error) {
          setSettlements((data as NetworkSettlement[]) || []);
        }
      }
      refetchSplits();
    } catch (error) {
      toast.error('Failed to mark as unpaid');
    }
  };

  const handleDelete = (networkId: string) => {
    if (confirm('Are you sure you want to delete this network?')) {
      deleteNetworkMutation.mutate(networkId, {
        onSuccess: () => {
          toast.success('Network deleted successfully');
        },
        onError: () => {
          toast.error('Failed to delete network');
        }
      });
    }
  };

  // Filter splits: unpaid splits where member is NOT the payer (exclude payer's own split)
  const unpaidSplits = billSplits?.filter(s => {
    const payerId = (s as any).payer_id;
    return s.status === 'unpaid' && s.member_id !== payerId;
  }) || [];
  const paidSplits = billSplits?.filter(s => s.status === 'paid') || [];
  const filteredNetworks = useMemo(() => {
    if (!networks) return [];
    if (statusFilter === 'all') return networks;
    return networks.filter((network) => {
      const unpaidCount = networkUnpaidCounts[network.id] || 0;
      const isActive = unpaidCount > 0;
      return statusFilter === 'active' ? isActive : !isActive;
    });
  }, [networks, networkUnpaidCounts, statusFilter]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!networks || networks.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No networks yet</h3>
        <p className="text-muted-foreground mb-6">Create your first network to start splitting bills</p>
        <Link to="/settlebill/networks/create">
          <Button className="bg-red-600 hover:bg-red-700">
            Create Network
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('all')}
          className={statusFilter === 'all' ? 'bg-red-600 hover:bg-red-700' : ''}
        >
          All
        </Button>
        <Button
          size="sm"
          variant={statusFilter === 'active' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('active')}
          className={statusFilter === 'active' ? 'bg-red-600 hover:bg-red-700' : ''}
        >
          Active
        </Button>
        <Button
          size="sm"
          variant={statusFilter === 'inactive' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('inactive')}
          className={statusFilter === 'inactive' ? 'bg-red-600 hover:bg-red-700' : ''}
        >
          Not Active
        </Button>
      </div>

      {filteredNetworks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
          No networks found for the selected filter.
        </div>
      ) : null}

      {filteredNetworks.map((network) => (
        <Card key={network.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-red-600" />
                  {network.name}
                </CardTitle>
                {network.description && (
                  <p className="text-muted-foreground mt-1">{network.description}</p>
                )}
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                <Button size="sm" variant="outline" onClick={() => handleViewSettlements(network.id)}>
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Link to={`/settlebill/networks/${network.id}`}>
                  <Button size="sm" variant="outline">
                    <Info className="w-4 h-4 mr-1" />
                    Details
                  </Button>
                </Link>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleDelete(network.id)}
                  disabled={deleteNetworkMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(network.created_at).toLocaleDateString()}
                </div>
              </div>
              {(() => {
                const isActive = (networkUnpaidCounts[network.id] || 0) > 0;
                if (isLoadingStatuses) {
                  return <Badge variant="secondary">Checking...</Badge>;
                }
                return (
                  <Badge variant={isActive ? 'secondary' : 'outline'}>
                    {isActive ? 'Active' : 'Not Active'}
                  </Badge>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Settlements Dialog */}
      <Dialog open={!!viewingNetwork} onOpenChange={() => setViewingNetwork(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gradient-to-br from-orange-50 to-amber-50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <Users className="w-5 h-5" />
              Network Settlements
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">
                Pending ({settlements.length})
              </TabsTrigger>
              <TabsTrigger value="debts">
                Debts
              </TabsTrigger>
              <TabsTrigger value="details">
                Details ({unpaidSplits.length}/{paidSplits.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending" className="mt-4">
              {loadingSettlements ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : settlements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  All settled! No pending payments.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>From</TableHead>
                      <TableHead></TableHead>
                      <TableHead>To</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settlements.map((s, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-destructive">{s.from_user_name}</TableCell>
                        <TableCell><ArrowRight className="w-4 h-4 text-muted-foreground" /></TableCell>
                        <TableCell className="font-medium text-green-600">{s.to_user_name}</TableCell>
                        <TableCell className="text-right font-bold">{getCurrencySymbol(currency)}{Number(s.amount).toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleMarkAllAsPaid(s.from_user_name, s.to_user_name, Number(s.amount))}
                            disabled={markMultipleAsPaidMutation.isPending}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Mark Paid
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="debts" className="mt-4">
              {loadingSettlements ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : (() => {
                const memberBalances: Record<string, { name: string; owes: number; getsBack: number; oweDetails: { to: string; amount: number }[] }> = {};
                
                unpaidSplits.forEach(split => {
                  const debtorName = split.member_name || 'Unknown';
                  const creditorName = split.payer_name || 'Unknown';
                  const amount = Number(split.amount);
                  
                  if (!memberBalances[debtorName]) memberBalances[debtorName] = { name: debtorName, owes: 0, getsBack: 0, oweDetails: [] };
                  memberBalances[debtorName].owes += amount;
                  memberBalances[debtorName].oweDetails.push({ to: creditorName, amount });
                  
                  if (!memberBalances[creditorName]) memberBalances[creditorName] = { name: creditorName, owes: 0, getsBack: 0, oweDetails: [] };
                  memberBalances[creditorName].getsBack += amount;
                });

                const members = Object.values(memberBalances).sort((a, b) => (b.getsBack - b.owes) - (a.getsBack - a.owes));

                if (members.length === 0) {
                  return <div className="text-center py-8 text-muted-foreground">All settled! No debts.</div>;
                }

                return (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground">Group Balances</h4>
                    {members.map((member) => {
                      const net = member.getsBack - member.owes;
                      const isCreditor = net > 0;
                      return (
                        <Card key={member.name} className="overflow-hidden">
                          <div className="flex flex-col sm:flex-row">
                            <div className="p-4 flex items-center gap-3 sm:w-1/3 border-b sm:border-b-0 sm:border-r border-border">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${isCreditor ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'}`}>
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{member.name}</p>
                                <p className={`text-sm ${isCreditor ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                  {isCreditor ? 'gets back' : 'owes'}
                                </p>
                                <p className={`text-lg font-bold ${isCreditor ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                  {getCurrencySymbol(currency)}{Math.abs(net).toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground">in total</p>
                              </div>
                            </div>
                            <div className="p-4 sm:w-2/3 space-y-1">
                              {member.oweDetails.map((d, i) => (
                                <p key={`owes-${i}`} className="text-sm text-muted-foreground">
                                  • <span className="font-medium text-foreground">{member.name}</span> owes {getCurrencySymbol(currency)}{d.amount.toFixed(2)} to <span className="font-medium text-foreground">{d.to}</span>
                                </p>
                              ))}
                              {unpaidSplits
                                .filter(s => s.payer_name === member.name)
                                .map((s, i) => (
                                  <p key={`gets-${i}`} className="text-sm text-muted-foreground">
                                    • <span className="font-medium text-foreground">{s.member_name}</span> owes {getCurrencySymbol(currency)}{Number(s.amount).toFixed(2)} to <span className="font-medium text-foreground">{member.name}</span>
                                  </p>
                                ))
                              }
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                );
              })()}
            </TabsContent>
            
            <TabsContent value="details" className="mt-4 space-y-4">
              {/* Unpaid Splits */}
              <div>
                <h4 className="font-semibold mb-2 text-destructive">Unpaid Splits</h4>
                {unpaidSplits.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No unpaid splits</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bill</TableHead>
                        <TableHead>Member Owes</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unpaidSplits.map((split) => (
                        <TableRow key={split.id}>
                          <TableCell className="font-medium">{split.bill_title}</TableCell>
                          <TableCell className="text-destructive">{split.member_name}</TableCell>
                          <TableCell className="text-green-600">{split.payer_name}</TableCell>
                          <TableCell className="text-right font-bold">
                            {getCurrencySymbol(currency)}{Number(split.amount).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleMarkAllAsPaid(split.member_name || '', split.payer_name || '')}
                              disabled={markMultipleAsPaidMutation.isPending}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Mark Paid
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
              
              {/* Paid Splits */}
              <div>
                <h4 className="font-semibold mb-2 text-green-600">Paid Splits</h4>
                {paidSplits.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No paid splits yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bill</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead>Paid To</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Settled</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paidSplits.map((split) => (
                        <TableRow key={split.id}>
                          <TableCell className="font-medium">{split.bill_title}</TableCell>
                          <TableCell>{split.member_name}</TableCell>
                          <TableCell>{split.payer_name}</TableCell>
                          <TableCell className="text-right font-bold text-green-600">
                            {getCurrencySymbol(currency)}{Number(split.amount).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {split.settled_at ? new Date(split.settled_at).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleMarkAsUnpaid(split.id)}
                              disabled={markAsUnpaidMutation.isPending}
                            >
                              <Undo2 className="w-4 h-4 mr-1" />
                              Unpaid
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};
