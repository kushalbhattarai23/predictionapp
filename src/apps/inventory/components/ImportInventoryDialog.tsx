import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Download, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const SAMPLE_CSV = `name,quantity,unit,min_stock,purchase_price,location,notes
Rice,25,kg,5,80,Kitchen Pantry,Basmati
Cooking Oil,3,liter,1,250,Kitchen Shelf,Sunflower
Sugar,5,kg,2,95,Kitchen Pantry,
Soap,12,pcs,3,45,Bathroom,Detergent bar
Milk Packets,10,pack,4,35,Fridge,`;

export const ImportInventoryDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const downloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory_items_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = values[i] || ''; });
      return row;
    }).filter(r => r.name);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rows = parseCSV(ev.target?.result as string);
      setPreview(rows);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!preview.length || !user) return;
    setImporting(true);
    let success = 0;
    for (const row of preview) {
      const { error } = await supabase.from('inventory_items_tracker').insert({
        user_id: user.id,
        name: row.name,
        quantity: parseFloat(row.quantity) || 0,
        unit: row.unit || 'pcs',
        min_stock: parseFloat(row.min_stock) || 0,
        purchase_price: parseFloat(row.purchase_price) || 0,
        location: row.location || null,
        notes: row.notes || null,
        is_archived: false,
      });
      if (!error) success++;
    }
    queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
    toast.success(`Imported ${success} of ${preview.length} items`);
    setImporting(false);
    setPreview([]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-1" /> Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Import Inventory Items</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="w-full">
            <Download className="h-4 w-4 mr-2" /> Download Sample Template
          </Button>
          <p className="text-xs text-muted-foreground">
            CSV columns: <code>name, quantity, unit, min_stock, purchase_price, location, notes</code>
          </p>
          <Input ref={fileRef} type="file" accept=".csv" onChange={handleFile} />
          {preview.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{preview.length} items found:</p>
              <div className="max-h-40 overflow-y-auto border rounded p-2 text-xs space-y-1">
                {preview.map((r, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{r.name}</span>
                    <span className="font-medium">{r.quantity} {r.unit || 'pcs'}</span>
                  </div>
                ))}
              </div>
              <Button onClick={handleImport} disabled={importing} className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                {importing ? 'Importing...' : `Import ${preview.length} Items`}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
