
import React, { useState } from 'react';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Building2, User } from 'lucide-react';

export const OrganizationSwitcher: React.FC = () => {
  const { organizations, createOrganization } = useOrganizations();
  const { currentOrganization, setCurrentOrganization, isPersonalMode } = useOrganizationContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOrganization.mutate(formData, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setFormData({ name: '', description: '' });
      }
    });
  };

  const handleOrganizationChange = (value: string) => {
    console.log('Organization changed to:', value);
    if (value === 'personal') {
      setCurrentOrganization(null);
    } else {
      const org = organizations.find(o => o.id === value);
      if (org) {
        console.log('Setting organization:', org);
        setCurrentOrganization({
          id: org.id,
          name: org.name
        });
      }
    }
  };

  const currentValue = isPersonalMode ? 'personal' : currentOrganization?.id || 'personal';

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2 min-w-0">
        {isPersonalMode ? (
          <User className="h-4 w-4 text-blue-600" />
        ) : (
          <Building2 className="h-4 w-4 text-green-600" />
        )}
        <Select value={currentValue} onValueChange={handleOrganizationChange}>
          <SelectTrigger className="w-48">
            <SelectValue>
              {isPersonalMode ? 'Personal' : currentOrganization?.name}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="personal">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Personal</span>
              </div>
            </SelectItem>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4" />
                  <span>{org.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            New Company
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Company</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Acme Corp"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of your company"
                rows={3}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="submit" className="flex-1" disabled={createOrganization.isPending}>
                {createOrganization.isPending ? 'Creating...' : 'Create Company'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
