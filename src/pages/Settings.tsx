import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, BadgeIndianRupee, FileText, Lock, Globe, Moon, Sun, Mail, Image as ImageIcon } from 'lucide-react';
import { currencies } from '@/config/currencies';
import { useEmailPreferences } from '@/hooks/useEmailPreferences';
import { useWallets } from '@/hooks/useWallets';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useTransfers } from '@/hooks/useTransfers';
import { useMovies } from '@/hooks/useMovies';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useCurrency } from '@/hooks/useCurrency';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { convertToCSV, downloadCSV, parseCSV } from '@/utils/csvUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const FinanceSettings: React.FC = () => {
  const { currency, updateCurrency } = useCurrency();
  const { theme, setTheme, toggleTheme } = useTheme();
  const { isAdmin } = useUserRoles();
  const [exportOptions, setExportOptions] = useState({
    wallets: true,
    transactions: true,
    categories: true,
    transfers: true,
    movies: true,
    tvShows: true
  });
  const { toast } = useToast();
  const { wallets } = useWallets();
  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const { transfers } = useTransfers();
  const { data: movies } = useMovies();
  const { settings, toggleApp } = useAppSettings();
  const { user } = useAuth();
  const { preferences, updatePreference } = useEmailPreferences();
  const handleCurrencyChange = (value: string) => {
    updateCurrency(value);
    
    const selectedCurrencyObj = currencies.find(c => c.code === value);
    
    toast({
      title: 'Currency Updated',
      description: `Your currency is now set to ${selectedCurrencyObj?.name} (${selectedCurrencyObj?.symbol})`,
    });
  };

  const handleExportData = async () => {
    toast({
      title: 'Data Export Started',
      description: 'Your data is being prepared for download.',
    });
    
    try {
      if (exportOptions.wallets && wallets.length > 0) {
        const walletsCSV = convertToCSV(
          wallets.map(w => ({
            name: w.name,
            balance: w.balance,
            currency: w.currency,
            created_at: w.created_at
          })),
          ['name', 'balance', 'currency', 'created_at']
        );
        downloadCSV(walletsCSV, 'wallets');
      }

      if (exportOptions.transactions && transactions.length > 0) {
        const transactionsCSV = convertToCSV(
          transactions.map(t => ({
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

      if (exportOptions.categories && categories.length > 0) {
        const categoriesCSV = convertToCSV(
          categories.map(c => ({
            name: c.name,
            color: c.color
          })),
          ['name', 'color']
        );
        downloadCSV(categoriesCSV, 'categories');
      }

      if (exportOptions.transfers && transfers.length > 0) {
        const transfersCSV = convertToCSV(
          transfers.map(t => ({
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

      // Export movies if selected
      if (exportOptions.movies && movies && movies.length > 0) {
        const moviesCSV = convertToCSV(
          movies.map(m => ({
            title: m.title,
            description: m.description || '',
            genre: m.genre || '',
            release_year: m.release_year || '',
            director: m.director || '',
            duration_minutes: m.duration_minutes || '',
            poster_url: m.poster_url || '',
            rating: m.rating || '',
            status: m.status,
            user_rating: m.user_rating || '',
            user_notes: m.user_notes || '',
            watched_at: m.watched_at || '',
            created_at: m.created_at
          })),
          ['title', 'description', 'genre', 'release_year', 'director', 'duration_minutes', 'poster_url', 'rating', 'status', 'user_rating', 'user_notes', 'watched_at', 'created_at']
        );
        downloadCSV(moviesCSV, 'movies');
      }

      // Export TV shows tracking data if selected
      if (exportOptions.tvShows && user) {
        const { data: userShowTracking } = await supabase
          .from('user_show_tracking')
          .select(`
            *,
            shows:show_id (title, description, poster_url)
          `)
          .eq('user_id', user.id);

        if (userShowTracking && userShowTracking.length > 0) {
          const tvShowsCSV = convertToCSV(
            userShowTracking.map((t: any) => ({
              show_title: t.shows?.title || '',
              show_description: t.shows?.description || '',
              poster_url: t.shows?.poster_url || '',
              total_episodes: t.total_episodes || 0,
              watched_episodes: t.watched_episodes || 0,
              last_updated: t.last_updated || '',
              created_at: t.created_at
            })),
            ['show_title', 'show_description', 'poster_url', 'total_episodes', 'watched_episodes', 'last_updated', 'created_at']
          );
          downloadCSV(tvShowsCSV, 'tv-shows-tracking');
        }
      }
      
      toast({
        title: 'Data Exported Successfully',
        description: 'Your data has been downloaded as CSV files.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Error',
        description: 'Failed to export some data. Please try again.',
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
              // Import wallets
              for (const row of data) {
                try {
                  const { error } = await supabase.from('wallets').insert({
                    name: row.name || 'Imported Wallet',
                    balance: parseFloat(row.balance) || 0,
                    currency: row.currency || 'USD',
                    user_id: user.id
                  });
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
              // Import transactions
              for (const row of data) {
                try {
                  const { error } = await supabase.from('transactions').insert({
                    reason: row.reason || 'Imported Transaction',
                    type: row.type || 'expense',
                    income: row.income ? parseFloat(row.income) : null,
                    expense: row.expense ? parseFloat(row.expense) : null,
                    date: row.date || new Date().toISOString().split('T')[0],
                    wallet_id: row.wallet_id,
                    category_id: row.category_id || null,
                    user_id: user.id
                  });
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
              // Import transfers
              for (const row of data) {
                try {
                  const { error } = await supabase.from('transfers').insert({
                    from_wallet_id: row.from_wallet_id,
                    to_wallet_id: row.to_wallet_id,
                    amount: parseFloat(row.amount) || 0,
                    date: row.date || new Date().toISOString().split('T')[0],
                    description: row.description || null,
                    status: row.status || 'completed',
                    user_id: user.id
                  });
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
              // Import categories
              for (const row of data) {
                try {
                  const { error } = await supabase.from('categories').insert({
                    name: row.name || 'Imported Category',
                    color: row.color || '#3B82F6',
                    user_id: user.id
                  });
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
            } else if (fileName.includes('movie')) {
              // Import movies
              for (const row of data) {
                try {
                  const { error } = await supabase.from('movies').insert({
                    title: row.title || 'Imported Movie',
                    description: row.description || '',
                    genre: row.genre || '',
                    release_year: row.release_year || '',
                    director: row.director || '',
                    duration_minutes: row.duration_minutes || '',
                    poster_url: row.poster_url || '',
                    rating: row.rating || '',
                    status: row.status,
                    user_rating: row.user_rating || '',
                    user_notes: row.user_notes || '',
                    watched_at: row.watched_at || '',
                    created_at: row.created_at || new Date().toISOString().split('T')[0],
                    user_id: user.id
                  });
                  if (error) {
                    console.error('Error importing movie:', error);
                    totalErrors++;
                  } else {
                    totalImported++;
                  }
                } catch (err) {
                  console.error('Error processing movie row:', err);
                  totalErrors++;
                }
              }
            } else if (fileName.includes('show')) {
              // Import TV shows tracking data instead of trying to create new shows
              for (const row of data) {
                try {
                  // Check if show exists first, then create tracking record
                  const { data: existingShow } = await supabase
                    .from('shows')
                    .select('id')
                    .eq('title', row.show_title || row.title)
                    .single();

                  if (existingShow) {
                    const { error } = await supabase.from('user_show_tracking').insert({
                      show_id: existingShow.id,
                      user_id: user.id,
                      total_episodes: parseInt(row.total_episodes) || 0,
                      watched_episodes: parseInt(row.watched_episodes) || 0,
                      last_updated: row.last_updated || new Date().toISOString()
                    });
                    if (error) {
                      console.error('Error importing TV show tracking:', error);
                      totalErrors++;
                    } else {
                      totalImported++;
                    }
                  } else {
                    console.log(`Show not found: ${row.show_title || row.title}`);
                    totalErrors++;
                  }
                } catch (err) {
                  console.error('Error processing TV show tracking row:', err);
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
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-amber-700 dark:text-amber-300">TrackerHub Settings</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Configure your application preferences</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="text-amber-700 dark:text-amber-300">Theme Settings</CardTitle>
            <CardDescription>Customize the appearance of the application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {theme === 'light' ? (
                    <Sun className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <Moon className="h-4 w-4 text-blue-500" />
                  )}
                  <Label htmlFor="theme-mode">Dark Mode</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark themes
                </p>
              </div>
              <Switch 
                id="theme-mode" 
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
                className="flex-shrink-0"
              />
            </div>

            <div className="grid gap-2">
              <Label>Theme Selection</Label>
              <Select value={theme} onValueChange={(value: 'light' | 'dark') => setTheme(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center">
                      <Sun className="mr-2 h-4 w-4" />
                      Light Mode
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center">
                      <Moon className="mr-2 h-4 w-4" />
                      Dark Mode
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Current theme: {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-amber-700 dark:text-amber-300">App Preferences</CardTitle>
            <CardDescription>Choose which apps you want to use</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Label htmlFor="public-toggle">Public</Label>
                  <Globe className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Browse public shows and universes
                </p>
              </div>
              <Switch 
                id="public-toggle" 
                checked={settings.enabledApps.public}
                onCheckedChange={() => toggleApp('public')}
                className="flex-shrink-0"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Label htmlFor="movies-toggle">Movies</Label>
                  <Lock className="h-4 w-4 text-gray-600" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Track your movie watchlist and ratings {!user && "(Login required)"}
                </p>
              </div>
              <Switch 
                id="movies-toggle" 
                checked={settings.enabledApps.movies}
                onCheckedChange={() => toggleApp('movies')}
                className="flex-shrink-0"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Label htmlFor="tv-shows-toggle">TV Show Tracker</Label>
                  <Lock className="h-4 w-4 text-gray-600" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Track your favorite TV shows and episodes {!user && "(Login required)"}
                </p>
              </div>
              <Switch 
                id="tv-shows-toggle" 
                checked={settings.enabledApps.tvShows}
                onCheckedChange={() => toggleApp('tvShows')}
                className="flex-shrink-0"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Label htmlFor="finance-toggle">Finance Manager</Label>
                  <Lock className="h-4 w-4 text-gray-600" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Manage your personal finances and expenses {!user && "(Login required)"}
                </p>
              </div>
              <Switch 
                id="finance-toggle" 
                checked={settings.enabledApps.finance}
                onCheckedChange={() => toggleApp('finance')}
                className="flex-shrink-0"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Label htmlFor="settlebill-toggle">SettleBill</Label>
                  <Lock className="h-4 w-4 text-gray-600" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Split bills and settle expenses with friends {!user && "(Login required)"}
                </p>
              </div>
              <Switch 
                id="settlebill-toggle" 
                checked={settings.enabledApps.settlebill}
                onCheckedChange={() => toggleApp('settlebill')}
                className="flex-shrink-0"
              />
            </div>

            {user && isAdmin && (
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <Label htmlFor="admin-toggle">Admin</Label>
                  <p className="text-sm text-muted-foreground">
                    System administration and management
                  </p>
                </div>
                <Switch 
                  id="admin-toggle" 
                  checked={settings.enabledApps.admin}
                  onCheckedChange={() => toggleApp('admin')}
                  className="flex-shrink-0"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Label htmlFor="images-toggle">Images</Label>
                  <ImageIcon className="h-4 w-4 text-pink-600" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Personal media gallery with albums and sharing {!user && "(Login required)"}
                </p>
              </div>
              <Switch 
                id="images-toggle" 
                checked={settings.enabledApps.images}
                onCheckedChange={() => toggleApp('images')}
                className="flex-shrink-0"
              />
            </div>
          </CardContent>
        </Card>

        {/* Email Preferences */}
        {user && (
          <Card className="border-amber-200 dark:border-amber-800 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <Mail className="h-5 w-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>Choose which email summaries you'd like to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-welcome">Welcome Email</Label>
                  <Switch id="email-welcome" checked={preferences.welcome_email} onCheckedChange={v => updatePreference.mutate({ welcome_email: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-monthly">Monthly Digest</Label>
                  <Switch id="email-monthly" checked={preferences.monthly_digest} onCheckedChange={v => updatePreference.mutate({ monthly_digest: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-weekly">Weekly Digest</Label>
                  <Switch id="email-weekly" checked={preferences.weekly_digest} onCheckedChange={v => updatePreference.mutate({ weekly_digest: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-finance">Finance Summary</Label>
                  <Switch id="email-finance" checked={preferences.finance_summary} onCheckedChange={v => updatePreference.mutate({ finance_summary: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-movies">Movies Summary</Label>
                  <Switch id="email-movies" checked={preferences.movies_summary} onCheckedChange={v => updatePreference.mutate({ movies_summary: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-tvshows">TV Shows Summary</Label>
                  <Switch id="email-tvshows" checked={preferences.tv_shows_summary} onCheckedChange={v => updatePreference.mutate({ tv_shows_summary: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-settlebill">SettleBill Summary</Label>
                  <Switch id="email-settlebill" checked={preferences.settlebill_summary} onCheckedChange={v => updatePreference.mutate({ settlebill_summary: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-household">Household Summary</Label>
                  <Switch id="email-household" checked={preferences.household_summary} onCheckedChange={v => updatePreference.mutate({ household_summary: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-inventory">Inventory Summary</Label>
                  <Switch id="email-inventory" checked={preferences.inventory_summary} onCheckedChange={v => updatePreference.mutate({ inventory_summary: v })} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="text-amber-700 dark:text-amber-300">Currency Settings</CardTitle>
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
        
        <Card className="border-amber-200 dark:border-amber-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-amber-700 dark:text-amber-300">Data Management</CardTitle>
            <CardDescription>Export or import your data in CSV format with customizable options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label>Export Data as CSV</Label>
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Select data to export:</Label>
                  <div className="space-y-2">
                    {Object.entries(exportOptions).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={key}
                          checked={value}
                          onCheckedChange={(checked) => 
                            setExportOptions(prev => ({ ...prev, [key]: checked as boolean }))
                          }
                        />
                        <Label htmlFor={key} className="text-sm capitalize">
                          {key === 'tvShows' ? 'TV Shows Tracking' : key}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <Button onClick={handleExportData} className="w-full bg-amber-600 hover:bg-amber-700">
                  <Download className="h-4 w-4 mr-2" />
                  Export Selected Data
                </Button>
              </div>
              
              <div className="space-y-4">
                <Label>Import CSV Data</Label>
                <p className="text-sm text-muted-foreground">
                  Import CSV files with your data. You can select multiple files to import different data types at once.
                </p>
                <Button onClick={handleImportData} variant="outline" className="w-full border-amber-200 text-amber-700 hover:bg-amber-50">
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV Files
                </Button>
                <div className="flex items-start space-x-2 text-xs text-muted-foreground">
                  <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Supports CSV files with headers. File names should contain keywords like 'wallet', 'transaction', 'category', 'transfer', 'movie', or 'tv-show' to auto-detect data type.</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="text-amber-700 dark:text-amber-300">Display Preferences</CardTitle>
            <CardDescription>Customize how financial data is displayed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <Label htmlFor="show-cents">Show Cents</Label>
                <p className="text-sm text-muted-foreground">
                  Display decimal places in monetary values
                </p>
              </div>
              <Switch id="show-cents" defaultChecked className="flex-shrink-0" />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <Label htmlFor="thousand-separator">Use Thousand Separator</Label>
                <p className="text-sm text-muted-foreground">
                  Add commas to separate thousands in numbers
                </p>
              </div>
              <Switch id="thousand-separator" defaultChecked className="flex-shrink-0" />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <Label htmlFor="colorize-amounts">Colorize Amounts</Label>
                <p className="text-sm text-muted-foreground">
                  Show expenses in red and income in green
                </p>
              </div>
              <Switch id="colorize-amounts" defaultChecked className="flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinanceSettings;
