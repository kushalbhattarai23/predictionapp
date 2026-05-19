
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, AlertCircle, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { MovieForm } from '../components/MovieForm';
import { useCreateMovie } from '@/hooks/useMovies';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const ImportMovies: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMovie = useCreateMovie();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
    } else {
      toast({ title: 'Invalid file type', description: 'Please select a CSV file.', variant: 'destructive' });
    }
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const parseLine = (line: string) => {
      const regex = /"([^"]*)"|([^,]+)/g;
      const result: string[] = [];
      let match;
      while ((match = regex.exec(line)) !== null) {
        result.push(match[1] !== undefined ? match[1] : match[2].trim());
      }
      return result;
    };

    const headers = parseLine(lines[0]).map(h => h.trim().toLowerCase());
    const movies: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      if (!values.length) continue;
      const movie: any = {};
      headers.forEach((header, index) => { movie[header] = values[index] || null; });
      if (movie.title) {
        movies.push({
          title: movie.title,
          description: movie.description || movie.overview || null,
          overview: movie.overview || null,
          genre: movie.genre || null,
          release_year: movie.release_year ? parseInt(movie.release_year) : null,
          director: movie.director || null,
          duration_minutes: movie.duration_minutes || movie.runtime ? parseInt(movie.duration_minutes || movie.runtime) : null,
          poster_url: movie.poster_url || null,
          rating: movie.rating ? parseFloat(movie.rating) : null,
          status: movie.status || 'want_to_watch',
          user_id: user?.id,
        });
      }
    }
    return movies;
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    setIsUploading(true);
    try {
      const csvText = await file.text();
      const movies = parseCSV(csvText);
      if (movies.length === 0) {
        toast({ title: 'No valid movies found', variant: 'destructive' });
        return;
      }
      const { error } = await supabase.from('movies').insert(movies);
      if (error) throw error;
      toast({ title: 'Movies imported', description: `${movies.length} movies imported.` });
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      setFile(null);
    } catch (error: any) {
      toast({ title: 'Import failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualAdd = (values: any) => {
    createMovie.mutate(values, { onSuccess: () => setIsManualOpen(false) });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-700 dark:text-blue-300">Import Movies</h1>
        <p className="text-muted-foreground">Add movies via CSV import or manual entry</p>
      </div>

      <Tabs defaultValue="csv">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="csv">CSV Import</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="csv" className="mt-4">
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" />CSV Import</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div><Label htmlFor="csv-file">CSV File</Label><Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} className="cursor-pointer" /></div>
              {file && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <FileText className="h-4 w-4 text-blue-600" /><span className="text-sm">{file.name}</span>
                </div>
              )}
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div className="text-sm w-full">
                    <p className="font-medium mb-1">CSV Format:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Headers: title, description, genre, release_year, director, duration_minutes, poster_url, rating, status</li>
                      <li>Title is required, other fields optional</li>
                      <li>Status options: want_to_watch, watching, watched, dropped</li>
                    </ul>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => {
                      const sample = `title,description,genre,release_year,director,duration_minutes,poster_url,rating,status
Inception,"A thief who steals corporate secrets through dream-sharing technology",Sci-Fi,2010,Christopher Nolan,148,,8.8,watched
The Dark Knight,"Batman faces the Joker in Gotham City",Action,2008,Christopher Nolan,152,,9.0,watched
Interstellar,"A team of explorers travel through a wormhole in space",Sci-Fi,2014,Christopher Nolan,169,,8.7,want_to_watch
Parasite,"Greed and class discrimination threaten a symbiotic relationship",Thriller,2019,Bong Joon-ho,132,,8.5,want_to_watch
Dune,"Paul Atreides must travel to the most dangerous planet in the universe",Sci-Fi,2021,Denis Villeneuve,155,,8.0,watching`;
                      const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = 'movies_sample.csv';
                      link.click();
                      URL.revokeObjectURL(url);
                    }}>
                      <FileText className="h-3 w-3 mr-1" /> Download Sample CSV
                    </Button>
                  </div>
                </div>
              </div>
              <Button onClick={handleUpload} disabled={!file || isUploading} className="w-full">
                {isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importing...</> : 'Import Movies'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="mt-4">
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader><CardTitle>Add Movie Manually</CardTitle></CardHeader>
            <CardContent>
              <MovieForm onSubmit={handleManualAdd} isSubmitting={createMovie.isPending} submitLabel="Add Movie" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImportMovies;
