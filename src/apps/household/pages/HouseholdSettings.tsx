import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Home, BadgeIndianRupee, Settings } from 'lucide-react';
import { currencies } from '@/config/currencies';
import { useCurrency } from '@/hooks/useCurrency';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const HouseholdSettings: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const networkId = id || '';
  const { currency, updateCurrency } = useCurrency();
  const { toast } = useToast();

  const { data: network } = useQuery({
    queryKey: ['household-network', networkId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settlegara_networks')
        .select('*')
        .eq('id', networkId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!networkId,
  });

  const handleCurrencyChange = (value: string) => {
    updateCurrency(value);
    const selected = currencies.find(c => c.code === value);
    toast({
      title: 'Currency Updated',
      description: `Currency set to ${selected?.name} (${selected?.symbol})`,
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to={`/household/${networkId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-sky-700 dark:text-sky-300">
            <Settings className="h-6 w-6" />
            Settings
          </h1>
          <p className="text-sm text-muted-foreground">{network?.name || 'Household'} settings</p>
        </div>
      </div>

      <Card className="border-sky-200 dark:border-sky-800">
        <CardHeader>
          <CardTitle className="text-sky-700 dark:text-sky-300">Currency Settings</CardTitle>
          <CardDescription>Choose your preferred currency for household expenses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="household-currency">Display Currency</Label>
            <Select value={currency.code} onValueChange={handleCurrencyChange}>
              <SelectTrigger id="household-currency" className="w-full">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <div className="flex items-center">
                      <span className="mr-2">{c.symbol}</span>
                      <span>{c.name} ({c.code})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              This will change how amounts are displayed across the Household Ledger
            </p>
          </div>

          <div className="grid gap-2">
            <Label>Example Amount</Label>
            <div className="flex items-center p-2 border rounded-md bg-muted/30">
              <BadgeIndianRupee className="h-5 w-5 mr-2" />
              <span className="text-xl font-semibold">
                {currency.symbol} 1,000.00
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HouseholdSettings;
