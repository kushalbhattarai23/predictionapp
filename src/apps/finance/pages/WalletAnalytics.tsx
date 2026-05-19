import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTransactions } from '@/hooks/useTransactions';
import { useWallets } from '@/hooks/useWallets';
import { useTransfers } from '@/hooks/useTransfers';
import { useCurrency } from '@/hooks/useCurrency';
import { convertEnglishToNepali } from '@/utils/dateConverter';
import { Wallet, BarChart3 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

type CalendarMode = 'english' | 'nepali';

const NEPALI_MONTHS = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra',
];

interface MonthData {
  key: string;
  label: string;
  startDate: string;
  endDate: string;
}

interface NepaliMonthData {
  key: string;
  label: string;
}

const parseNepaliDate = (dateString?: string | null) => {
  if (!dateString) return null;
  const parts = dateString.split(/[/-]/).map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return { year: parts[0], month: parts[1], day: parts[2] };
};

const WalletAnalytics: React.FC = () => {
  const { transactions } = useTransactions();
  const { wallets } = useWallets();
  const { transfers } = useTransfers();
  const { formatAmount } = useCurrency();
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('english');

  // English months
  const englishMonths = useMemo<MonthData[]>(() => {
    const monthSet = new Set<string>();
    transactions.forEach((t) => { if (t.date) monthSet.add(t.date.slice(0, 7)); });
    const today = new Date();
    monthSet.add(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
    return Array.from(monthSet)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => {
        const [y, m] = key.split('-').map(Number);
        return {
          key,
          label: new Date(y, m - 1, 1).toLocaleString('default', { month: 'short', year: 'numeric' }),
          startDate: `${key}-01`,
          endDate: new Date(y, m, 0).toISOString().split('T')[0],
        };
      });
  }, [transactions]);

  // Nepali months
  const nepaliMonths = useMemo<NepaliMonthData[]>(() => {
    const monthSet = new Set<string>();
    transactions.forEach((t) => {
      const p = parseNepaliDate(t.nepali_date);
      if (p) monthSet.add(`${p.year}-${String(p.month).padStart(2, '0')}`);
    });
    const nToday = convertEnglishToNepali(new Date());
    monthSet.add(`${nToday.year}-${String(nToday.month).padStart(2, '0')}`);
    return Array.from(monthSet)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => {
        const [y, m] = key.split('-').map(Number);
        return { key, label: `${NEPALI_MONTHS[m - 1]} ${y} BS` };
      });
  }, [transactions]);

  // Helper: filter transactions by nepali month key
  const isInNepaliMonth = (txn: typeof transactions[0], monthKey: string) => {
    const p = parseNepaliDate(txn.nepali_date);
    if (!p) return false;
    return `${p.year}-${String(p.month).padStart(2, '0')}` === monthKey;
  };

  const activeMonths = calendarMode === 'english' ? englishMonths : nepaliMonths;

  // Compute wallet timelines
  const walletTimelines = useMemo(() => {
    return wallets.map((wallet) => {
      const wTxns = transactions
        .filter((t) => t.wallet_id === wallet.id)
        .sort((a, b) => a.date.localeCompare(b.date));

      const getBalanceAtDate = (date: string) => {
        const txnNetAfter = wTxns
          .filter((t) => t.date > date)
          .reduce((s, t) => s + (t.income || 0) - (t.expense || 0), 0);
        const transferNetAfter = transfers
          .filter((tr) => tr.date > date)
          .reduce((s, tr) => {
            let effect = 0;
            if (tr.from_wallet_id === wallet.id) effect -= tr.amount;
            if (tr.to_wallet_id === wallet.id) effect += tr.amount;
            return s + effect;
          }, 0);
        return wallet.balance - txnNetAfter - transferNetAfter;
      };

      if (calendarMode === 'english') {
        const monthlyData = englishMonths.map((month) => {
          const dayBefore = new Date(new Date(month.startDate).getTime() - 86400000).toISOString().split('T')[0];
          const firstDay = getBalanceAtDate(dayBefore);
          const lastDay = getBalanceAtDate(month.endDate);
          const monthTxns = wTxns.filter((t) => t.date >= month.startDate && t.date <= month.endDate);
          const income = monthTxns.reduce((s, t) => s + (t.income || 0), 0);
          const expense = monthTxns.reduce((s, t) => s + (t.expense || 0), 0);
          return {
            monthKey: month.key,
            label: month.label,
            firstDay,
            lastDay,
            income,
            expense,
            net: lastDay - firstDay,
          };
        });
        return { id: wallet.id, name: wallet.name, currentBalance: wallet.balance, monthlyData };
      } else {
        // For Nepali mode, group by nepali month, use english date range for balance reconstruction
        const monthlyData = nepaliMonths.map((nMonth) => {
          const monthTxns = wTxns.filter((t) => isInNepaliMonth(t, nMonth.key));
          const income = monthTxns.reduce((s, t) => s + (t.income || 0), 0);
          const expense = monthTxns.reduce((s, t) => s + (t.expense || 0), 0);

          // Get english date range for this nepali month's transactions
          const dates = monthTxns.map((t) => t.date).sort();
          const allDates = transactions.filter((t) => isInNepaliMonth(t, nMonth.key)).map((t) => t.date).sort();
          const firstEngDate = allDates.length > 0 ? allDates[0] : null;
          const lastEngDate = allDates.length > 0 ? allDates[allDates.length - 1] : null;

          let firstDay = 0, lastDay = 0;
          if (firstEngDate) {
            const dayBefore = new Date(new Date(firstEngDate).getTime() - 86400000).toISOString().split('T')[0];
            firstDay = getBalanceAtDate(dayBefore);
          }
          if (lastEngDate) {
            lastDay = getBalanceAtDate(lastEngDate);
          }

          return {
            monthKey: nMonth.key,
            label: nMonth.label,
            firstDay,
            lastDay,
            income,
            expense,
            net: lastDay - firstDay,
          };
        });
        return { id: wallet.id, name: wallet.name, currentBalance: wallet.balance, monthlyData };
      }
    });
  }, [wallets, transactions, transfers, calendarMode, englishMonths, nepaliMonths]);

  // Totals per month
  const monthTotals = useMemo(() => {
    const monthCount = calendarMode === 'english' ? englishMonths.length : nepaliMonths.length;
    const labels = calendarMode === 'english' ? englishMonths.map((m) => ({ key: m.key, label: m.label })) : nepaliMonths.map((m) => ({ key: m.key, label: m.label }));
    return labels.map((month, idx) => {
      let firstDay = 0, lastDay = 0, income = 0, expense = 0;
      walletTimelines.forEach((w) => {
        const md = w.monthlyData[idx];
        if (md) {
          firstDay += md.firstDay;
          lastDay += md.lastDay;
          income += md.income;
          expense += md.expense;
        }
      });
      return {
        monthKey: month.key,
        label: month.label,
        firstDay,
        lastDay,
        income,
        expense,
        net: lastDay - firstDay,
      };
    });
  }, [walletTimelines, calendarMode, englishMonths, nepaliMonths]);

  const fmt = (v: number) => formatAmount(v);
  const colorClass = (v: number) => v >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <>
      <Helmet>
        <title>Wallet Analytics | Finance | Track Hub</title>
        <meta name="description" content="Timeline analytics for all wallets showing monthly first day and last day balances." />
      </Helmet>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">Wallet Analytics</h1>
            <p className="text-muted-foreground text-sm">
              Monthly timeline of 1st day & last day balances for each wallet.
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={calendarMode} onValueChange={(v) => setCalendarMode(v as CalendarMode)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Calendar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English Date</SelectItem>
                <SelectItem value="nepali">Nepali Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Total Balance Timeline */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle className="text-primary text-lg">Total Balance Timeline</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:px-6 sm:pb-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">1st Day</TableHead>
                    <TableHead className="text-right">Last Day</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...monthTotals].reverse().map((mt) => (
                    <TableRow key={mt.monthKey}>
                      <TableCell className="font-medium">{mt.label}</TableCell>
                      <TableCell className="text-right">{fmt(mt.firstDay)}</TableCell>
                      <TableCell className="text-right font-semibold">{fmt(mt.lastDay)}</TableCell>
                      <TableCell className={`text-right font-semibold ${colorClass(mt.net)}`}>{fmt(mt.net)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Per-wallet timeline */}
        {walletTimelines.length > 0 ? (
          walletTimelines.map((wt) => (
            <Card key={wt.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    <CardTitle className="text-primary text-lg">{wt.name}</CardTitle>
                  </div>
                  <span className="text-sm font-semibold text-primary">{fmt(wt.currentBalance)}</span>
                </div>
              </CardHeader>
              <CardContent className="p-0 sm:px-6 sm:pb-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">1st Day</TableHead>
                        <TableHead className="text-right">Last Day</TableHead>
                        <TableHead className="text-right">Net</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...wt.monthlyData].reverse().map((md) => (
                        <TableRow key={md.monthKey}>
                          <TableCell className="font-medium">{md.label}</TableCell>
                          <TableCell className="text-right">{fmt(md.firstDay)}</TableCell>
                          <TableCell className="text-right font-semibold">{fmt(md.lastDay)}</TableCell>
                          <TableCell className={`text-right font-semibold ${colorClass(md.net)}`}>{fmt(md.net)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Wallet className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Wallets</h3>
              <p className="text-muted-foreground">Create wallets first to see analytics.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default WalletAnalytics;
