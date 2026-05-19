import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useHouseholdCategories, useCreateHouseholdCategory, useDeleteHouseholdCategory } from '@/hooks/useHouseholdCategories';
import { Tag, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  networkId: string;
}

export const HouseholdCategoriesManager: React.FC<Props> = ({ networkId }) => {
  const { data: categories, isLoading } = useHouseholdCategories(networkId);
  const createCategory = useCreateHouseholdCategory();
  const deleteCategory = useDeleteHouseholdCategory();
  const [newName, setNewName] = useState('');

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      await createCategory.mutateAsync({ network_id: networkId, name: newName.trim() });
      toast.success('Category added');
      setNewName('');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory.mutateAsync({ id, networkId });
      toast.success('Category deleted');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          Expense Categories
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New category name"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Button onClick={handleAdd} disabled={!newName.trim()} size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories?.map(cat => (
              <div key={cat.id} className="flex items-center gap-1 border rounded-full px-3 py-1" style={{ borderColor: cat.color }}>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-sm">{cat.name}</span>
                {cat.is_predefined && <Badge variant="outline" className="text-xs ml-1">Default</Badge>}
                {!cat.is_predefined && (
                  <button onClick={() => handleDelete(cat.id)} className="ml-1 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
