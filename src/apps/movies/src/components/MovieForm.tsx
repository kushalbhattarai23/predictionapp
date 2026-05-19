
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const movieSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  overview: z.string().optional(),
  genre: z.string().optional(),
  release_year: z.coerce.number().optional(),
  director: z.string().optional(),
  duration_minutes: z.coerce.number().optional(),
  runtime_minutes: z.coerce.number().optional(),
  poster_url: z.string().url().optional().or(z.literal('')),
  status: z.string().default('want_to_watch'),
  user_rating: z.coerce.number().min(1).max(10).optional(),
  user_notes: z.string().optional(),
  is_favorite: z.boolean().default(false),
});

type MovieFormValues = z.infer<typeof movieSchema>;

interface MovieFormProps {
  defaultValues?: Partial<MovieFormValues>;
  onSubmit: (values: MovieFormValues) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

const genres = ['Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Fantasy', 'Horror', 'Musical', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western'];

export const MovieForm: React.FC<MovieFormProps> = ({ defaultValues, onSubmit, isSubmitting, submitLabel = 'Save Movie' }) => {
  const form = useForm<MovieFormValues>({
    resolver: zodResolver(movieSchema),
    defaultValues: {
      title: '',
      status: 'want_to_watch',
      is_favorite: false,
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem>
            <FormLabel>Title *</FormLabel>
            <FormControl><Input placeholder="Movie title" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="release_year" render={({ field }) => (
            <FormItem>
              <FormLabel>Release Year</FormLabel>
              <FormControl><Input type="number" placeholder="2024" {...field} /></FormControl>
            </FormItem>
          )} />

          <FormField control={form.control} name="genre" render={({ field }) => (
            <FormItem>
              <FormLabel>Genre</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select genre" /></SelectTrigger></FormControl>
                <SelectContent>
                  {genres.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="director" render={({ field }) => (
            <FormItem>
              <FormLabel>Director</FormLabel>
              <FormControl><Input placeholder="Director name" {...field} /></FormControl>
            </FormItem>
          )} />

          <FormField control={form.control} name="duration_minutes" render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (minutes)</FormLabel>
              <FormControl><Input type="number" placeholder="120" {...field} /></FormControl>
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="poster_url" render={({ field }) => (
          <FormItem>
            <FormLabel>Poster URL</FormLabel>
            <FormControl><Input placeholder="https://..." {...field} /></FormControl>
          </FormItem>
        )} />

        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl><Textarea placeholder="Movie description..." rows={3} {...field} /></FormControl>
          </FormItem>
        )} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="want_to_watch">Watchlist</SelectItem>
                  <SelectItem value="watching">Watching</SelectItem>
                  <SelectItem value="watched">Watched</SelectItem>
                  <SelectItem value="dropped">Dropped</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )} />

          <FormField control={form.control} name="user_rating" render={({ field }) => (
            <FormItem>
              <FormLabel>Your Rating (1-10)</FormLabel>
              <FormControl><Input type="number" min={1} max={10} placeholder="8" {...field} /></FormControl>
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="user_notes" render={({ field }) => (
          <FormItem>
            <FormLabel>Personal Notes</FormLabel>
            <FormControl><Textarea placeholder="Your thoughts..." rows={2} {...field} /></FormControl>
          </FormItem>
        )} />

        <FormField control={form.control} name="is_favorite" render={({ field }) => (
          <FormItem className="flex items-center gap-3">
            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            <Label>Mark as Favorite</Label>
          </FormItem>
        )} />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </form>
    </Form>
  );
};

export default MovieForm;
