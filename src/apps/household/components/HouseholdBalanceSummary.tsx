import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { NetworkMember } from '@/hooks/useSettleBillNetworks';
import { useCurrency } from '@/hooks/useCurrency';
import { Wallet, ArrowRight } from 'lucide-react';

interface Props {
  networkId: string;
  members: NetworkMember[];
}

export const HouseholdBalanceSummary: React.FC<Props> = ({ networkId, members }) => {
  const { formatAmount } = useCurrency();

  const { data: bills } = useQuery({
    queryKey: ['household-all-bills', networkId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settlegara_bills')
        .select('*, settlegara_bill_splits(*)')
        .eq('network_id', networkId)
        .eq('source_app', 'household');
      if (error) throw error;
      return data;
    },
    enabled: !!networkId,
  });

  const balances = React.useMemo(() => {
    if (!bills || !members.length) return [];
    const memberBalances = new Map<string, { paid: number; owed: number }>();
    members.forEach(m => memberBalances.set(m.id, { paid: 0, owed: 0 }));

    bills.forEach(bill => {
      if (bill.paid_by && memberBalances.has(bill.paid_by)) {
        memberBalances.get(bill.paid_by)!.paid += Number(bill.total_amount);
      }
      bill.settlegara_bill_splits?.forEach((split: any) => {
        if (memberBalances.has(split.member_id)) {
          memberBalances.get(split.member_id)!.owed += Number(split.amount);
        }
      });
    });

    return members.map(m => {
      const balance = memberBalances.get(m.id) || { paid: 0, owed: 0 };
      return { ...m, totalPaid: balance.paid, totalOwed: balance.owed, netBalance: balance.paid - balance.owed };
    });
  }, [bills, members]);

  const settlements = React.useMemo(() => {
    const debtors = balances.filter(b => b.netBalance < -0.01).map(b => ({ ...b, amount: Math.abs(b.netBalance) }));
    const creditors = balances.filter(b => b.netBalance > 0.01).map(b => ({ ...b, amount: b.netBalance }));
    const result: { from: string; to: string; amount: number }[] = [];
    let di = 0, ci = 0;
    while (di < debtors.length && ci < creditors.length) {
      const settle = Math.min(debtors[di].amount, creditors[ci].amount);
      if (settle > 0.01) result.push({ from: debtors[di].user_name, to: creditors[ci].user_name, amount: settle });
      debtors[di].amount -= settle;
      creditors[ci].amount -= settle;
      if (debtors[di].amount <= 0.01) di++;
      if (creditors[ci].amount <= 0.01) ci++;
    }
    return result;
  }, [balances]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-sky-600" />
            Member Balances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead className="text-right">Total Paid</TableHead>
                <TableHead className="text-right">Total Owed</TableHead>
                <TableHead className="text-right">Net Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {balances.map(b => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.user_name}</TableCell>
                  <TableCell className="text-right font-mono text-green-600">{formatAmount(b.totalPaid)}</TableCell>
                  <TableCell className="text-right font-mono text-red-600">{formatAmount(b.totalOwed)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={b.netBalance >= 0 ? 'default' : 'destructive'}>
                      {b.netBalance >= 0 ? '+' : ''}{formatAmount(b.netBalance)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {settlements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Suggested Settlements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {settlements.map((s, i) => (
              <div key={i} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <span className="font-medium">{s.from}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{s.to}</span>
                <Badge variant="secondary" className="ml-auto">{formatAmount(s.amount)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
