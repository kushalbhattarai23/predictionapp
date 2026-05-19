
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Tv, Calendar, ArrowUpDown, Search, ArrowUp } from 'lucide-react';
import { useShowUniverseData } from '@/hooks/useShowUniverseData';

type SortField = 'air_date' | 'show_title' | 'season_number' | 'episode_number';
type SortDirection = 'asc' | 'desc';

export const PublicUniverseDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading } = useShowUniverseData();
  const [sortField, setSortField] = useState<SortField>('air_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showFilter, setShowFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  const universeData = data.find(item => 
    item.universe_name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-') === slug
  );

  if (!universeData) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Universe Not Found</h1>
          <Link to="/public/universes" className="text-primary hover:underline">
            Back to Universes
          </Link>
        </div>
      </div>
    );
  }

  const universeEpisodes = data.filter(item => item.universe_id === universeData.universe_id);
  
  const uniqueShows = [...new Set(universeEpisodes.map(item => item.show_id))].map(showId => {
    const showItem = universeEpisodes.find(item => item.show_id === showId);
    const showEpisodes = universeEpisodes.filter(item => item.show_id === showId);
    const seasons = [...new Set(showEpisodes.map(item => item.season_number))];
    return {
      ...showItem,
      episodeCount: showEpisodes.length,
      seasonCount: seasons.length
    };
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedEpisodes = universeEpisodes
    .filter(ep => {
      const matchesShow = showFilter === 'all' || ep.show_id === showFilter;
      const matchesSearch = !searchTerm || 
        ep.episode_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ep.show_title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesShow && matchesSearch;
    })
    .sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      switch (sortField) {
        case 'air_date':
          return dir * ((a.air_date || '').localeCompare(b.air_date || ''));
        case 'show_title':
          return dir * a.show_title.localeCompare(b.show_title);
        case 'season_number':
          return dir * (a.season_number - b.season_number || a.episode_number - b.episode_number);
        case 'episode_number':
          return dir * (a.episode_number - b.episode_number);
        default:
          return 0;
      }
    });

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-medium hover:bg-transparent"
      onClick={() => toggleSort(field)}
    >
      {label}
      <ArrowUpDown className={`ml-1 h-3 w-3 ${sortField === field ? 'text-primary' : 'text-muted-foreground'}`} />
    </Button>
  );

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/public/universes" className="flex items-center text-primary hover:underline">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Universes
        </Link>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">{universeData.universe_name}</h1>
        {universeData.universe_description && (
          <p className="text-muted-foreground">{universeData.universe_description}</p>
        )}
        <div className="mt-4">
          <Badge variant="outline" className="text-sm">
            {uniqueShows.length} shows • {universeEpisodes.length} episodes
          </Badge>
        </div>
      </div>

      {/* Shows Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Shows in this Universe</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {uniqueShows.map((show) => (
            <Card key={show?.show_id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tv className="h-5 w-5" />
                  <Link 
                    to={`/public/show/${show?.slug || show?.show_title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')}`}
                    className="text-primary hover:underline"
                  >
                    {show?.show_title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {show?.show_description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {show.show_description}
                  </p>
                )}
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{show?.seasonCount} seasons</span>
                  <span>{show?.episodeCount} episodes</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Episodes Table Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">All Episodes</h2>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search episodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={showFilter} onValueChange={setShowFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by show" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Shows</SelectItem>
              {uniqueShows.map((show) => (
                <SelectItem key={show?.show_id} value={show?.show_id || ''}>
                  {show?.show_title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><SortButton field="show_title" label="Show" /></TableHead>
                <TableHead><SortButton field="season_number" label="Season" /></TableHead>
                <TableHead><SortButton field="episode_number" label="Episode" /></TableHead>
                <TableHead>Title</TableHead>
                <TableHead><SortButton field="air_date" label="Air Date" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedEpisodes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No episodes found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedEpisodes.map((ep, index) => (
                  <TableRow key={`${ep.show_id}-${ep.season_number}-${ep.episode_number}-${index}`}>
                    <TableCell className="font-medium">{ep.show_title}</TableCell>
                    <TableCell>S{String(ep.season_number).padStart(2, '0')}</TableCell>
                    <TableCell>E{String(ep.episode_number).padStart(2, '0')}</TableCell>
                    <TableCell>{ep.episode_title}</TableCell>
                    <TableCell>
                      {ep.air_date ? (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(ep.air_date).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Showing {filteredAndSortedEpisodes.length} of {universeEpisodes.length} episodes
        </p>
      </div>

      {/* Back to Top */}
      {showBackToTop && (
        <Button
          size="icon"
          className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};

export default PublicUniverseDetail;
