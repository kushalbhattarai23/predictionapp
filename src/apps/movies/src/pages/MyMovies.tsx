
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, Film, Loader2 } from 'lucide-react';
import { useMovies, useCreateMovie, useUpdateMovie, useDeleteMovie } from '@/hooks/useMovies';
import { MovieCard } from '../components/MovieCard';
import { MovieForm } from '../components/MovieForm';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

export const MyMovies: React.FC = () => {
  const { data: movies = [], isLoading } = useMovies();
  const createMovie = useCreateMovie();
  const updateMovie = useUpdateMovie();
  const deleteMovie = useDeleteMovie();
  const [filter, setFilter] = useState('all');
  const [genreFilter, setGenreFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const filteredMovies = movies.filter(m => {
    const matchesStatus = filter === 'all' || m.status === filter;
    const matchesGenre = genreFilter === 'all' || m.genre === genreFilter;
    const matchesSearch = !searchTerm || m.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesGenre && matchesSearch;
  });

  const totalPages = Math.ceil(filteredMovies.length / itemsPerPage);
  const currentMovies = filteredMovies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const genres = [...new Set(movies.map(m => m.genre).filter(Boolean))];

  const handleAddMovie = (values: any) => {
    createMovie.mutate(values, {
      onSuccess: () => setIsAddOpen(false),
    });
  };

  const handleMarkWatched = (id: string) => {
    updateMovie.mutate({ id, status: 'watched', watched_at: new Date().toISOString() });
  };

  const statusCounts = {
    all: movies.length,
    want_to_watch: movies.filter(m => m.status === 'want_to_watch').length,
    watching: movies.filter(m => m.status === 'watching').length,
    watched: movies.filter(m => m.status === 'watched').length,
    dropped: movies.filter(m => m.status === 'dropped').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-700 dark:text-blue-300">My Movies</h1>
          <p className="text-muted-foreground">Manage your personal movie library</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />Add Movie</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Add New Movie</DialogTitle></DialogHeader>
              <MovieForm onSubmit={handleAddMovie} isSubmitting={createMovie.isPending} submitLabel="Add Movie" />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search movies..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="flex-1" />
        </div>
        <Select value={filter} onValueChange={(v) => { setFilter(v); setCurrentPage(1); }}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ({statusCounts.all})</SelectItem>
            <SelectItem value="want_to_watch">Watchlist ({statusCounts.want_to_watch})</SelectItem>
            <SelectItem value="watching">Watching ({statusCounts.watching})</SelectItem>
            <SelectItem value="watched">Watched ({statusCounts.watched})</SelectItem>
            <SelectItem value="dropped">Dropped ({statusCounts.dropped})</SelectItem>
          </SelectContent>
        </Select>
        {genres.length > 0 && (
          <Select value={genreFilter} onValueChange={(v) => { setGenreFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genres</SelectItem>
              {genres.map(g => <SelectItem key={g!} value={g!}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : filteredMovies.length === 0 ? (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Film className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No movies found</p>
            <p className="text-muted-foreground mb-4">
              {movies.length === 0 ? 'Start building your collection' : 'Try adjusting your filters'}
            </p>
            <Button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />Add Movie
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {currentMovies.map(movie => (
              <MovieCard key={movie.id} movie={movie} onMarkWatched={handleMarkWatched} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <PaginationItem key={page}>
                      <PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page} className="cursor-pointer">{page}</PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyMovies;
