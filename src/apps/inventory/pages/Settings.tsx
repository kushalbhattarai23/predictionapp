import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useInventoryItems, useInventoryTransactions } from '@/hooks/useInventory';
import { useCurrency } from '@/hooks/useCurrency';
import { currencies } from '@/config/currencies';
import { Download, FileSpreadsheet, Coins } from 'lucide-react';
import { toast } from 'sonner';

const InventorySettings: React.FC = () => {
  const { items } = useInventoryItems();
  const { transactions } = useInventoryTransactions();
  const { currency, updateCurrency } = useCurrency();

  const exportItemsCSV = () => {
    const headers = ['Name', 'Category', 'Quantity', 'Unit', 'Min Stock', 'Purchase Price', 'Value', 'Location', 'Expiry Date', 'Notes'];
    const rows = items.map(i => [
      i.name, i.category?.name || '', i.quantity, i.unit, i.min_stock,
      i.purchase_price, i.quantity * i.purchase_price, i.location || '', i.expiry_date || '', i.notes || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'inventory-items.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Items exported');
  };

  const exportTransactionsCSV = () => {
    const headers = ['Date', 'Item', 'Type', 'Quantity Change', 'Notes'];
    const rows = transactions.map(t => [
      new Date(t.created_at).toLocaleDateString(),
      (t.item as any)?.name || '', t.transaction_type, t.quantity_change, t.notes || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'inventory-transactions.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Transactions exported');
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Inventory Settings</h1>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Coins className="h-5 w-5 text-primary" /> Currency
          </CardTitle>
          <CardDescription>Select the currency used for inventory valuation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="currency-select">Preferred Currency</Label>
            <Select value={currency.code} onValueChange={updateCurrency}>
              <SelectTrigger id="currency-select" className="w-full md:w-64">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map(c => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.symbol} — {c.name} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Export Data</CardTitle>
          <CardDescription>Download your inventory data as CSV files</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" onClick={exportItemsCSV} className="w-full justify-start">
            <Download className="h-4 w-4 mr-2" /> Export Items ({items.length} items)
          </Button>
          <Button variant="outline" onClick={exportTransactionsCSV} className="w-full justify-start">
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Export Transactions ({transactions.length} records)
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Total Items</span><span className="font-medium text-foreground">{items.filter(i => !i.is_archived).length}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Archived Items</span><span className="font-medium text-foreground">{items.filter(i => i.is_archived).length}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Total Transactions</span><span className="font-medium text-foreground">{transactions.length}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Currency</span><span className="font-medium text-foreground">{currency.symbol} {currency.name}</span></div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventorySettings;
