
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCreateNetwork } from '@/hooks/useSettleBillNetworks';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface NetworkFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const NetworkForm: React.FC<NetworkFormProps> = ({ onClose, onSuccess }) => {
  const createNetworkMutation = useCreateNetwork();
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.name.trim()) {
      setError('Network name is required');
      return;
    }

    createNetworkMutation.mutate(formData, {
      onSuccess: () => {
        toast.success('Network created successfully');
        setFormData({ name: '', description: '' });
        onSuccess?.();
      },
      onError: (error) => {
        console.error('Error creating network:', error);
        setError(error.message || 'Failed to create network');
        toast.error('Failed to create network');
      }
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Network Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Family, Roommates, Friends"
            required
            disabled={createNetworkMutation.isPending}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe this network..."
            rows={3}
            disabled={createNetworkMutation.isPending}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-4">
          <Button 
            type="submit"
            disabled={createNetworkMutation.isPending || !formData.name.trim()}
            className="flex-1"
          >
            {createNetworkMutation.isPending ? 'Creating...' : 'Create Network'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose} 
            className="flex-1"
            disabled={createNetworkMutation.isPending}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};
