import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Search, Plus, Pencil, Trash2, Globe, Eye } from 'lucide-react';
import RequireAdmin from '@/components/Auth/RequireAdmin';
import {
  useAllPageMetadata,
  usePageMetadataMutations,
  type PageMetadata,
  type PageMetadataInsert,
} from '@/hooks/usePageMetadata';

const KNOWN_ROUTES = [
  '/', '/landing', '/login', '/signup', '/profile', '/settings', '/requests',
  '/public/shows', '/public/universes',
  '/finance', '/finance/transactions', '/finance/categories', '/finance/wallets',
  '/finance/budgets', '/finance/credits', '/finance/transfers', '/finance/reports',
  '/finance/balance-check', '/finance/balances', '/finance/month-vs-month',
  '/finance/settings', '/finance/tools', '/finance/scheduled-payments',
  '/tv-shows', '/tv-shows/my-shows', '/tv-shows/universes',
  '/movies',
  '/settlebill', '/settlebill/networks', '/settlebill/members', '/settlebill/bills',
  '/settlebill/settings',
  '/admin', '/admin/users', '/admin/content', '/admin/seo',
  '/privacy-policy', '/terms-of-service', '/sitemap', '/notifications',
];

const EMPTY_FORM: PageMetadataInsert = {
  route: '',
  title: '',
  meta_description: '',
  meta_keywords: '',
  og_title: '',
  og_description: '',
  canonical_url: '',
};

const AdminSEO: React.FC = () => {
  const { toast } = useToast();
  const { data: pages = [], isLoading } = useAllPageMetadata();
  const { createMutation, updateMutation, deleteMutation } = usePageMetadataMutations();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PageMetadataInsert>({ ...EMPTY_FORM });
  const [previewOpen, setPreviewOpen] = useState(false);

  const filtered = pages.filter(
    (p) =>
      p.route.toLowerCase().includes(search.toLowerCase()) ||
      (p.title || '').toLowerCase().includes(search.toLowerCase())
  );

  const existingRoutes = new Set(pages.map((p) => p.route));
  const suggestedRoutes = KNOWN_ROUTES.filter((r) => !existingRoutes.has(r));

  const titleLen = (form.title || '').length;
  const descLen = (form.meta_description || '').length;

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  };

  const openEdit = (page: PageMetadata) => {
    setEditingId(page.id);
    setForm({
      route: page.route,
      title: page.title || '',
      meta_description: page.meta_description || '',
      meta_keywords: page.meta_keywords || '',
      og_title: page.og_title || '',
      og_description: page.og_description || '',
      canonical_url: page.canonical_url || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.route.trim()) {
      toast({ title: 'Route is required', variant: 'destructive' });
      return;
    }
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...form });
        toast({ title: 'Metadata updated' });
      } else {
        await createMutation.mutateAsync(form);
        toast({ title: 'Metadata created' });
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: 'Metadata deleted' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const setField = (field: keyof PageMetadataInsert, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-muted-foreground">Loading SEO settings...</div>
      </div>
    );
  }

  return (
    <RequireAdmin>
      <div className="container mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">SEO Settings</h1>
          </div>
          <p className="text-muted-foreground">
            Manage page titles, meta descriptions, and Open Graph tags for every route.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by route or title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> Add Page Metadata
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No metadata entries found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((page, idx) => (
                    <TableRow key={page.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="font-mono text-xs">{page.route}</TableCell>
                      <TableCell>{page.title || <span className="text-muted-foreground italic">—</span>}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-[300px] truncate">
                        {page.meta_description || <span className="text-muted-foreground italic">—</span>}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => { setForm({ route: page.route, title: page.title || '', meta_description: page.meta_description || '', meta_keywords: page.meta_keywords || '', og_title: page.og_title || '', og_description: page.og_description || '', canonical_url: page.canonical_url || '' }); setPreviewOpen(true); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(page)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete metadata for {page.route}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This page will fall back to the default title.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(page.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Suggested routes */}
        {suggestedRoutes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Unconfigured Routes</CardTitle>
              <CardDescription>These known routes have no metadata yet. Click to add.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {suggestedRoutes.map((route) => (
                  <Button
                    key={route}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingId(null);
                      setForm({ ...EMPTY_FORM, route });
                      setDialogOpen(true);
                    }}
                  >
                    {route}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit' : 'Add'} Page Metadata</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Route *</Label>
                <Input
                  value={form.route}
                  onChange={(e) => setField('route', e.target.value)}
                  placeholder="/about"
                  disabled={!!editingId}
                />
              </div>
              <div>
                <div className="flex justify-between">
                  <Label>Page Title</Label>
                  <span className={`text-xs ${titleLen >= 50 && titleLen <= 60 ? 'text-green-600' : titleLen > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {titleLen}/60
                  </span>
                </div>
                <Input
                  value={form.title || ''}
                  onChange={(e) => setField('title', e.target.value)}
                  placeholder="My Page Title"
                />
              </div>
              <div>
                <div className="flex justify-between">
                  <Label>Meta Description</Label>
                  <span className={`text-xs ${descLen >= 150 && descLen <= 160 ? 'text-green-600' : descLen > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {descLen}/160
                  </span>
                </div>
                <Textarea
                  value={form.meta_description || ''}
                  onChange={(e) => setField('meta_description', e.target.value)}
                  placeholder="A brief description for search engines"
                  rows={3}
                />
              </div>
              <div>
                <Label>Meta Keywords</Label>
                <Input
                  value={form.meta_keywords || ''}
                  onChange={(e) => setField('meta_keywords', e.target.value)}
                  placeholder="keyword1, keyword2"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>OG Title</Label>
                  <Input
                    value={form.og_title || ''}
                    onChange={(e) => setField('og_title', e.target.value)}
                    placeholder="Open Graph title"
                  />
                </div>
                <div>
                  <Label>Canonical URL</Label>
                  <Input
                    value={form.canonical_url || ''}
                    onChange={(e) => setField('canonical_url', e.target.value)}
                    placeholder="https://example.com/page"
                  />
                </div>
              </div>
              <div>
                <Label>OG Description</Label>
                <Textarea
                  value={form.og_description || ''}
                  onChange={(e) => setField('og_description', e.target.value)}
                  placeholder="Open Graph description"
                  rows={2}
                />
              </div>

              {/* Google Snippet Preview */}
              <Card className="bg-muted/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1">
                    <Eye className="h-4 w-4" /> Google Snippet Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="text-blue-600 text-lg leading-tight truncate">
                    {form.title || 'Page Title'}
                  </p>
                  <p className="text-green-700 text-sm truncate">
                    https://yourdomain.com{form.route || '/'}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {form.meta_description || 'No description provided.'}
                  </p>
                </CardContent>
              </Card>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>SEO Preview: {form.route}</DialogTitle>
            </DialogHeader>
            <Card className="bg-muted/30">
              <CardContent className="pt-4 space-y-1">
                <p className="text-blue-600 text-lg leading-tight truncate">
                  {form.title || 'Page Title'}
                </p>
                <p className="text-green-700 text-sm truncate">
                  https://yourdomain.com{form.route || '/'}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {form.meta_description || 'No description provided.'}
                </p>
              </CardContent>
            </Card>
            <div className="space-y-2 text-sm">
              <p><strong>Keywords:</strong> {form.meta_keywords || '—'}</p>
              <p><strong>OG Title:</strong> {form.og_title || '—'}</p>
              <p><strong>OG Description:</strong> {form.og_description || '—'}</p>
              <p><strong>Canonical:</strong> {form.canonical_url || '—'}</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </RequireAdmin>
  );
};

export default AdminSEO;
