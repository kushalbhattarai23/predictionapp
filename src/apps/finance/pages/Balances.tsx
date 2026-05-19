import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTransactions } from '@/hooks/useTransactions';
import { useTransfers } from '@/hooks/useTransfers';
import { useWallets } from '@/hooks/useWallets';
import { useCurrency } from '@/hooks/useCurrency';
import { Wallet, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { convertEnglishToNepali } from '@/utils/dateConverter';

type CalendarMode = 'english' | 'nepali';

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

const parseNepaliDate = (dateString?: string): NepaliDateParts | null => {
  if (!dateString) return null;
  const parts = dateString.split(/[/-]/).map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return null;

  return {
    year: parts[0],
    month: parts[1],
    day: parts[2],
  };
};

const monthLabelFromDate = (year: number, monthIndex: number) =>
  new Date(year, monthIndex, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

export const Balances: React.FC = () => {
  const { transactions } = useTransactions();
  const { transfers } = useTransfers();
  const { wallets } = useWallets();
  const { formatAmount } = useCurrency();

  const [calendarMode, setCalendarMode] = useState<CalendarMode>('english');

  const englishMonthOptions = useMemo<MonthOption[]>(() => {
    const monthSet = new Set<string>();

    transactions.forEach((transaction) => {
      if (transaction.date) {
        monthSet.add(transaction.date.slice(0, 7));
      }
    });

    const today = new Date();
    monthSet.add(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);

    return Array.from(monthSet)
      .sort((a, b) => b.localeCompare(a))
      .map((monthKey) => {
        const [yearString, monthString] = monthKey.split('-');
        const year = Number(yearString);
        const month = Number(monthString);
        const startDate = `${monthKey}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        return {
          value: monthKey,
          label: monthLabelFromDate(year, month - 1),
          startDate,
          endDate,
        };
      });
  }, [transactions]);

  const nepaliMonthOptions = useMemo<MonthOption[]>(() => {
    const monthSet = new Set<string>();

    transactions.forEach((transaction) => {
      const parsed = parseNepaliDate(transaction.nepali_date);
      if (parsed) {
        monthSet.add(`${parsed.year}-${String(parsed.month).padStart(2, '0')}`);
      }
    });

    const nepaliToday = convertEnglishToNepali(new Date());
    monthSet.add(`${nepaliToday.year}-${String(nepaliToday.month).padStart(2, '0')}`);

    return Array.from(monthSet)
      .sort((a, b) => b.localeCompare(a))
      .map((monthKey) => {
        const [year, month] = monthKey.split('-').map(Number);
        return {
          value: monthKey,
          label: `${year}/${String(month).padStart(2, '0')} BS`,
        };
      });
  }, [transactions]);

  const [selectedEnglishMonth, setSelectedEnglishMonth] = useState<string>('');
  const [selectedNepaliMonth, setSelectedNepaliMonth] = useState<string>('');

  useEffect(() => {
    if (!selectedEnglishMonth && englishMonthOptions.length > 0) {
      setSelectedEnglishMonth(englishMonthOptions[0].value);
    }
  }, [selectedEnglishMonth, englishMonthOptions]);

  useEffect(() => {
    if (!selectedNepaliMonth && nepaliMonthOptions.length > 0) {
      setSelectedNepaliMonth(nepaliMonthOptions[0].value);
    }
  }, [selectedNepaliMonth, nepaliMonthOptions]);

  const activeMonth = calendarMode === 'english' ? selectedEnglishMonth : selectedNepaliMonth;

  // FIX 1: useMemo was split/malformed — merged into a single, correct useMemo block
  // FIX 2: removed reference to undefined `selectedMonthOption` in dependency array
  const data = useMemo(() => {
    const selectedEnglish = englishMonthOptions.find((option) => option.value === selectedEnglishMonth) || englishMonthOptions[0];
    const previousEnglish = selectedEnglish
      ? englishMonthOptions.find((option) => option.endDate && option.endDate < selectedEnglish.startDate!)
      : undefined;

    const selectedNepali = nepaliMonthOptions.find((option) => option.value === selectedNepaliMonth) || nepaliMonthOptions[0];
    const previousNepali = selectedNepali
      ? nepaliMonthOptions[nepaliMonthOptions.findIndex((option) => option.value === selectedNepali.value) + 1]
      : undefined;

    const walletData = wallets.map((wallet) => {
      const walletTxns = transactions.filter((transaction) => transaction.wallet_id === wallet.id);
      const sortedWalletTxns = [...walletTxns].sort((a, b) => a.date.localeCompare(b.date));

      const isCurrentCalendarEnglish = calendarMode === 'english' && selectedEnglish;
      const isCurrentCalendarNepali = calendarMode === 'nepali' && selectedNepali;

      const txnsInActiveMonth = sortedWalletTxns.filter((transaction) => {
        if (isCurrentCalendarEnglish && selectedEnglish) {
          return transaction.date >= selectedEnglish.startDate! && transaction.date <= selectedEnglish.endDate!;
        }

        if (isCurrentCalendarNepali && selectedNepali) {
          const parsed = parseNepaliDate(transaction.nepali_date);
          if (!parsed) return false;
          return `${parsed.year}-${String(parsed.month).padStart(2, '0')}` === selectedNepali.value;
        }

        return false;
      });

      const prevTxns = sortedWalletTxns.filter((transaction) => {
        if (calendarMode === 'english') {
          if (!previousEnglish || !selectedEnglish) return false;
          return transaction.date >= previousEnglish.startDate! && transaction.date <= previousEnglish.endDate!;
        }

        if (!previousNepali) return false;
        const parsed = parseNepaliDate(transaction.nepali_date);
        if (!parsed) return false;
        return `${parsed.year}-${String(parsed.month).padStart(2, '0')}` === previousNepali.value;
      });

      const calc = (txns: typeof transactions) => ({
        income: txns.reduce((sum, transaction) => sum + (transaction.income || 0), 0),
        expense: txns.reduce((sum, transaction) => sum + (transaction.expense || 0), 0),
      });

      const monthSummary = calc(txnsInActiveMonth);
      const previousSummary = calc(prevTxns);

      const getBalanceAtDate = (date: string) => {
        const netAfterDate = sortedWalletTxns
          .filter((transaction) => transaction.date > date)
          .reduce((sum, transaction) => sum + (transaction.income || 0) - (transaction.expense || 0), 0);

        return wallet.balance - netAfterDate;
      };

      const monthStartBalance = selectedEnglish
        ? getBalanceAtDate(new Date(new Date(selectedEnglish.startDate!).getTime() - 86400000).toISOString().split('T')[0])
        : null;
      const monthEndBalance = selectedEnglish ? getBalanceAtDate(selectedEnglish.endDate!) : null;

      return {
        id: wallet.id,
        name: wallet.name,
        currentBalance: wallet.balance,
        prevIncome: previousSummary.income,
        prevExpense: previousSummary.expense,
        prevNet: previousSummary.income - previousSummary.expense,
        currIncome: monthSummary.income,
        currExpense: monthSummary.expense,
        currNet: monthSummary.income - monthSummary.expense,
        monthStartBalance,
        monthEndBalance,
      };
    });

    return {
      walletData,
      currentMonthName: calendarMode === 'english' ? selectedEnglish?.label || 'Selected month' : selectedNepali?.label || 'Selected month',
      prevMonthName: calendarMode === 'english' ? previousEnglish?.label || 'Previous month' : previousNepali?.label || 'Previous month',
    };
  }, [transactions, wallets, transfers, calendarMode, englishMonthOptions, nepaliMonthOptions, selectedEnglishMonth, selectedNepaliMonth]);

  const totalCurrentBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-green-700">Balances</h1>
          <p className="text-muted-foreground text-sm">Wallet balances — {data.prevMonthName} vs {data.currentMonthName}</p>
          <div className="mt-2 text-lg font-semibold text-green-600">
            Total Balance: {formatAmount(totalCurrentBalance)}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select value={calendarMode} onValueChange={(value) => setCalendarMode(value as CalendarMode)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Calendar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="english">English Date</SelectItem>
              <SelectItem value="nepali">Nepali Date</SelectItem>
            </SelectContent>
          </Select>

          <Select value={activeMonth} onValueChange={calendarMode === 'english' ? setSelectedEnglishMonth : setSelectedNepaliMonth}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {(calendarMode === 'english' ? englishMonthOptions : nepaliMonthOptions).map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {wallets.length === 0 ? (
        <Card className="border-green-200">
          <CardContent className="text-center py-12">
            <Wallet className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Wallets</h3>
            <p className="text-muted-foreground">Create wallets first to see monthly balances.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.walletData.map((wallet) => (
            <Card key={wallet.id} className="border-green-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-green-700">{wallet.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className="border-green-200 text-green-700 text-base">
                    {formatAmount(wallet.currentBalance)}
                  </Badge>
                </div>
              </CardHeader>
              {/* FIX 3: added missing closing </div> for the grid inside CardContent */}
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium text-muted-foreground mb-2">{data.prevMonthName}</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-green-500" /> Income</span>
                        <span className="text-green-600">{formatAmount(wallet.prevIncome)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1"><TrendingDown className="h-3 w-3 text-red-500" /> Expense</span>
                        <span className="text-red-600">{formatAmount(wallet.prevExpense)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-1 font-semibold">
                        <span>Net</span>
                        <span className={wallet.prevNet >= 0 ? 'text-green-600' : 'text-red-600'}>{formatAmount(wallet.prevNet)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden md:flex items-center justify-center">
                    <ArrowRight className="h-8 w-8 text-green-400" />
                  </div>

                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                    <p className="text-sm font-medium text-muted-foreground mb-2">{data.currentMonthName}</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-green-500" /> Income</span>
                        <span className="text-green-600">{formatAmount(wallet.currIncome)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1"><TrendingDown className="h-3 w-3 text-red-500" /> Expense</span>
                        <span className="text-red-600">{formatAmount(wallet.currExpense)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-1 font-semibold">
                        <span>Net</span>
                        <span className={wallet.currNet >= 0 ? 'text-green-600' : 'text-red-600'}>{formatAmount(wallet.currNet)}</span>
                      </div>
                    </div>
                  </div>
                </div>{/* closes grid */}

                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Badge variant="secondary" className="text-xs justify-center">
                    Month start: {wallet.monthStartBalance !== null ? formatAmount(wallet.monthStartBalance) : '—'}
                  </Badge>
                  <Badge variant="secondary" className="text-xs justify-center">
                    Month end: {wallet.monthEndBalance !== null ? formatAmount(wallet.monthEndBalance) : '—'}
                  </Badge>
                  <Badge variant={wallet.currExpense <= wallet.prevExpense ? 'default' : 'destructive'} className="text-xs justify-center">
                    Spent: {formatAmount(wallet.currExpense)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Balances;
