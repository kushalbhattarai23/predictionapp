import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calculator, Search, Link2, Copy, ExternalLink, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import {
  useAllFinalCalculationShares,
  useDeleteFinalCalculationShare,
} from '@/hooks/useFinalCalculationShares';

export const FinalCalculationsPage: React.FC = () => {
  const { data: shares = [], isLoading } = useAllFinalCalculationShares();
  const deleteShare = useDeleteFinalCalculationShare();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return shares;
    return shares.filter(
      s =>
        s.network_name.toLowerCase().includes(q) ||
        s.share_id.toLowerCase().includes(q)
    );
  }, [shares, search]);

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied!');
  };

  const handleDelete = (id: string, networkId: string) => {
    if (!window.confirm('Delete this public link?')) return;
    deleteShare.mutate(
      { id, networkId },
      {
        onSuccess: () => toast.success('Public link deleted'),
        onError: () => toast.error('Failed to delete link'),
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-red-700 mb-2 flex items-center gap-3">
            <Calculator className="w-8 h-8 text-red-600" />
            Final Calculations
          </h1>
          <p className="text-red-500">All publicly shared final calculation links across your networks</p>
        </div>

        <Card className="shadow-lg bg-white/70 border border-orange-200">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5" />
                Shared Links
                <Badge variant="secondary">{shares.length}</Badge>
              </CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by network or share id..."
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Link2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{shares.length === 0 ? 'No shared links yet.' : 'No links match your search.'}</p>
                {shares.length === 0 && (
                  <p className="text-sm mt-2">
                    Create a public link from a network's Final Amount Calculation section.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((link) => {
                  const publicUrl = `${window.location.origin}/final-calculation/${link.share_id}`;
                  return (
                    <div
                      key={link.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border border-orange-100 rounded-lg bg-white hover:bg-orange-50/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Users className="w-4 h-4 text-red-600 flex-shrink-0" />
                          <span className="font-semibold text-gray-900 truncate">
                            {link.network_name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {new Date(link.created_at).toLocaleDateString()}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{publicUrl}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(publicUrl)}
                          title="Copy link"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" title="Open link">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(link.id, link.network_id)}
                          disabled={deleteShare.isPending}
                          title="Delete link"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
