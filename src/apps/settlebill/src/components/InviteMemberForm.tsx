
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Mail, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface InviteMemberFormProps {
  networkId: string;
  networkName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const InviteMemberForm: React.FC<InviteMemberFormProps> = ({ 
  networkId, 
  networkName, 
  onClose, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    message: `You've been invited to join the "${networkName}" network on SettleBill. Join us to start splitting bills and managing shared expenses!`
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      if (!formData.email.trim()) {
        setError('Email is required');
        return;
      }

      if (!formData.name.trim()) {
        setError('Name is required');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        return;
      }

      // Here you would typically call a backend function to send the invitation email
      // For now, we'll simulate the process
      console.log('Sending invitation email:', {
        to: formData.email,
        name: formData.name,
        networkId,
        networkName,
        message: formData.message
      });

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success(`Invitation sent to ${formData.email}!`);
      setFormData({
        email: '',
        name: '',
        message: `You've been invited to join the "${networkName}" network on SettleBill. Join us to start splitting bills and managing shared expenses!`
      });
      onSuccess?.();
      onClose();
      
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      setError(error.message || 'Failed to send invitation');
      toast.error('Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Invite Member via Email
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-lg">
          <p className="text-sm text-teal-700">
            Inviting someone who isn't registered yet? They'll receive an email invitation to join SettleBill and your network.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter their email address"
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter their name"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Invitation Message</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Customize the invitation message..."
              rows={4}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button 
              type="submit"
              disabled={isSubmitting || !formData.email.trim() || !formData.name.trim()}
              className="flex-1 bg-teal-600 hover:bg-teal-700"
            >
              {isSubmitting ? 'Sending Invitation...' : 'Send Invitation'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
