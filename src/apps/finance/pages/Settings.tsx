
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, BadgeIndianRupee } from 'lucide-react';
import { currencies, defaultCurrency } from '@/config/currencies';
import { useWallets } from '@/hooks/useWallets';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useTransfers } from '@/hooks/useTransfers';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useCurrency } from '@/hooks/useCurrency';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import { convertToCSV, downloadCSV, parseCSV } from '@/utils/csvUtils';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import {
  walletImportSchema,
  transactionImportSchema,
  transferImportSchema,
  categoryImportSchema,
  validateImportRow,
} from '@/utils/csvValidation';

export const FinanceSettings: React.FC = () => {
  const { currency, updateCurrency } = useCurrency();
  const [selectedCurrency, setSelectedCurrency] = useState(defaultCurrency.code);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const { toast } = useToast();
  const { wallets } = useWallets();
  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const { transfers } = useTransfers();
  const { settings, toggleApp } = useAppSettings();

  const handleCurrencyChange = (value: string) => {
    updateCurrency(value);
    
    const selectedCurrencyObj = currencies.find(c => c.code === value);
    
    toast({
      title: 'Currency Updated',
      description: `Your currency is now set to ${selectedCurrencyObj?.name} (${selectedCurrencyObj?.symbol})`,
    });
  };

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
  };

  const getFilteredData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { wallets: [], transactions: [], transfers: [], categories: [] };

    let query = supabase.from('transactions').select('*').eq('user_id', user.id);
    
    if (startDate) {
      query = query.gte('date', format(startDate, 'yyyy-MM-dd'));
    }
    if (endDate) {
      query = query.lte('date', format(endDate, 'yyyy-MM-dd'));
    }

    const { data: filteredTransactions } = await query;

    let transferQuery = supabase.from('transfers').select('*').eq('user_id', user.id);
    
    if (startDate) {
      transferQuery = transferQuery.gte('date', format(startDate, 'yyyy-MM-dd'));
    }
    if (endDate) {
      transferQuery = transferQuery.lte('date', format(endDate, 'yyyy-MM-dd'));
    }

    const { data: filteredTransfers } = await transferQuery;

    return {
      wallets,
      transactions: filteredTransactions || [],
      transfers: filteredTransfers || [],
      categories
    };
  };

  const handleExportData = async () => {
    toast({
      title: 'Data Export Started',
      description: 'Your data is being prepared for download.',
    });
    
    try {
      const data = await getFilteredData();
      
      // Export wallets
      const walletsCSV = convertToCSV(
        data.wallets.map(w => ({
          name: w.name,
          balance: w.balance,
          currency: w.currency,
          created_at: w.created_at
        })),
        ['name', 'balance', 'currency', 'created_at']
      );
      downloadCSV(walletsCSV, 'wallets');

      // Export transactions
      if (data.transactions.length > 0) {
        const transactionsCSV = convertToCSV(
          data.transactions.map(t => ({
            reason: t.reason,
            type: t.type,
            income: t.income || '',
            expense: t.expense || '',
            date: t.date,
            wallet_id: t.wallet_id,
            category_id: t.category_id || ''
          })),
          ['reason', 'type', 'income', 'expense', 'date', 'wallet_id', 'category_id']
        );
        downloadCSV(transactionsCSV, 'transactions');
      }

      // Export transfers
      if (data.transfers.length > 0) {
        const transfersCSV = convertToCSV(
          data.transfers.map(t => ({
            from_wallet_id: t.from_wallet_id,
            to_wallet_id: t.to_wallet_id,
            amount: t.amount,
            date: t.date,
            description: t.description || '',
            status: t.status
          })),
          ['from_wallet_id', 'to_wallet_id', 'amount', 'date', 'description', 'status']
        );
        downloadCSV(transfersCSV, 'transfers');
      }

      // Export categories
      const categoriesCSV = convertToCSV(
        data.categories.map(c => ({
          name: c.name,
          color: c.color
        })),
        ['name', 'color']
      );
      downloadCSV(categoriesCSV, 'categories');
      
      toast({
        title: 'Data Exported Successfully',
        description: 'Your financial data has been downloaded as CSV files.',
      });
    } catch (error) {
      toast({
        title: 'Export Error',
        description: 'Failed to export data. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.multiple = true;
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const files = Array.from(target.files || []);
      
      if (files.length === 0) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({
            title: 'Authentication Error',
            description: 'You must be logged in to import data.',
            variant: 'destructive',
          });
          return;
        }

        let totalImported = 0;
        let totalErrors = 0;

        for (const file of files) {
          try {
            const text = await file.text();
            const data = parseCSV(text);
            
            if (data.length === 0) {
              console.log(`No data found in file: ${file.name}`);
              continue;
            }

            const fileName = file.name.toLowerCase();
            
            if (fileName.includes('wallet')) {
              // Import wallets with validation
              for (const row of data) {
                const result = walletImportSchema.safeParse(row);
                if (!result.success) {
                  console.error('Wallet validation failed:', result.error.issues);
                  totalErrors++;
                  continue;
                }
                try {
                  const { error } = await supabase.from('wallets').insert([{
                    name: result.data.name,
                    balance: result.data.balance,
                    currency: result.data.currency,
                    user_id: user.id
                  }]);
                  if (error) {
                    console.error('Error importing wallet:', error);
                    totalErrors++;
                  } else {
                    totalImported++;
                  }
                } catch (err) {
                  console.error('Error processing wallet row:', err);
                  totalErrors++;
                }
              }
            } else if (fileName.includes('transaction')) {
              // Import transactions with validation
              for (const row of data) {
                const result = transactionImportSchema.safeParse(row);
                if (!result.success) {
                  console.error('Transaction validation failed:', result.error.issues);
                  totalErrors++;
                  continue;
                }
                try {
                  const { error } = await supabase.from('transactions').insert([{
                    reason: result.data.reason,
                    type: result.data.type,
                    income: result.data.income,
                    expense: result.data.expense,
                    date: result.data.date,
                    wallet_id: result.data.wallet_id,
                    category_id: result.data.category_id,
                    user_id: user.id
                  }]);
                  if (error) {
                    console.error('Error importing transaction:', error);
                    totalErrors++;
                  } else {
                    totalImported++;
                  }
                } catch (err) {
                  console.error('Error processing transaction row:', err);
                  totalErrors++;
                }
              }
            } else if (fileName.includes('transfer')) {
              // Import transfers with validation
              for (const row of data) {
                const result = transferImportSchema.safeParse(row);
                if (!result.success) {
                  console.error('Transfer validation failed:', result.error.issues);
                  totalErrors++;
                  continue;
                }
                try {
                  const { error } = await supabase.from('transfers').insert([{
                    from_wallet_id: result.data.from_wallet_id,
                    to_wallet_id: result.data.to_wallet_id,
                    amount: result.data.amount,
                    date: result.data.date,
                    description: result.data.description,
                    status: result.data.status,
                    user_id: user.id
                  }]);
                  if (error) {
                    console.error('Error importing transfer:', error);
                    totalErrors++;
                  } else {
                    totalImported++;
                  }
                } catch (err) {
                  console.error('Error processing transfer row:', err);
                  totalErrors++;
                }
              }
            } else if (fileName.includes('categor')) {
              // Import categories with validation
              for (const row of data) {
                const result = categoryImportSchema.safeParse(row);
                if (!result.success) {
                  console.error('Category validation failed:', result.error.issues);
                  totalErrors++;
                  continue;
                }
                try {
                  const { error } = await supabase.from('categories').insert([{
                    name: result.data.name,
                    color: result.data.color,
                    user_id: user.id
                  }]);
                  if (error) {
                    console.error('Error importing category:', error);
                    totalErrors++;
                  } else {
                    totalImported++;
                  }
                } catch (err) {
                  console.error('Error processing category row:', err);
                  totalErrors++;
                }
              }
            }
          } catch (fileError) {
            console.error(`Error processing file ${file.name}:`, fileError);
            totalErrors++;
          }
        }
        
        if (totalImported > 0) {
          toast({
            title: 'Data Import Successful',
            description: `Successfully imported ${totalImported} records. ${totalErrors > 0 ? `${totalErrors} errors occurred.` : ''} Please refresh the page to see changes.`,
          });
        } else {
          toast({
            title: 'Import Warning', 
            description: 'No valid data was imported. Please check your CSV files format.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Import error:', error);
        toast({
          title: 'Import Error',
          description: 'Failed to import data. Please check the file format and try again.',
          variant: 'destructive',
        });
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-green-700">Finance Settings</h1>
        <p className="text-muted-foreground">Configure your finance preferences</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-green-700">App Preferences</CardTitle>
            <CardDescription>Choose which apps you want to use</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="tv-shows-toggle">TV Show Tracker</Label>
                <p className="text-sm text-muted-foreground">
                  Track your favorite TV shows and episodes
                </p>
              </div>
              <Switch 
                id="tv-shows-toggle" 
                checked={settings.enabledApps.tvShows}
                onCheckedChange={() => toggleApp('tvShows')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="finance-toggle">Finance Manager</Label>
                <p className="text-sm text-muted-foreground">
                  Manage your personal finances and expenses
                </p>
              </div>
              <Switch 
                id="finance-toggle" 
                checked={settings.enabledApps.finance}
                onCheckedChange={() => toggleApp('finance')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="settlebill-toggle">SettleBill</Label>
                <p className="text-sm text-muted-foreground">
                  Split bills and settle expenses with friends
                </p>
              </div>
              <Switch 
                id="settlebill-toggle" 
                checked={settings.enabledApps.settlebill}
                onCheckedChange={() => toggleApp('settlebill')}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-green-700">Currency Settings</CardTitle>
            <CardDescription>Choose your preferred currency for transactions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="currency">Display Currency</Label>
              <Select 
                value={currency.code} 
                onValueChange={handleCurrencyChange}
              >
                <SelectTrigger id="currency" className="w-full">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currencyOption) => (
                    <SelectItem key={currencyOption.code} value={currencyOption.code}>
                      <div className="flex items-center">
                        <span className="mr-2">{currencyOption.symbol}</span>
                        <span>{currencyOption.name} ({currencyOption.code})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                This will change how amounts are displayed across the app
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="example-amount">Example Amount</Label>
              <div className="flex items-center p-2 border rounded-md bg-muted/30">
                <BadgeIndianRupee className="h-5 w-5 mr-2" />
                <span className="text-xl font-semibold">
                  {currency.symbol} 1,000.00
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-green-700">Data Management</CardTitle>
            <CardDescription>Export or import your financial data with date filtering</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Date Range Filter (for Export)</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Select a date range to filter transactions and transfers for export
              </p>
              <DateRangeFilter
                startDate={startDate}
                endDate={endDate}
                onDateRangeChange={handleDateRangeChange}
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Export Data</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Download your financial data as CSV files
                </p>
                <Button onClick={handleExportData} className="w-full bg-green-600 hover:bg-green-700">
                  <Download className="h-4 w-4 mr-2" />
                  Export as CSV
                </Button>
              </div>
              
              <div className="grid gap-2">
                <Label>Import Data</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Import CSV files (multiple files supported)
                </p>
                <Button onClick={handleImportData} variant="outline" className="w-full border-green-200 text-green-700 hover:bg-green-50">
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV Files
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  File names should contain keywords like 'wallet', 'transaction', 'category', or 'transfer' to auto-detect data type.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-green-700">Display Preferences</CardTitle>
            <CardDescription>Customize how financial data is displayed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show-cents">Show Cents</Label>
                <p className="text-sm text-muted-foreground">
                  Display decimal places in monetary values
                </p>
              </div>
              <Switch id="show-cents" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="thousand-separator">Use Thousand Separator</Label>
                <p className="text-sm text-muted-foreground">
                  Add commas to separate thousands in numbers
                </p>
              </div>
              <Switch id="thousand-separator" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="colorize-amounts">Colorize Amounts</Label>
                <p className="text-sm text-muted-foreground">
                  Show expenses in red and income in green
                </p>
              </div>
              <Switch id="colorize-amounts" defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinanceSettings;
