
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tv, Globe, Search, Plus, Eye, EyeOff } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const AdminContent: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: shows, isLoading: showsLoading } = useQuery({
    queryKey: ['admin-shows', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('shows')
        .select(`
          id,
          title,
          description,
          is_public,
          created_at,
          user_show_tracking (count)
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const { data: universes, isLoading: universesLoading } = useQuery({
    queryKey: ['admin-universes', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('universes')
        .select(`
          id,
          name,
          description,
          is_public,
          created_at,
          creator_id,
          show_universes (count)
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
          <p className="text-gray-600">Manage shows, universes, and content visibility</p>
        </div>

        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Search content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Button variant="outline">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
      </div>

      <Tabs defaultValue="shows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="shows">TV Shows</TabsTrigger>
          <TabsTrigger value="universes">Universes</TabsTrigger>
        </TabsList>

        <TabsContent value="shows">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tv className="h-5 w-5" />
                TV Shows Management ({shows?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showsLoading ? (
                <div className="text-center py-12">Loading shows...</div>
              ) : (
                <div className="space-y-4">
                  {shows?.map((show) => (
                    <div key={show.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{show.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {show.description || 'No description available'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">
                            {show.user_show_tracking?.length || 0} users tracking
                          </Badge>
                          <Badge variant={show.is_public ? 'default' : 'secondary'}>
                            {show.is_public ? 'Public' : 'Private'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          {show.is_public ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="universes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Universes Management ({universes?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {universesLoading ? (
                <div className="text-center py-12">Loading universes...</div>
              ) : (
                <div className="space-y-4">
                  {universes?.map((universe) => (
                    <div key={universe.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{universe.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {universe.description || 'No description available'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">
                            {universe.show_universes?.length || 0} shows
                          </Badge>
                          <Badge variant={universe.is_public ? 'default' : 'secondary'}>
                            {universe.is_public ? 'Public' : 'Private'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          {universe.is_public ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminContent;
