import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Calendar, Tv, ArrowLeft, Search, Filter, ArrowUpDown } from 'lucide-react';
import { useShowUniverseData } from '@/hooks/useShowUniverseData';

export const PublicUniverseDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading } = useShowUniverseData();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [selectedShow, setSelectedShow] = useState<string>('all'); // ADDED
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Memoize derived data to prevent re-computation and fix hook order
  const universeData = useMemo(() => {
    if (isLoading || !data) return undefined;
    return data.find(item => 
      item.universe_name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-') === slug
    );
  }, [data, isLoading, slug]);

  const universeItems = useMemo(() => {
    if (!universeData) return [];
    return data.filter(item => item.universe_id === universeData.universe_id);
  }, [data, universeData]);

  const shows = useMemo(() => {
    if (!universeItems.length) return [];
    const showsMap = new Map();
    universeItems.forEach(item => {
      if (!showsMap.has(item.show_id) && item) {
        showsMap.set(item.show_id, item);
      }
    });
    return Array.from(showsMap.values());
  }, [universeItems]);

  const allEpisodes = useMemo(() => {
    if (!universeItems.length) return [];
    return [...universeItems].sort((a, b) => {
      // Default sort by air date
      if (a.air_date && b.air_date) {
        return new Date(a.air_date).getTime() - new Date(b.air_date).getTime();
      }
      // Fallback to season/episode if air dates are missing
      if (a.season_number !== b.season_number) {
        return a.season_number - b.season_number;
      }
      return a.episode_number - b.episode_number;
    });
  }, [universeItems]);

  const seasons = useMemo(() => {
    return [...new Set(allEpisodes.map(ep => ep.season_number))].sort((a, b) => a - b);
  }, [allEpisodes]);

  // Update filteredAndSortedEpisodes: add show filter logic
  const filteredAndSortedEpisodes = useMemo(() => {
    const filtered = allEpisodes.filter(episode => {
      const matchesSearch = episode.episode_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           episode.show_title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSeason = selectedSeason === 'all' || episode.season_number.toString() === selectedSeason;
      const matchesShow = selectedShow === 'all' || episode.show_id === selectedShow;
      return matchesSearch && matchesSeason && matchesShow;
    });

    return [...filtered].sort((a, b) => {
      if (a.air_date && b.air_date) {
        const dateA = new Date(a.air_date).getTime();
        const dateB = new Date(b.air_date).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      const seasonA = a.season_number;
      const seasonB = b.season_number;
      const episodeA = a.episode_number;
      const episodeB = b.episode_number;

      if (seasonA !== seasonB) {
        return sortOrder === 'asc' ? seasonA - seasonB : seasonB - seasonA;
      }
      return sortOrder === 'asc' ? episodeA - episodeB : episodeB - episodeA;
    });
  }, [allEpisodes, searchTerm, sortOrder, selectedSeason, selectedShow]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSeason, sortOrder, itemsPerPage, selectedShow]); // added selectedShow

  if (isLoading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  if (!universeData) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Universe Not Found</h1>
        <Link to="/public/universes" className="text-blue-600 hover:underline">
          Back to Universes
        </Link>
      </div>
    );
  }

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedEpisodes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEpisodes = filteredAndSortedEpisodes.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => handlePageChange(i)}
            isActive={currentPage === i}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/public/universes" className="flex items-center text-blue-600 hover:underline">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Universes
        </Link>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">{universeData.universe_name}</h1>
        {universeData.universe_description && (
          <p className="text-muted-foreground">{universeData.universe_description}</p>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="border-blue-200 shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{shows.length}</div>
            <div className="text-sm text-muted-foreground">Shows</div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{allEpisodes.length}</div>
            <div className="text-sm text-muted-foreground">Episodes</div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{filteredAndSortedEpisodes.length}</div>
            <div className="text-sm text-muted-foreground">Filtered</div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Shows in this Universe</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shows.map((show) => (
            <Card key={show?.show_id} className="border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-300">
              <CardHeader>
                <CardTitle className="text-lg">
                  <Link 
                    to={`/public/show/${show?.slug || show?.show_title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')}`}
                    className="text-blue-600 hover:underline"
                  >
                    {show?.show_title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {show?.show_description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {show.show_description}
                  </p>
                )}
                <div className="flex items-center text-sm text-muted-foreground">
                  <Tv className="h-4 w-4 mr-1" />
                  {allEpisodes.filter(ep => ep.show_id === show?.show_id).length} episodes
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Filter & Sort Episodes */}
      <Card className="border-blue-200 shadow-lg mb-6">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            Filter & Sort Episodes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Search Episodes */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 h-4 w-4" />
              <Input
                placeholder="Search episodes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* NEW Show Filter */}
            <Select value={selectedShow} onValueChange={setSelectedShow}>
              <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="All Shows" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shows</SelectItem>
                {shows.map((show) => (
                  <SelectItem key={show.show_id} value={show.show_id}>
                    {show.show_title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Air Date Sort */}
            <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
              <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                <ArrowUpDown className="h-4 w-4 mr-2 text-blue-500" />
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Oldest First</SelectItem>
                <SelectItem value="desc">Newest First</SelectItem>
              </SelectContent>
            </Select>

            {/* Season Filter */}
            <Select value={selectedSeason} onValueChange={setSelectedSeason}>
              <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="All Seasons" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Seasons</SelectItem>
                {seasons.map((season) => (
                  <SelectItem key={season} value={season.toString()}>
                    Season {season}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Items Per Page */}
            <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
              <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Items per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>

            {/* Results Info */}
            <div className="flex items-center text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedEpisodes.length)} of {filteredAndSortedEpisodes.length}
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-semibold mb-4">All Episodes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentEpisodes.map((episode) => (
            <Card key={episode.episode_id} className="border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-300">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg text-blue-600 truncate">
                    {episode.show_title}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 flex-shrink-0">
                    S{episode.season_number}E{episode.episode_number}
                  </Badge>
                </div>
                <h3 className="text-base font-semibold text-gray-900 truncate">{episode.episode_title}</h3>
              </CardHeader>
              <CardContent className="space-y-2">
                {episode.air_date && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(episode.air_date).toLocaleDateString()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>

                {currentPage > 3 && (
                  <>
                    <PaginationItem>
                      <PaginationLink onClick={() => handlePageChange(1)} className="cursor-pointer">
                        1
                      </PaginationLink>
                    </PaginationItem>
                    {currentPage > 4 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                  </>
                )}

                {renderPaginationItems()}

                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink onClick={() => handlePageChange(totalPages)} className="cursor-pointer">
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicUniverseDetail;
