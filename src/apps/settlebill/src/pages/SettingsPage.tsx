import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, BadgeIndianRupee } from 'lucide-react';
import { currencies, defaultCurrency } from '@/config/currencies';
import { useCurrency } from '@/hooks/useCurrency';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import { convertToCSV, downloadCSV, parseCSV } from '@/utils/csvUtils';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useBills } from '@/hooks/useSettleGaraBills';
import { useNetworks } from '@/hooks/useSettleBillNetworks';

export const SettleBillSettingsPage: React.FC = () => {
  const { currency, updateCurrency } = useCurrency();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: bills } = useBills();
  const { data: networks } = useNetworks();

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
    if (!user) return { bills: [], networks: [] };

    let billQuery = supabase.from('settlegara_bills').select('*').eq('created_by', user.id);
    
    if (startDate) {
      billQuery = billQuery.gte('created_at', format(startDate, 'yyyy-MM-dd'));
    }
    if (endDate) {
      billQuery = billQuery.lte('created_at', format(endDate, 'yyyy-MM-dd'));
    }

    const { data: filteredBills } = await billQuery;

    return {
      bills: filteredBills || [],
      networks: networks || []
    };
  };

  const handleExportData = async () => {
    toast({
      title: 'Data Export Started',
      description: 'Your SettleBill data is being prepared for download.',
    });
    
    try {
      const data = await getFilteredData();
      
      // Export bills
      if (data.bills.length > 0) {
        const billsCSV = convertToCSV(
          data.bills.map(b => ({
            title: b.title,
            total_amount: b.total_amount,
            currency: b.currency,
            status: b.status,
            created_at: b.created_at,
            network_id: b.network_id
          })),
          ['title', 'total_amount', 'currency', 'status', 'created_at', 'network_id']
        );
        downloadCSV(billsCSV, 'settlebill-bills');
      }

      // Export networks
      if (data.networks.length > 0) {
        const networksCSV = convertToCSV(
          data.networks.map(n => ({
            name: n.name,
            description: n.description,
            created_at: n.created_at
          })),
          ['name', 'description', 'created_at']
        );
        downloadCSV(networksCSV, 'settlebill-networks');
      }
      
      toast({
        title: 'Data Exported Successfully',
        description: 'Your SettleBill data has been downloaded as CSV files.',
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
            
            if (fileName.includes('network')) {
              // Import networks
              for (const row of data) {
                try {
                  const { error } = await supabase.from('settlegara_networks').insert({
                    name: row.name || 'Imported Network',
                    description: row.description || null,
                    creator_id: user.id
                  });
                  if (error) {
                    console.error('Error importing network:', error);
                    totalErrors++;
                  } else {
                    totalImported++;
                  }
                } catch (err) {
                  console.error('Error processing network row:', err);
                  totalErrors++;
                }
              }
            } else if (fileName.includes('bill')) {
              // Import bills
              for (const row of data) {
                try {
                  const { error } = await supabase.from('settlegara_bills').insert({
                    title: row.title || 'Imported Bill',
                    total_amount: parseFloat(row.total_amount) || 0,
                    currency: row.currency || 'USD',
                    status: row.status || 'active',
                    network_id: row.network_id,
                    created_by: user.id
                  });
                  if (error) {
                    console.error('Error importing bill:', error);
                    totalErrors++;
                  } else {
                    totalImported++;
                  }
                } catch (err) {
                  console.error('Error processing bill row:', err);
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-red-700 dark:text-red-300">SettleBill Settings</h1>
          <p className="text-muted-foreground">Configure your SettleBill preferences</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-300">Currency Settings</CardTitle>
              <CardDescription>Choose your preferred currency for bills</CardDescription>
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

          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-300">Display Preferences</CardTitle>
              <CardDescription>Customize how bill data is displayed</CardDescription>
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
                    Show pending amounts in orange and settled in green
                  </p>
                </div>
                <Switch id="colorize-amounts" defaultChecked />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-red-200 dark:border-red-800 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-300">Data Management</CardTitle>
              <CardDescription>Export or import your SettleBill data with date filtering</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Date Range Filter (for Export)</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Select a date range to filter bills for export
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
                    Download your SettleBill data as CSV files
                  </p>
                  <Button onClick={handleExportData} className="w-full bg-red-600 hover:bg-red-700">
                    <Download className="h-4 w-4 mr-2" />
                    Export as CSV
                  </Button>
                </div>
                
                <div className="grid gap-2">
                  <Label>Import Data</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Import CSV files (multiple files supported)
                  </p>
                  <Button onClick={handleImportData} variant="outline" className="w-full border-red-200 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950">
                    <Upload className="h-4 w-4 mr-2" />
                    Import CSV Files
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    File names should contain keywords like 'network' or 'bill' to auto-detect data type.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettleBillSettingsPage;
