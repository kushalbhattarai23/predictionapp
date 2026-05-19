
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Save, Globe, FileText } from 'lucide-react';
import RequireAdmin from '@/components/Auth/RequireAdmin';

interface PageMeta {
  id: string;
  page_name: string;
  title: string;
  description: string;
  meta_title: string;
  meta_description: string;
}

const AdminPublic: React.FC = () => {
  const { toast } = useToast();
  const [pages, setPages] = useState<PageMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    // Mock data - replace with actual database query when page_meta table is created
    const mockPages: PageMeta[] = [
      {
        id: '1',
        page_name: 'Home',
        title: 'Welcome to Our Platform',
        description: 'Discover amazing content and features on our platform.',
        meta_title: 'Home - Our Platform',
        meta_description: 'Welcome to our platform where you can discover amazing content and features.'
      },
      {
        id: '2',
        page_name: 'About',
        title: 'About Us',
        description: 'Learn more about our mission and values.',
        meta_title: 'About Us - Our Platform',
        meta_description: 'Learn more about our mission, values, and the team behind our platform.'
      },
      {
        id: '3',
        page_name: 'Contact',
        title: 'Contact Us',
        description: 'Get in touch with our team.',
        meta_title: 'Contact Us - Our Platform',
        meta_description: 'Get in touch with our team for support, questions, or feedback.'
      }
    ];

    // Simulate API loading delay
    setTimeout(() => {
      setPages(mockPages);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSave = async (pageId: string, updatedPage: Partial<PageMeta>) => {
    setSaving(pageId);
    try {
      // Simulate API save delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setPages(prev => prev.map(page => 
        page.id === pageId ? { ...page, ...updatedPage } : page
      ));

      toast({
        title: 'Page updated successfully',
        description: `Updated ${updatedPage.page_name || 'page'} metadata`
      });
    } catch (error) {
      console.error('Error updating page:', error);
      toast({
        title: 'Error updating page',
        description: 'Failed to save page metadata',
        variant: 'destructive'
      });
    } finally {
      setSaving(null);
    }
  };

  const handleInputChange = (pageId: string, field: keyof PageMeta, value: string) => {
    setPages(prev => prev.map(page => 
      page.id === pageId ? { ...page, [field]: value } : page
    ));
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-muted-foreground">Loading pages...</div>
      </div>
    );
  }

  return (
    <RequireAdmin>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-6 w-6 text-blue-600" />
            <h1 className="text-3xl font-bold">Public Page Editor</h1>
          </div>
          <p className="text-muted-foreground">
            Edit page titles, descriptions, and meta information for public pages
          </p>
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> This is currently using mock data. To enable full functionality, 
              create a 'page_meta' table in your Supabase database with the required fields.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {pages.map((page) => (
            <Card key={page.id} className="border-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {page.page_name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`title-${page.id}`}>Page Title</Label>
                    <Input
                      id={`title-${page.id}`}
                      value={page.title}
                      onChange={(e) => handleInputChange(page.id, 'title', e.target.value)}
                      placeholder="Page title"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`meta-title-${page.id}`}>Meta Title</Label>
                    <Input
                      id={`meta-title-${page.id}`}
                      value={page.meta_title}
                      onChange={(e) => handleInputChange(page.id, 'meta_title', e.target.value)}
                      placeholder="SEO meta title"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor={`description-${page.id}`}>Description</Label>
                  <Textarea
                    id={`description-${page.id}`}
                    value={page.description}
                    onChange={(e) => handleInputChange(page.id, 'description', e.target.value)}
                    placeholder="Page description"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor={`meta-description-${page.id}`}>Meta Description</Label>
                  <Textarea
                    id={`meta-description-${page.id}`}
                    value={page.meta_description}
                    onChange={(e) => handleInputChange(page.id, 'meta_description', e.target.value)}
                    placeholder="SEO meta description"
                    rows={2}
                  />
                </div>

                <Button
                  onClick={() => handleSave(page.id, page)}
                  disabled={saving === page.id}
                  className="w-full md:w-auto"
                >
                  {saving === page.id ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {pages.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No pages found to edit</p>
            </CardContent>
          </Card>
        )}
      </div>
    </RequireAdmin>
  );
};

export default AdminPublic;
