import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Download, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Props {
  networkId: string;
  members: { id: string; user_name: string; user_email: string }[];
}

const SAMPLE_CSV = `title,amount,paid_by_email,date,notes
Groceries,1500,user@example.com,2026-03-01,Weekly groceries
Electricity Bill,2000,user@example.com,2026-03-05,March bill
Water Bill,500,user@example.com,2026-03-10,`;

export const ImportLedgerDialog: React.FC<Props> = ({ networkId, members }) => {
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
    a.download = 'household_ledger_template.csv';
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
    }).filter(r => r.title && r.amount);
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
      const member = members.find(m => m.user_email === row.paid_by_email);
      if (!member) continue;

      const { data: bill, error } = await supabase.from('settlegara_bills').insert({
        network_id: networkId,
        title: row.title,
        total_amount: parseFloat(row.amount),
        paid_by: member.id,
        created_by: user.id,
        status: 'pending',
        split_type: 'equal',
        source_app: 'household',
      }).select().single();

      if (!error && bill) {
        const splitAmount = parseFloat(row.amount) / members.length;
        const splits = members.map(m => ({
          bill_id: bill.id,
          member_id: m.id,
          amount: splitAmount,
          status: 'pending',
        }));
        await supabase.from('settlegara_bill_splits').insert(splits);
        success++;
      }
    }
    queryClient.invalidateQueries({ queryKey: ['household-bills'] });
    toast.success(`Imported ${success} of ${preview.length} entries`);
    setImporting(false);
    setPreview([]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-sky-200 text-sky-700 hover:bg-sky-50">
          <Upload className="h-4 w-4 mr-1" /> Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Import Ledger Entries</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="w-full">
            <Download className="h-4 w-4 mr-2" /> Download Sample Template
          </Button>
          <p className="text-xs text-muted-foreground">
            CSV columns: <code>title, amount, paid_by_email, date, notes</code>
          </p>
          <Input ref={fileRef} type="file" accept=".csv" onChange={handleFile} />
          {preview.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{preview.length} entries found:</p>
              <div className="max-h-40 overflow-y-auto border rounded p-2 text-xs space-y-1">
                {preview.map((r, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{r.title}</span>
                    <span className="font-medium">{r.amount}</span>
                  </div>
                ))}
              </div>
              <Button onClick={handleImport} disabled={importing} className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                {importing ? 'Importing...' : `Import ${preview.length} Entries`}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
