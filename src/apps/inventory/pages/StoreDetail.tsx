import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Package, Plus, Store, Trash2 } from 'lucide-react';
import { useInventoryStores, useInventoryItems } from '@/hooks/useInventory';
import { useCurrency } from '@/hooks/useCurrency';
import { toast } from 'sonner';

const StoreDetail: React.FC = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { stores } = useInventoryStores();
  const { items, updateItem } = useInventoryItems();
  const { formatAmount } = useCurrency();
  const [showAssign, setShowAssign] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');

  const store = stores.find(s => s.id === storeId);
  const storeItems = items.filter(i => i.store_id === storeId && !i.is_archived);
  const unassignedItems = items.filter(i => !i.store_id && !i.is_archived);
  const totalValue = storeItems.reduce((sum, i) => sum + i.quantity * i.purchase_price, 0);

  if (!store) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Store not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/inventory/stores')}>Back to Stores</Button>
      </div>
    );
  }

  const handleAssign = () => {
    if (!selectedItemId) { toast.error('Select an item'); return; }
    updateItem.mutate({ id: selectedItemId, store_id: storeId } as any);
    setShowAssign(false);
    setSelectedItemId('');
  };

  const handleRemoveFromStore = (itemId: string) => {
    updateItem.mutate({ id: itemId, store_id: null } as any);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/inventory/stores')}><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: store.color + '20' }}>
            <Store className="h-5 w-5" style={{ color: store.color }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{store.name}</h1>
            {store.address && <p className="text-sm text-muted-foreground">{store.address}</p>}
          </div>
        </div>
      </div>

      {store.description && <p className="text-muted-foreground">{store.description}</p>}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Items</p>
            <p className="text-2xl font-bold text-foreground">{storeItems.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold text-foreground">{formatAmount(totalValue)}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Low Stock</p>
            <p className="text-2xl font-bold text-destructive">{storeItems.filter(i => i.quantity <= i.min_stock && i.min_stock > 0).length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Items in this store</h2>
        <Dialog open={showAssign} onOpenChange={setShowAssign}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary hover:bg-primary/90"><Plus className="h-4 w-4 mr-1" /> Assign Item</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Assign Item to Store</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Select Item</Label>
                <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                  <SelectTrigger><SelectValue placeholder="Choose an unassigned item" /></SelectTrigger>
                  <SelectContent>
                    {unassignedItems.length === 0 ? (
                      <SelectItem value="none" disabled>No unassigned items</SelectItem>
                    ) : unassignedItems.map(i => (
                      <SelectItem key={i.id} value={i.id}>{i.name} ({i.quantity} {i.unit})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAssign} className="w-full bg-primary hover:bg-primary/90" disabled={!selectedItemId}>Assign to Store</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {storeItems.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />No items in this store
                </TableCell></TableRow>
              ) : storeItems.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                  <TableCell>{item.category?.name ? <Badge variant="secondary">{item.category.name}</Badge> : '—'}</TableCell>
                  <TableCell className="text-right">
                    <span className={item.quantity <= item.min_stock && item.min_stock > 0 ? 'text-destructive font-bold' : 'text-foreground'}>
                      {item.quantity} {item.unit}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-foreground">{formatAmount(item.quantity * item.purchase_price)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleRemoveFromStore(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

export default StoreDetail;
