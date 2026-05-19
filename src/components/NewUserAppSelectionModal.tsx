import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DollarSign, Tv, Film, Receipt, Home, Package, Zap, Bug, Globe, Image } from 'lucide-react';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const availableApps = [
  { id: 'public' as const, name: 'Public', description: 'Browse public shows and universes', icon: Globe, color: 'bg-blue-500' },
  { id: 'movies' as const, name: 'Movies', description: 'Track your movie watchlist and ratings', icon: Film, color: 'bg-blue-500' },
  { id: 'tvShows' as const, name: 'TV Shows', description: 'Track your favorite TV shows', icon: Tv, color: 'bg-purple-500' },
  { id: 'finance' as const, name: 'Finance', description: 'Personal finance tracking', icon: DollarSign, color: 'bg-green-500' },
  { id: 'settlebill' as const, name: 'SettleBill', description: 'Split bills with friends', icon: Receipt, color: 'bg-rose-500' },
  { id: 'household' as const, name: 'Household', description: 'Manage shared household expenses', icon: Home, color: 'bg-sky-500' },
  { id: 'inventory' as const, name: 'Inventory', description: 'Track inventory and stock levels', icon: Package, color: 'bg-teal-500' },
  { id: 'quickCommerce' as const, name: 'QuickCommerce', description: '10-minute delivery e-commerce', icon: Zap, color: 'bg-amber-500' },
  { id: 'images' as const, name: 'Images', description: 'Manage your image albums', icon: Image, color: 'bg-indigo-500' },
  { id: 'qa' as const, name: 'QA Bug Tracker', description: 'Track and resolve bugs', icon: Bug, color: 'bg-red-500' },
];

interface NewUserAppSelectionModalProps {
  open: boolean;
  onClose: () => void;
}

export const NewUserAppSelectionModal: React.FC<NewUserAppSelectionModalProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedApps, setSelectedApps] = useState<Set<string>>(
    new Set(availableApps.map(a => a.id)) // All selected by default
  );
  const [saving, setSaving] = useState(false);

  const toggleApp = (appId: string) => {
    setSelectedApps(prev => {
      const next = new Set(prev);
      if (next.has(appId)) {
        next.delete(appId);
      } else {
        next.add(appId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Build preference records for all apps
      const records = availableApps.map(app => ({
        user_id: user.id,
        app_name: app.id,
        enabled: selectedApps.has(app.id),
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('user_app_preferences')
        .upsert(records, { onConflict: 'user_id,app_name' });

      if (error) throw error;

      toast({ title: 'App preferences saved!' });
      onClose();
    } catch (err: any) {
      console.error('Error saving app preferences:', err);
      toast({ title: 'Error saving preferences', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Welcome to TrackerHub! 🎉</DialogTitle>
          <DialogDescription>
            Choose which applications you'd like to use. You can change this later in Settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-4">
          {availableApps.map(app => {
            const Icon = app.icon;
            const isSelected = selectedApps.has(app.id);
            return (
              <label
                key={app.id}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleApp(app.id)}
                />
                <div className={`w-9 h-9 rounded-full ${app.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm">{app.name}</p>
                  <p className="text-xs text-muted-foreground">{app.description}</p>
                </div>
              </label>
            );
          })}
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving || selectedApps.size === 0} className="flex-1">
            {saving ? 'Saving...' : `Continue with ${selectedApps.size} app${selectedApps.size !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
