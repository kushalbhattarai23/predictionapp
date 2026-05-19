import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useTransactions } from '@/hooks/useTransactions';
import { useWallets } from '@/hooks/useWallets';
import { useTransfers } from '@/hooks/useTransfers';
import { useCurrency } from '@/hooks/useCurrency';
import { convertEnglishToNepali } from '@/utils/dateConverter';
import { Wallet, ArrowUpDown } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

type CalendarMode = 'english' | 'nepali';

const NEPALI_MONTHS = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra',
];

interface MonthOption {
  value: string;
  label: string;
  startDate?: string;
  endDate?: string;
}

interface NepaliDateParts {
  year: number;
  month: number;
  day: number;
}

const parseNepaliDate = (dateString?: string | null): NepaliDateParts | null => {
  if (!dateString) return null;
  const parts = dateString.split(/[/-]/).map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return { year: parts[0], month: parts[1], day: parts[2] };
};

const BalanceCheck: React.FC = () => {
  const { transactions } = useTransactions();
  const { wallets } = useWallets();
  const { transfers } = useTransfers();
  const { formatAmount } = useCurrency();

  const [calendarMode, setCalendarMode] = useState<CalendarMode>('english');

  const englishMonthOptions = useMemo<MonthOption[]>(() => {
    const monthSet = new Set<string>();
    transactions.forEach((t) => { if (t.date) monthSet.add(t.date.slice(0, 7)); });
    const today = new Date();
    monthSet.add(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
    return Array.from(monthSet)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => {
        const [y, m] = key.split('-').map(Number);
        return {
          value: key,
          label: new Date(y, m - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' }),
          startDate: `${key}-01`,
          endDate: new Date(y, m, 0).toISOString().split('T')[0],
        };
      });
  }, [transactions]);

  const nepaliMonthOptions = useMemo<MonthOption[]>(() => {
    const monthSet = new Set<string>();
    transactions.forEach((t) => {
      const p = parseNepaliDate(t.nepali_date);
      if (p) monthSet.add(`${p.year}-${String(p.month).padStart(2, '0')}`);
    });
    const nToday = convertEnglishToNepali(new Date());
    monthSet.add(`${nToday.year}-${String(nToday.month).padStart(2, '0')}`);
    return Array.from(monthSet)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => {
        const [y, m] = key.split('-').map(Number);
        return { value: key, label: `${NEPALI_MONTHS[m - 1]} ${y} BS` };
      });
  }, [transactions]);

  const [selectedEnglish, setSelectedEnglish] = useState('');
  const [selectedNepali, setSelectedNepali] = useState('');

  useEffect(() => {
    if (!selectedEnglish && englishMonthOptions.length) setSelectedEnglish(englishMonthOptions[0].value);
  }, [selectedEnglish, englishMonthOptions]);

  useEffect(() => {
    if (!selectedNepali && nepaliMonthOptions.length) setSelectedNepali(nepaliMonthOptions[0].value);
  }, [selectedNepali, nepaliMonthOptions]);

  const activeMonth = calendarMode === 'english' ? selectedEnglish : selectedNepali;

  const data = useMemo(() => {
    const selEng = englishMonthOptions.find((o) => o.value === selectedEnglish) || englishMonthOptions[0];
    const selNep = nepaliMonthOptions.find((o) => o.value === selectedNepali) || nepaliMonthOptions[0];

    const prevEngIdx = englishMonthOptions.findIndex((o) => o.value === selectedEnglish);
    const prevEng = prevEngIdx >= 0 ? englishMonthOptions[prevEngIdx + 1] : undefined;
    const prevNepIdx = nepaliMonthOptions.findIndex((o) => o.value === selectedNepali);
    const prevNep = prevNepIdx >= 0 ? nepaliMonthOptions[prevNepIdx + 1] : undefined;

    const walletData = wallets.map((wallet) => {
      const wTxns = transactions
        .filter((t) => t.wallet_id === wallet.id)
        .sort((a, b) => a.date.localeCompare(b.date));

      const filterMonth = (txn: typeof transactions[0]) => {
        if (calendarMode === 'english' && selEng) {
          return txn.date >= selEng.startDate! && txn.date <= selEng.endDate!;
        }
        if (calendarMode === 'nepali' && selNep) {
          const p = parseNepaliDate(txn.nepali_date);
          if (!p) return false;
          return `${p.year}-${String(p.month).padStart(2, '0')}` === selNep.value;
        }
        return false;
      };

      const filterPrev = (txn: typeof transactions[0]) => {
        if (calendarMode === 'english' && prevEng) {
          return txn.date >= prevEng.startDate! && txn.date <= prevEng.endDate!;
        }
        if (calendarMode === 'nepali' && prevNep) {
          const p = parseNepaliDate(txn.nepali_date);
          if (!p) return false;
          return `${p.year}-${String(p.month).padStart(2, '0')}` === prevNep.value;
        }
        return false;
      };

      const monthTxns = wTxns.filter(filterMonth);
      const prevTxns = wTxns.filter(filterPrev);

      const sumIncome = (txns: typeof transactions) => txns.reduce((s, t) => s + (t.income || 0), 0);
      const sumExpense = (txns: typeof transactions) => txns.reduce((s, t) => s + (t.expense || 0), 0);

      const getBalanceAtDate = (date: string) => {
        // Reverse transactions after that date
        const txnNetAfter = wTxns
          .filter((t) => t.date > date)
          .reduce((s, t) => s + (t.income || 0) - (t.expense || 0), 0);
        
        // Reverse transfers after that date
        const transferNetAfter = transfers
          .filter((tr) => tr.date > date)
          .reduce((s, tr) => {
            let effect = 0;
            if (tr.from_wallet_id === wallet.id) effect -= tr.amount; // money left this wallet
            if (tr.to_wallet_id === wallet.id) effect += tr.amount;   // money came to this wallet
            return s + effect;
          }, 0);
        
        return wallet.balance - txnNetAfter - transferNetAfter;
      };

      const firstDayBalance = selEng
        ? getBalanceAtDate(
            new Date(new Date(selEng.startDate!).getTime() - 86400000).toISOString().split('T')[0]
          )
        : null;
      const lastDayBalance = selEng ? getBalanceAtDate(selEng.endDate!) : null;

      // Previous month first & last day balances
      const prevFirstDayBalance = prevEng
        ? getBalanceAtDate(
            new Date(new Date(prevEng.startDate!).getTime() - 86400000).toISOString().split('T')[0]
          )
        : null;
      const prevLastDayBalance = prevEng ? getBalanceAtDate(prevEng.endDate!) : null;

      const currIncome = sumIncome(monthTxns);
      const currExpense = sumExpense(monthTxns);
      const prevIncome = sumIncome(prevTxns);
      const prevExpense = sumExpense(prevTxns);

      return {
        id: wallet.id,
        name: wallet.name,
        currentBalance: wallet.balance,
        firstDayBalance,
        lastDayBalance,
        prevFirstDayBalance,
        prevLastDayBalance,
        currIncome,
        currExpense,
        currNet: currIncome - currExpense,
        prevIncome,
        prevExpense,
        prevNet: prevIncome - prevExpense,
        totalSpent: currExpense,
      };
    });

    return {
      walletData,
      monthLabel:
        calendarMode === 'english'
          ? selEng?.label || 'Selected Month'
          : selNep?.label || 'Selected Month',
      prevMonthLabel:
        calendarMode === 'english'
          ? prevEng?.label || 'Previous Month'
          : prevNep?.label || 'Previous Month',
    };
  }, [transactions, wallets, transfers, calendarMode, englishMonthOptions, nepaliMonthOptions, selectedEnglish, selectedNepali]);

  const totals = useMemo(() => {
    const d = data.walletData;
    const safeSum = (fn: (w: typeof d[0]) => number | null) =>
      d.every((w) => fn(w) !== null) ? d.reduce((s, w) => s + (fn(w) ?? 0), 0) : null;
    return {
      currentBalance: d.reduce((s, w) => s + w.currentBalance, 0),
      firstDayBalance: safeSum((w) => w.firstDayBalance),
      lastDayBalance: safeSum((w) => w.lastDayBalance),
      prevFirstDayBalance: safeSum((w) => w.prevFirstDayBalance),
      prevLastDayBalance: safeSum((w) => w.prevLastDayBalance),
      totalSpent: d.reduce((s, w) => s + w.totalSpent, 0),
      currIncome: d.reduce((s, w) => s + w.currIncome, 0),
      currExpense: d.reduce((s, w) => s + w.currExpense, 0),
      currNet: d.reduce((s, w) => s + w.currNet, 0),
      prevIncome: d.reduce((s, w) => s + w.prevIncome, 0),
      prevExpense: d.reduce((s, w) => s + w.prevExpense, 0),
      prevNet: d.reduce((s, w) => s + w.prevNet, 0),
    };
  }, [data]);

  const fmt = (v: number | null) => (v !== null ? formatAmount(v) : '—');

  return (
    <>
      <Helmet>
        <title>Balance Check | Finance | Track Hub</title>
        <meta name="description" content="Check your wallet balances, monthly spending analytics, and first/last day balance tracking." />
      </Helmet>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header & Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">Balance Check</h1>
            <p className="text-muted-foreground text-sm">
              Track first & last day balances, monthly spending, and wallet-level analytics.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={calendarMode} onValueChange={(v) => setCalendarMode(v as CalendarMode)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Calendar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English Date</SelectItem>
                <SelectItem value="nepali">Nepali Date</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={activeMonth}
              onValueChange={calendarMode === 'english' ? setSelectedEnglish : setSelectedNepali}
            >
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {(calendarMode === 'english' ? englishMonthOptions : nepaliMonthOptions).map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card><CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">Current Balance</p>
            <p className="text-lg font-bold text-primary">{formatAmount(totals.currentBalance)}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">Monthly Income</p>
            <p className="text-lg font-bold text-green-600">{formatAmount(totals.currIncome)}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">Monthly Expense</p>
            <p className="text-lg font-bold text-red-600">{formatAmount(totals.currExpense)}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">Net ({data.monthLabel})</p>
            <p className={`text-lg font-bold ${totals.currNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatAmount(totals.currNet)}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">Prev Month Net</p>
            <p className={`text-lg font-bold ${totals.prevNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatAmount(totals.prevNet)}</p>
          </CardContent></Card>
        </div>

        {/* Balance Table */}
        {wallets.length > 0 ? (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5 text-primary" />
                <CardTitle className="text-primary text-lg">Wallet Balance Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 sm:px-6 sm:pb-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">SN</TableHead>
                      <TableHead>Wallet</TableHead>
                      <TableHead className="text-right">Current Balance</TableHead>
                      <TableHead className="text-right">Prev 1st Day</TableHead>
                      <TableHead className="text-right">Prev Last Day</TableHead>
                      <TableHead className="text-right">1st Day</TableHead>
                      <TableHead className="text-right">Last Day</TableHead>
                      <TableHead className="text-right">Income</TableHead>
                      <TableHead className="text-right">Expense</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.walletData.map((w, idx) => (
                      <TableRow key={w.id}>
                        <TableCell className="font-medium">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{w.name}</TableCell>
                        <TableCell className="text-right font-semibold text-primary">{formatAmount(w.currentBalance)}</TableCell>
                        <TableCell className="text-right">{fmt(w.prevFirstDayBalance)}</TableCell>
                        <TableCell className="text-right">{fmt(w.prevLastDayBalance)}</TableCell>
                        <TableCell className="text-right">{fmt(w.firstDayBalance)}</TableCell>
                        <TableCell className="text-right">{fmt(w.lastDayBalance)}</TableCell>
                        <TableCell className="text-right text-green-600">{formatAmount(w.currIncome)}</TableCell>
                        <TableCell className="text-right text-red-600">{formatAmount(w.currExpense)}</TableCell>
                        <TableCell className={`text-right font-semibold ${w.currNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatAmount(w.currNet)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2} className="font-bold">Total</TableCell>
                      <TableCell className="text-right font-bold text-primary">{formatAmount(totals.currentBalance)}</TableCell>
                      <TableCell className="text-right font-bold">{fmt(totals.prevFirstDayBalance)}</TableCell>
                      <TableCell className="text-right font-bold">{fmt(totals.prevLastDayBalance)}</TableCell>
                      <TableCell className="text-right font-bold">{fmt(totals.firstDayBalance)}</TableCell>
                      <TableCell className="text-right font-bold">{fmt(totals.lastDayBalance)}</TableCell>
                      <TableCell className="text-right font-bold text-green-600">{formatAmount(totals.currIncome)}</TableCell>
                      <TableCell className="text-right font-bold text-red-600">{formatAmount(totals.currExpense)}</TableCell>
                      <TableCell className={`text-right font-bold ${totals.currNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatAmount(totals.currNet)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Wallet className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Wallets</h3>
              <p className="text-muted-foreground">Create wallets first to see balance analytics.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default BalanceCheck;
