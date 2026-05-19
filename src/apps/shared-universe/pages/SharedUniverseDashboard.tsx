import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Globe, Film, Tv, BarChart3, Eye } from 'lucide-react';
import { useSharedUniverses, useSharedUniverseMedia } from '@/hooks/useSharedUniverses';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

const COLORS = ['hsl(217, 91%, 60%)', 'hsl(142, 71%, 45%)', 'hsl(45, 93%, 47%)', 'hsl(0, 84%, 60%)'];

export const SharedUniverseDashboard: React.FC = () => {
  const { universes, isLoading } = useSharedUniverses();

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  const totalUniverses = universes.length;
  const publicCount = universes.filter(u => u.visibility === 'public').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">🌌 Shared Universes</h1>
          <p className="text-muted-foreground">Combine Movies & TV Shows into unified timelines</p>
        </div>
        <Link to="/shared-universe/create">
          <Button><Plus className="w-4 h-4 mr-2" />Create Universe</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <Globe className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{totalUniverses}</p>
            <p className="text-xs text-muted-foreground">Total Universes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Eye className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{publicCount}</p>
            <p className="text-xs text-muted-foreground">Public</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Film className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{totalUniverses - publicCount}</p>
            <p className="text-xs text-muted-foreground">Private</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <BarChart3 className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">—</p>
            <p className="text-xs text-muted-foreground">Media Items</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Universes */}
      {universes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No shared universes yet</h3>
            <p className="text-muted-foreground mb-4">Create your first shared universe to combine movies and TV shows into one timeline.</p>
            <Link to="/shared-universe/create"><Button><Plus className="w-4 h-4 mr-2" />Create Universe</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Your Universes</h2>
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
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {u.visibility === 'public' ? <><Globe className="w-3 h-3 mr-1" />Public</> : 'Private'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedUniverseDashboard;
