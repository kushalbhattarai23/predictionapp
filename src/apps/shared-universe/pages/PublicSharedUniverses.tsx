import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Globe } from 'lucide-react';
import { usePublicSharedUniverses } from '@/hooks/useSharedUniverses';

export const PublicSharedUniverses: React.FC = () => {
  const { data: universes = [], isLoading } = usePublicSharedUniverses();

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">🌌 Public Shared Universes</h1>
        <p className="text-muted-foreground">Browse community-created mixed media timelines</p>
      </div>

      {universes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No public universes yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {universes.map(u => (
            <Link key={u.id} to={`/shared-universe/${u.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                {u.cover_image && (
                  <div className="h-32 overflow-hidden rounded-t-lg">
                    <img src={u.cover_image} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <CardContent className={u.cover_image ? 'pt-3' : 'pt-4'}>
                  <h3 className="font-semibold truncate">{u.title}</h3>
                  {u.description && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{u.description}</p>}
                  <Badge variant="outline" className="mt-2 text-xs"><Globe className="w-3 h-3 mr-1" />Public</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicSharedUniverses;
