
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { UpdateRequest } from '@/hooks/useRequests';

interface AdminRequestActionsProps {
  requestId: string;
  currentStatus: string;
  updateRequest: (params: { id: string; } & UpdateRequest) => Promise<any>;
}

const STATUS_OPTIONS = [
  'pending',
  'approved',
  'rejected',
  'done',
  'will not be available',
  'will do in future',
];

export const AdminRequestActions = ({ requestId, currentStatus, updateRequest }: AdminRequestActionsProps) => {
  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateRequest({ id: requestId, status: newStatus });
      toast.success('Request status updated');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error('Failed to update status', { description: errorMessage });
    }
  };

  return (
    <Select onValueChange={handleStatusChange} defaultValue={currentStatus}>
      <SelectTrigger className="w-[200px] capitalize">
        <SelectValue placeholder="Change status" />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map(status => (
          <SelectItem key={status} value={status} className="capitalize">
            {status}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
