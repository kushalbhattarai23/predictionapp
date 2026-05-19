import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Undo2 } from 'lucide-react';
import { usePublicFinalCalculationShare, useUpdateFinalCalculationShare } from '@/hooks/useFinalCalculationShares';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  useNetworkBillSplits,
  useMarkMultipleSplitsAsPaid,
  useMarkSplitAsUnpaid,
} from '@/hooks/useSettleGaraBillSplits';

export const PublicFinalCalculationPage: React.FC = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const { data, isLoading, error } = usePublicFinalCalculationShare(shareId || '');
  const { user } = useAuth();
  const updateShare = useUpdateFinalCalculationShare();
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingIdx, setPendingIdx] = useState<number | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('');

  const share = data as any;
  const networkId = share?.network_id as string | undefined;
  const { data: billSplits, refetch: refetchSplits } = useNetworkBillSplits(networkId || '');
  const markMultipleAsPaid = useMarkMultipleSplitsAsPaid();
  const markAsUnpaid = useMarkSplitAsUnpaid();

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user?.email || !networkId) {
        setIsAdmin(false);
        return;
      }
      const { data: member } = await supabase
        .from('settlegara_network_members')
        .select('role, user_name')
        .eq('network_id', networkId)
        .eq('user_email', user.email)
        .eq('status', 'active')
        .maybeSingle();
      setIsAdmin(member?.role === 'admin');
      setCurrentUserName(member?.user_name || user.email || '');
    };
    checkAdmin();
  }, [user?.email, networkId]);

  if (isLoading) {
    return <div className="p-6 text-center">Loading final calculation...</div>;
  }

  if (error || !share?.payload) {
    return <div className="p-6 text-center">Public final calculation not found.</div>;
  }

  const payload = share.payload;
  const imageUrls = payload.imageUrls || [];
  const memberAvatars: Record<string, string> = payload.memberAvatars || {};
  const currencySymbol = payload.currencySymbol || '$';

  const getAvatarUrl = (path: string) => {
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    return urlData.publicUrl;
  };

  const MemberAvatar = ({ name }: { name: string }) => {
    const avatarPath = memberAvatars[name];
    return (
      <Avatar className="h-6 w-6 inline-flex mr-2">
        {avatarPath && <AvatarImage src={getAvatarUrl(avatarPath)} alt={name} />}
        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
          {name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    );
  };

  const formatAmount = (amount: number) => `${currencySymbol} ${amount.toLocaleString()}`;

  // Find bill split IDs that correspond to a settlement edge (from -> to, amount).
  // Handles both direct splits (A owes B) and simplified/transitive paths (A -> B -> C).
  const findSplitIdsForSettlement = (
    fromName: string,
    toName: string,
    targetAmount: number,
    statusFilter: 'unpaid' | 'paid'
  ): string[] => {
    const splits = (billSplits || []).filter((s: any) => {
      const payerId = s.payer_id;
      return s.status === statusFilter && s.member_id !== payerId;
    });

    // Direct match first
    const direct = splits.filter(
      (s: any) => s.member_name === fromName && s.payer_name === toName
    );
    if (direct.length > 0) {
      // Greedily pick splits up to target amount
      const sorted = [...direct].sort((a: any, b: any) => Number(b.amount) - Number(a.amount));
      const picked: string[] = [];
      let consumed = 0;
      for (const s of sorted) {
        if (consumed >= targetAmount - 0.01) break;
        picked.push(s.id);
        consumed += Number(s.amount);
      }
      return picked.length > 0 ? picked : direct.map((s: any) => s.id);
    }

    // BFS through debt graph for simplified path
    const edges = new Map<string, Map<string, any[]>>();
    splits.forEach((s: any) => {
      const from = s.member_name || '';
      const to = s.payer_name || '';
      if (!from || !to) return;
      if (!edges.has(from)) edges.set(from, new Map());
      const inner = edges.get(from)!;
      if (!inner.has(to)) inner.set(to, []);
      inner.get(to)!.push(s);
    });

    const prev = new Map<string, string>();
    const visited = new Set<string>([fromName]);
    const queue: string[] = [fromName];
    let found = false;
    while (queue.length > 0) {
      const node = queue.shift()!;
      if (node === toName) { found = true; break; }
      const next = edges.get(node);
      if (!next) continue;
      for (const neighbor of next.keys()) {
        if (visited.has(neighbor)) continue;
        visited.add(neighbor);
        prev.set(neighbor, node);
        queue.push(neighbor);
      }
    }
    if (!found) return [];

    const path: string[] = [toName];
    let cur = toName;
    while (prev.has(cur)) {
      cur = prev.get(cur)!;
      path.unshift(cur);
    }

    const ids: string[] = [];
    for (let i = 0; i < path.length - 1; i++) {
      const hopSplits = edges.get(path[i])?.get(path[i + 1]) || [];
      const sorted = [...hopSplits].sort((a, b) => Number(b.amount) - Number(a.amount));
      let consumed = 0;
      for (const sp of sorted) {
        if (consumed >= targetAmount - 0.01) break;
        ids.push(sp.id);
        consumed += Number(sp.amount);
      }
    }
    return ids;
  };

  const togglePaid = async (index: number, markPaid: boolean) => {
    if (!isAdmin || !share?.id || !networkId) return;
    setPendingIdx(index);
    const row = payload.settlementRows[index];
    const newRows = payload.settlementRows.map((r: any, i: number) =>
      i === index
        ? {
            ...r,
            paid: markPaid,
            paidAt: markPaid ? new Date().toISOString() : undefined,
            paidBy: markPaid ? currentUserName : undefined,
          }
        : r
    );
    try {
      // 1) Sync underlying bill splits so Network Settlements stays in agreement
      const splitIds = findSplitIdsForSettlement(
        row.from,
        row.to,
        Number(row.amount) || 0,
        markPaid ? 'unpaid' : 'paid'
      );

      if (markPaid && splitIds.length > 0) {
        await markMultipleAsPaid.mutateAsync(splitIds);
      } else if (!markPaid && splitIds.length > 0) {
        // Mark each split back to unpaid (no bulk mutation available)
        for (const id of splitIds) {
          await markAsUnpaid.mutateAsync(id);
        }
      }

      // 2) Persist on the shared payload so public viewers see the updated status
      await updateShare.mutateAsync({
        id: share.id,
        networkId,
        payload: { ...payload, settlementRows: newRows },
      });

      await refetchSplits();
      toast.success(markPaid ? 'Marked as paid' : 'Marked as unpaid');
    } catch (e) {
      console.error(e);
      toast.error('Failed to update payment status');
    } finally {
      setPendingIdx(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Final Amount Calculation (Public)</CardTitle>
            <p className="text-sm text-muted-foreground">Network: {payload.networkName}</p>
            <p className="text-sm text-muted-foreground">Calculation Date: {new Date(payload.calculationDate).toLocaleString()}</p>
          </CardHeader>
        </Card>

        {imageUrls.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attached Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {imageUrls.map((url: string, index: number) => (
                  <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="block">
                    <img
                      src={url}
                      alt={`Attachment ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg border hover:opacity-90 transition-opacity cursor-pointer"
                    />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Member Final Amounts</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Items ordered</TableHead>
                  <TableHead className="text-right">Items subtotal</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">Final amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payload.finalAmountRows.map((row: any) => (
                  <TableRow key={row.member}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <MemberAvatar name={row.member} />
                        {row.member}
                      </div>
                    </TableCell>
                    <TableCell>
                      {row.itemsOrdered ? (
                        <div className="space-y-1">
                          {row.itemsOrdered
                            .split(' | ')
                            .map((entry: string) => entry.trim())
                            .filter(Boolean)
                            .map((entry: string, index: number) => (
                              <p key={`${row.member}-entry-${index}`} className="text-sm">
                                {entry}
                              </p>
                            ))}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">{formatAmount(row.itemsSubtotal)}</TableCell>
                    <TableCell className="text-right text-green-600">
                      {(row.discountShare || 0) > 0 ? `-${formatAmount(row.discountShare || 0)}` : '-'}
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formatAmount(row.finalAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Payable / Receivable Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead className="text-right">Payable</TableHead>
                  <TableHead className="text-right">Receivable</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payload.breakdownRows.map((row: any) => (
                  <TableRow key={row.member}>
                    <TableCell>
                      <div className="flex items-center">
                        <MemberAvatar name={row.member} />
                        {row.member}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatAmount(row.payable)}</TableCell>
                    <TableCell className="text-right">{formatAmount(row.receivable)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatAmount(row.net)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 text-sm text-muted-foreground">
              Total payable: {formatAmount(payload.totals.totalPayable)} • Total receivable: {formatAmount(payload.totals.totalReceivable)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Final Settlement Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {payload.settlementRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No settlement actions required.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead className="text-right">Action</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payload.settlementRows.map((row: any, index: number) => {
                    // Derive live status from underlying bill splits so this view
                    // stays in sync with Network Settlements.
                    const unpaidMatches = findSplitIdsForSettlement(
                      row.from,
                      row.to,
                      Number(row.amount) || 0,
                      'unpaid'
                    );
                    const paid = billSplits ? unpaidMatches.length === 0 : !!row.paid;
                    return (
                      <TableRow
                        key={`${row.from}-${row.to}-${index}`}
                        className={paid ? 'bg-green-100 hover:bg-green-100' : ''}
                      >
                        <TableCell>
                          <div className="flex items-center">
                            <MemberAvatar name={row.from} />
                            {row.from}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <MemberAvatar name={row.to} />
                            {row.to}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{formatAmount(row.amount)}</TableCell>
                        <TableCell>
                          {paid ? (
                            <div className="flex flex-col gap-0.5">
                              <Badge className="bg-green-600 hover:bg-green-600 text-white w-fit">
                                <Check className="w-3 h-3 mr-1" /> Paid
                              </Badge>
                              {row.paidAt && (
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(row.paidAt).toLocaleDateString()}
                                  {row.paidBy ? ` • by ${row.paidBy}` : ''}
                                </span>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline">Unpaid</Badge>
                          )}
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            {paid ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={pendingIdx === index}
                                onClick={() => togglePaid(index, false)}
                              >
                                <Undo2 className="w-3 h-3 mr-1" /> Unmark
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                disabled={pendingIdx === index}
                                onClick={() => togglePaid(index, true)}
                              >
                                <Check className="w-3 h-3 mr-1" /> Mark as paid
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
