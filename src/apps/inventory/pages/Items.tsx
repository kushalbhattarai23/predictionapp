import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Pencil, Trash2, Archive, Package } from 'lucide-react';
import { ImportInventoryDialog } from '../components/ImportInventoryDialog';
import { useInventoryItems, useInventoryCategories, useInventoryStores } from '@/hooks/useInventory';
import { useCurrency } from '@/hooks/useCurrency';
import { toast } from 'sonner';

const UNITS = ['pcs', 'kg', 'g', 'liter', 'ml', 'pack', 'box', 'pair', 'set', 'roll', 'bottle'];

const InventoryItems: React.FC = () => {
  const { items, addItem, updateItem, deleteItem } = useInventoryItems();
  const { categories } = useInventoryCategories();
  const { stores } = useInventoryStores();
  const { formatAmount } = useCurrency();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showArchived, setShowArchived] = useState(false);

  const [form, setForm] = useState({
    name: '', category_id: '', store_id: '', quantity: 0, unit: 'pcs', min_stock: 0,
    purchase_price: 0, location: '', expiry_date: '', notes: '',
  });

  const resetForm = () => {
    setForm({ name: '', category_id: '', store_id: '', quantity: 0, unit: 'pcs', min_stock: 0, purchase_price: 0, location: '', expiry_date: '', notes: '' });
    setEditingItem(null);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    const payload = {
      ...form,
      category_id: form.category_id || null,
      store_id: form.store_id || null,
      expiry_date: form.expiry_date || null,
      location: form.location || null,
      notes: form.notes || null,
      household_id: null,
      organization_id: null,
      is_archived: false,
    };

    if (editingItem) {
      updateItem.mutate({ id: editingItem.id, ...payload });
    } else {
      addItem.mutate(payload);
    }
    setShowForm(false);
    resetForm();
  };

  const startEdit = (item: any) => {
    setForm({
      name: item.name, category_id: item.category_id || '', store_id: item.store_id || '', quantity: item.quantity,
      unit: item.unit, min_stock: item.min_stock, purchase_price: item.purchase_price,
      location: item.location || '', expiry_date: item.expiry_date || '', notes: item.notes || '',
    });
    setEditingItem(item);
    setShowForm(true);
  };

  const filteredItems = items.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const matchesArchive = showArchived ? i.is_archived : !i.is_archived;
    return matchesSearch && matchesArchive;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-foreground">Inventory Items</h1>
        <div className="flex gap-2 flex-wrap">
          <ImportInventoryDialog />
          <Button variant="outline" size="sm" onClick={() => setShowArchived(!showArchived)}>
            <Archive className="h-4 w-4 mr-1" /> {showArchived ? 'Active' : 'Archived'}
          </Button>
          <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90"><Plus className="h-4 w-4 mr-1" /> Add Item</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Category</Label>
                    <Select value={form.category_id} onValueChange={v => setForm({ ...form, category_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Store</Label>
                    <Select value={form.store_id} onValueChange={v => setForm({ ...form, store_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select store" /></SelectTrigger>
                      <SelectContent>{stores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Unit</Label>
                    <Select value={form.unit} onValueChange={v => setForm({ ...form, unit: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: +e.target.value })} /></div>
                  <div><Label>Min Stock</Label><Input type="number" value={form.min_stock} onChange={e => setForm({ ...form, min_stock: +e.target.value })} /></div>
                  <div><Label>Price/Unit</Label><Input type="number" value={form.purchase_price} onChange={e => setForm({ ...form, purchase_price: +e.target.value })} /></div>
                </div>
                <div><Label>Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
                <div><Label>Expiry Date</Label><Input type="date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} /></div>
                <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                <Button onClick={handleSubmit} className="w-full bg-primary hover:bg-primary/90">{editingItem ? 'Update' : 'Add'} Item</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Card className="border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Min</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground"><Package className="h-8 w-8 mx-auto mb-2 opacity-50" />No items found</TableCell></TableRow>
              ) : filteredItems.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                  <TableCell>{item.store?.name ? <Badge variant="outline">{item.store.name}</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell>{item.category?.name ? <Badge variant="secondary">{item.category.name}</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-right">
                    <span className={item.quantity <= item.min_stock && item.min_stock > 0 ? 'text-destructive font-bold' : 'text-foreground'}>
                      {item.quantity} {item.unit}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{item.min_stock}</TableCell>
                  <TableCell className="text-right text-foreground">{formatAmount(item.purchase_price)}</TableCell>
                  <TableCell className="text-right font-medium text-foreground">{formatAmount(item.quantity * item.purchase_price)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(item)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => updateItem.mutate({ id: item.id, is_archived: !item.is_archived })}>
                        <Archive className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteItem.mutate(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryItems;
