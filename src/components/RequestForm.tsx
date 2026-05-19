
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useRequests, NewRequest } from '@/hooks/useRequests';
import { toast } from 'sonner';
import { useState } from 'react';

const requestSchema = z.object({
  type: z.enum(['tv_show_request', 'other_feedback']),
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  message: z.string().optional(),
});

export const RequestForm = () => {
  const { user } = useAuth();
  const { createRequest } = useRequests();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      type: 'tv_show_request',
      title: '',
      message: '',
    },
  });

  async function onSubmit(values: z.infer<typeof requestSchema>) {
    if (!user) {
        toast.error('You must be logged in to submit a request.');
        return;
    }

    setIsSubmitting(true);
    try {
      const newRequest: NewRequest = {
        title: values.title,
        type: values.type,
        message: values.message || null,
        user_id: user.id,
      };

      await createRequest(newRequest);
      toast.success('Request Submitted', {
        description: 'Thank you! We have received your request.',
      });
      form.reset();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast.error('Submission Failed', {
            description: errorMessage,
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Request Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a request type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="tv_show_request">TV Show Request</SelectItem>
                  <SelectItem value="other_feedback">Other Feedback</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Request for 'The Office'" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Provide more details here..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </Button>
      </form>
    </Form>
  );
};
