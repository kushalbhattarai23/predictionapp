import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { NepaliDatePicker } from '@/components/ui/nepali-date-picker';
import { format } from 'date-fns';

interface CompactDateRangeFilterProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (start: Date | null, end: Date | null) => void;
}

export const CompactDateRangeFilter: React.FC<CompactDateRangeFilterProps> = ({
  startDate,
  endDate,
  onChange,
}) => {
  const [open, setOpen] = useState(false);

  const label =
    startDate || endDate
      ? `${startDate ? format(startDate, 'MMM d, yyyy') : '…'} → ${endDate ? format(endDate, 'MMM d, yyyy') : '…'}`
      : 'Filter by date';

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9">
            <CalendarIcon className="h-4 w-4 mr-2" />
            <span className="truncate max-w-[220px]">{label}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-3 space-y-3 bg-background z-50" align="end">
          <NepaliDatePicker
            id="filter-start"
            label="Start Date (English / Nepali)"
            value={startDate ? startDate.toISOString().split('T')[0] : ''}
            onChange={(eng) => onChange(eng ? new Date(eng) : null, endDate)}
          />
          <NepaliDatePicker
            id="filter-end"
            label="End Date (English / Nepali)"
            value={endDate ? endDate.toISOString().split('T')[0] : ''}
            onChange={(eng) => onChange(startDate, eng ? new Date(eng) : null)}
          />
          <div className="flex justify-between pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange(null, null)}
            >
              Clear
            </Button>
            <Button size="sm" onClick={() => setOpen(false)} className="bg-green-600 hover:bg-green-700">
              Done
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {(startDate || endDate) && (
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => onChange(null, null)}
          title="Clear filter"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default CompactDateRangeFilter;
