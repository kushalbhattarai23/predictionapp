import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useTransactions } from '@/hooks/useTransactions';
import { useWallets } from '@/hooks/useWallets';
import { useTransfers } from '@/hooks/useTransfers';
import { useCurrency } from '@/hooks/useCurrency';
import { convertEnglishToNepali, convertNepaliToEnglish } from '@/utils/dateConverter';
import { Wallet, CheckCircle2, AlertTriangle, CalendarRange } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

type CalendarMode = 'english' | 'nepali';

const NEPALI_MONTHS = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra',
];

const ENGLISH_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface MonthOption {
  value: string;
  label: string;
  shortLabel: string;
  startDate?: string;
  endDate?: string;
  nepaliYear?: number;
  nepaliMonth?: number;
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

const BalanceMonth: React.FC = () => {
  const { transactions } = useTransactions();
  const { wallets } = useWallets();
  const { transfers } = useTransfers();
  const { formatAmount } = useCurrency();

  const [calendarMode, setCalendarMode] = useState<CalendarMode>('english');
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);

  // Build month options
  const englishMonthOptions = useMemo<MonthOption[]>(() => {
    const monthSet = new Set<string>();
    transactions.forEach((t) => { if (t.date) monthSet.add(t.date.slice(0, 7)); });
    const today = new Date();
    // Add current and previous 2 months
    for (let i = 0; i < 3; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      monthSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return Array.from(monthSet)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => {
        const [y, m] = key.split('-').map(Number);
        return {
          value: key,
          label: `${ENGLISH_MONTHS[m - 1]} ${y}`,
          shortLabel: `${ENGLISH_MONTHS[m - 1].slice(0, 3)} ${y}`,
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
    for (let i = 0; i < 3; i++) {
      let m = nToday.month - i;
      let y = nToday.year;
      if (m <= 0) { m += 12; y -= 1; }
      monthSet.add(`${y}-${String(m).padStart(2, '0')}`);
    }
    return Array.from(monthSet)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => {
        const [y, m] = key.split('-').map(Number);
        return {
          value: key,
          label: `${NEPALI_MONTHS[m - 1]} ${y} BS`,
          shortLabel: `${NEPALI_MONTHS[m - 1]} ${y}`,
          nepaliYear: y,
          nepaliMonth: m,
        };
      });
  }, [transactions]);

  const monthOptions = calendarMode === 'english' ? englishMonthOptions : nepaliMonthOptions;

  // Auto-select last 2 months
  useEffect(() => {
    if (monthOptions.length >= 2) {
      setSelectedMonths(monthOptions.slice(-2).map(o => o.value));
    } else if (monthOptions.length === 1) {
      setSelectedMonths([monthOptions[0].value]);
    }
  }, [calendarMode, monthOptions.length]);

  // Calculate balance at a specific English date for a wallet
  const getBalanceAtDate = (walletId: string, date: string) => {
    const wallet = wallets.find(w => w.id === walletId);
    if (!wallet) return 0;

    const wTxns = transactions.filter(t => t.wallet_id === walletId);

    const txnNetAfter = wTxns
      .filter(t => t.date > date)
      .reduce((s, t) => s + (t.income || 0) - (t.expense || 0), 0);

    const transferNetAfter = transfers
      .filter(tr => tr.date > date)
      .reduce((s, tr) => {
        let effect = 0;
        if (tr.from_wallet_id === walletId) effect -= tr.amount;
        if (tr.to_wallet_id === walletId) effect += tr.amount;
        return s + effect;
      }, 0);

    return wallet.balance - txnNetAfter - transferNetAfter;
  };

  // Get English date range for a month option
  const getDateRange = (opt: MonthOption): { startDate: string; endDate: string } | null => {
    if (calendarMode === 'english' && opt.startDate && opt.endDate) {
      return { startDate: opt.startDate, endDate: opt.endDate };
    }
    if (calendarMode === 'nepali' && opt.nepaliYear && opt.nepaliMonth) {
      try {
        const startEng = convertNepaliToEnglish(opt.nepaliYear, opt.nepaliMonth, 1);
        // Nepali months vary 29-32 days, try 32 and fall back
        let lastDay = 32;
        let endEng: Date;
        while (lastDay >= 28) {
          try {
            endEng = convertNepaliToEnglish(opt.nepaliYear, opt.nepaliMonth, lastDay);
            // Verify it's the same month
            const check = convertEnglishToNepali(endEng);
            if (check.month === opt.nepaliMonth && check.year === opt.nepaliYear) {
              return {
                startDate: new Date(startEng.getTime() - 86400000).toISOString().split('T')[0],
                endDate: endEng.toISOString().split('T')[0],
              };
            }
          } catch { /* skip */ }
          lastDay--;
        }
        // Fallback
        const endFallback = convertNepaliToEnglish(opt.nepaliYear, opt.nepaliMonth, 30);
        return {
          startDate: new Date(startEng.getTime() - 86400000).toISOString().split('T')[0],
          endDate: endFallback.toISOString().split('T')[0],
        };
      } catch {
        return null;
      }
    }
    return null;
  };

  // Build table data for each selected month
  const monthTables = useMemo(() => {
    return selectedMonths.map(monthValue => {
      const opt = monthOptions.find(o => o.value === monthValue);
      if (!opt) return null;

      const range = getDateRange(opt);
      if (!range) return null;

      const walletRows = wallets.map((wallet, idx) => {
        const firstDayBal = getBalanceAtDate(wallet.id, new Date(new Date(range.startDate).getTime()).toISOString().split('T')[0]);
        const lastDayBal = getBalanceAtDate(wallet.id, range.endDate);

        return {
          sn: idx + 1,
          name: wallet.name,
          id: wallet.id,
          firstDayBalance: firstDayBal,
          lastDayBalance: lastDayBal,
        };
      });

      const totalFirst = walletRows.reduce((s, w) => s + w.firstDayBalance, 0);
      const totalLast = walletRows.reduce((s, w) => s + w.lastDayBalance, 0);

      return {
        monthValue,
        label: opt.label,
        shortLabel: opt.shortLabel,
        walletRows,
        totalFirst,
        totalLast,
      };
    }).filter(Boolean) as NonNullable<typeof monthTables extends (infer T)[] ? T : never>[];
  }, [selectedMonths, monthOptions, wallets, transactions, transfers]);

  // Consistency check: last day of month N should match first day of month N+1
  const consistencyChecks = useMemo(() => {
    const checks: { from: string; to: string; walletName: string; lastDay: number; firstDay: number; match: boolean }[] = [];
    for (let i = 0; i < monthTables.length - 1; i++) {
      const curr = monthTables[i];
      const next = monthTables[i + 1];
      curr.walletRows.forEach(cw => {
        const nw = next.walletRows.find(n => n.id === cw.id);
        if (nw) {
          const match = Math.abs(cw.lastDayBalance - nw.firstDayBalance) < 0.01;
          checks.push({
            from: curr.shortLabel,
            to: next.shortLabel,
            walletName: cw.name,
            lastDay: cw.lastDayBalance,
            firstDay: nw.firstDayBalance,
            match,
          });
        }
      });
    }
    return checks;
  }, [monthTables]);

  const hasIssues = consistencyChecks.some(c => !c.match);

  const toggleMonth = (value: string) => {
    setSelectedMonths(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value].sort()
    );
  };

  const fmt = (v: number) => formatAmount(v);

  return (
    <>
      <Helmet>
        <title>Balance Month | Finance | Track Hub</title>
        <meta name="description" content="Wallet balance reconciliation — verify opening and closing balances across months." />
      </Helmet>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">Balance Month</h1>
            <p className="text-muted-foreground text-sm">
              Wallet balance reconciliation — compare opening & closing balances across months.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={calendarMode} onValueChange={(v) => setCalendarMode(v as CalendarMode)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Calendar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English (AD)</SelectItem>
                <SelectItem value="nepali">Nepali (BS)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Month Selector */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-primary" />
              Select Months to Compare
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {monthOptions.map(opt => (
                <Badge
                  key={opt.value}
                  variant={selectedMonths.includes(opt.value) ? 'default' : 'outline'}
                  className="cursor-pointer px-3 py-1.5 text-sm"
                  onClick={() => toggleMonth(opt.value)}
                >
                  {opt.shortLabel}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Month Tables */}
        {wallets.length > 0 && monthTables.length > 0 ? (
          <div className="space-y-6">
            {monthTables.map((mt) => (
              <Card key={mt.monthValue}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-primary">{mt.label}</CardTitle>
                </CardHeader>
                <CardContent className="p-0 sm:px-6 sm:pb-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">SN</TableHead>
                          <TableHead>Wallet</TableHead>
                          <TableHead>Month</TableHead>
                          <TableHead className="text-right">1st Day Balance</TableHead>
                          <TableHead className="text-right">Last Day Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mt.walletRows.map(w => (
                          <TableRow key={w.id}>
                            <TableCell>{w.sn}</TableCell>
                            <TableCell className="font-medium">{w.name}</TableCell>
                            <TableCell>{mt.shortLabel}</TableCell>
                            <TableCell className="text-right font-mono">{fmt(w.firstDayBalance)}</TableCell>
                            <TableCell className="text-right font-mono">{fmt(w.lastDayBalance)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={3} className="font-bold">Total</TableCell>
                          <TableCell className="text-right font-bold">{fmt(mt.totalFirst)}</TableCell>
                          <TableCell className="text-right font-bold">{fmt(mt.totalLast)}</TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : wallets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Wallet className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Wallets</h3>
              <p className="text-muted-foreground">Create wallets first to see balance reconciliation.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              Select months above to view balance tables.
            </CardContent>
          </Card>
        )}

        {/* Consistency Check */}
        {consistencyChecks.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {hasIssues ? (
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
                Balance Consistency Check
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Wallet</TableHead>
                      <TableHead className="text-right">Last Day ({consistencyChecks[0]?.from})</TableHead>
                      <TableHead className="text-right">1st Day ({consistencyChecks[0]?.to})</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consistencyChecks.map((c, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{c.walletName}</TableCell>
                        <TableCell className="text-right font-mono">{fmt(c.lastDay)}</TableCell>
                        <TableCell className="text-right font-mono">{fmt(c.firstDay)}</TableCell>
                        <TableCell className="text-center">
                          {c.match ? (
                            <Badge variant="default" className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Match</Badge>
                          ) : (
                            <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Mismatch</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default BalanceMonth;
