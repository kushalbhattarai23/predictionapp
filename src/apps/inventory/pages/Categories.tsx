import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { useInventoryCategories } from '@/hooks/useInventory';

const DEFAULT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

const InventoryCategories: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory } = useInventoryCategories();
  const [showForm, setShowForm] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');

  const resetForm = () => { setName(''); setColor('#3B82F6'); setEditingCat(null); };

  const handleSubmit = () => {
    if (!name.trim()) return;
    if (editingCat) {
      updateCategory.mutate({ id: editingCat.id, name, color });
    } else {
      addCategory.mutate({ name, color });
    }
    setShowForm(false);
    resetForm();
  };

  const startEdit = (cat: any) => {
    setName(cat.name);
    setColor(cat.color);
    setEditingCat(cat);
    setShowForm(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Inventory Categories</h1>
        <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90"><Plus className="h-4 w-4 mr-1" /> Add Category</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingCat ? 'Edit' : 'Add'} Category</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-2">
                  {DEFAULT_COLORS.map(c => (
                    <button key={c} onClick={() => setColor(c)}
                      className={`h-8 w-8 rounded-full border-2 ${color === c ? 'border-foreground' : 'border-transparent'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <Button onClick={handleSubmit} className="w-full bg-primary hover:bg-primary/90">{editingCat ? 'Update' : 'Add'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.length === 0 ? (
          <Card className="col-span-full border-border">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No categories yet. Add one to organize your inventory.
            </CardContent>
          </Card>
        ) : categories.map(cat => (
          <Card key={cat.id} className="border-border">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="font-medium text-foreground">{cat.name}</span>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => startEdit(cat)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteCategory.mutate(cat.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default InventoryCategories;
