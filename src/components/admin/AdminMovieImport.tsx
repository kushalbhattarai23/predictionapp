import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const AdminMovieImport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
    } else {
      toast({
        title: 'Invalid file type',
        description: 'Please select a CSV file.',
        variant: 'destructive'
      });
    }
  };

  // ✅ Improved CSV parser (no external libs)
  const parseCSV = (csvText: string) => {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    // Parse one line, respecting quotes
    const parseLine = (line: string) => {
      const regex = /"([^"]*)"|([^,]+)/g;
      const result: string[] = [];
      let match;
      while ((match = regex.exec(line)) !== null) {
        if (match[1] !== undefined) {
          result.push(match[1]); // inside quotes
        } else {
          result.push(match[2].trim()); // unquoted
        }
      }
      return result;
    };

    const headers = parseLine(lines[0]).map(h => h.trim());
    const movies: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      if (!values.length) continue;

      const movie: any = {};
      headers.forEach((header, index) => {
        movie[header] = values[index] || null;
      });

      if (movie.title) {
        movies.push({
          title: movie.title,
          description: movie.description || null,
          release_date: movie.release_date || null,
          poster_url: movie.poster_url || null,
          creator_id: user?.id
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
        toast({
          title: 'No valid movies found',
          description: 'Please check your CSV format.',
          variant: 'destructive'
        });
        return;
      }

      const { error } = await supabase.from('movies').insert(movies);

      if (error) throw error;

      toast({
        title: 'Movies imported successfully',
        description: `${movies.length} movies have been imported.`
      });

      setFile(null);
      const fileInput = document.getElementById('csv-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      console.error('Error importing movies:', error);
      toast({
        title: 'Import failed',
        description: error.message || 'Failed to import movies.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import Movies from CSV
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="csv-file">CSV File</Label>
          <Input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="cursor-pointer"
          />
        </div>

        {file && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <FileText className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800">{file.name}</span>
          </div>
        )}

        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">CSV Format Requirements:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Headers: title, description, release_date, poster_url</li>
                <li>Title is required, other fields are optional</li>
                <li>Date format: YYYY-MM-DD</li>
                <li>First row should contain column headers</li>
                <li>Supports values like <code>S02E200</code> and quoted dates</li>
              </ul>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleUpload} 
          disabled={!file || isUploading}
          className="w-full"
        >
          {isUploading ? 'Importing...' : 'Import Movies'}
        </Button>
      </CardContent>
    </Card>
  );
};
