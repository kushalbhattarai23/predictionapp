
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Tag, Edit, Trash2, Search } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';

const colorOptions = [
  { value: '#22C55E', label: 'Green' },
  { value: '#3B82F6', label: 'Blue' },
  { value: '#EF4444', label: 'Red' },
  { value: '#F59E0B', label: 'Orange' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#84CC16', label: 'Lime' }
];

export const FinanceCategories: React.FC = () => {
  const navigate = useNavigate();
  const { categories, isLoading, createCategory, updateCategory, deleteCategory } = useCategories();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    color: '#22C55E'
  });

  const filteredCategories = useMemo(() => {
    return categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCategory) {
      updateCategory.mutate({ id: editingCategory.id, ...formData });
    } else {
      createCategory.mutate(formData);
    }
    
    setIsDialogOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', color: '#22C55E' });
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: category.color
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      deleteCategory.mutate(id);
    }
  };

  const handleCategoryClick = (categoryName: string) => {
    navigate(`/finance/categories/${encodeURIComponent(categoryName.toLowerCase())}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-green-700">Categories</h1>
          <p className="text-muted-foreground">Organize your transactions by category</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Category' : 'Create New Category'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Groceries, Entertainment"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="color">Color</Label>
                <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color.value }} />
                          <span>{color.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" className="bg-green-600 hover:bg-green-700 flex-1">
                  {editingCategory ? 'Update' : 'Create'} Category
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="text-green-700">Search Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>
      
      {isLoading ? (
        <div className="text-center py-8">Loading categories...</div>
      ) : filteredCategories.length === 0 ? (
        <Card className="border-green-200">
          <CardContent className="text-center py-8">
            <Tag className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'No Categories Found' : 'No Categories Yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? `No categories match "${searchTerm}"`
                : 'Create your first category to organize your transactions'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredCategories.map((category) => (
            <Card 
              key={category.id} 
              className="border-green-200 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleCategoryClick(category.name)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  />
                  <CardTitle className="text-green-700 text-sm sm:text-base">{category.name}</CardTitle>
                </div>
                <div className="flex space-x-1">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(category);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(category.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FinanceCategories;
