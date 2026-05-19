import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Store, Pencil, Trash2, Package, MapPin } from 'lucide-react';
import { useInventoryStores } from '@/hooks/useInventory';
import { useInventoryItems } from '@/hooks/useInventory';
import { useCurrency } from '@/hooks/useCurrency';
import { toast } from 'sonner';

const STORE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

const InventoryStores: React.FC = () => {
  const navigate = useNavigate();
  const { stores, addStore, updateStore, deleteStore } = useInventoryStores();
  const { items } = useInventoryItems();
  const { formatAmount } = useCurrency();
  const [showForm, setShowForm] = useState(false);
  const [editingStore, setEditingStore] = useState<any>(null);
  const [form, setForm] = useState({ name: '', address: '', description: '', color: '#3B82F6' });

  const resetForm = () => {
    setForm({ name: '', address: '', description: '', color: '#3B82F6' });
    setEditingStore(null);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error('Store name is required'); return; }
    if (editingStore) {
      updateStore.mutate({ id: editingStore.id, ...form });
    } else {
      addStore.mutate(form);
    }
    setShowForm(false);
    resetForm();
  };

  const startEdit = (store: any) => {
    setForm({ name: store.name, address: store.address || '', description: store.description || '', color: store.color || '#3B82F6' });
    setEditingStore(store);
    setShowForm(true);
  };

  const getStoreItemCount = (storeId: string) => items.filter(i => i.store_id === storeId && !i.is_archived).length;
  const getStoreValue = (storeId: string) => items.filter(i => i.store_id === storeId && !i.is_archived).reduce((sum, i) => sum + i.quantity * i.purchase_price, 0);
  const unassignedItems = items.filter(i => !i.store_id && !i.is_archived);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stores</h1>
          <p className="text-muted-foreground">Manage your inventory locations</p>
        </div>
        <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90"><Plus className="h-4 w-4 mr-1" /> Add Store</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editingStore ? 'Edit Store' : 'Add New Store'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Store Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Main Warehouse" /></div>
              <div><Label>Address</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="e.g. 123 Main St" /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional notes about this store" /></div>
              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-1">
                  {STORE_COLORS.map(c => (
                    <button key={c} onClick={() => setForm({ ...form, color: c })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <Button onClick={handleSubmit} className="w-full bg-primary hover:bg-primary/90">{editingStore ? 'Update' : 'Create'} Store</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Unassigned items notice */}
      {unassignedItems.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-600" />
              <span className="text-sm text-foreground">{unassignedItems.length} item{unassignedItems.length !== 1 ? 's' : ''} not assigned to any store</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/inventory/items')}>
              Assign Items
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.length === 0 ? (
          <Card className="col-span-full border-border">
            <CardContent className="p-8 text-center">
              <Store className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No stores yet. Create your first store to organize inventory.</p>
            </CardContent>
          </Card>
        ) : stores.map(store => {
          const itemCount = getStoreItemCount(store.id);
          const storeValue = getStoreValue(store.id);
          return (
            <Card key={store.id} className="border-border hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/inventory/stores/${store.id}`)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: store.color + '20' }}>
                      <Store className="h-5 w-5" style={{ color: store.color }} />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-foreground">{store.name}</CardTitle>
                      {store.address && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{store.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(store)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteStore.mutate(store.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {store.description && <p className="text-sm text-muted-foreground mb-3">{store.description}</p>}
                <div className="flex gap-3">
                  <Badge variant="secondary">{itemCount} item{itemCount !== 1 ? 's' : ''}</Badge>
                  <Badge variant="outline" className="text-foreground">{formatAmount(storeValue)}</Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default InventoryStores;
