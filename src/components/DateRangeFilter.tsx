
import React from 'react';
import { Button } from '@/components/ui/button';
import { NepaliDatePicker } from '@/components/ui/nepali-date-picker';
import { Search } from 'lucide-react';

interface DateRangeFilterProps {
  startDate: Date | null;
  endDate: Date | null;
  onDateRangeChange: (start: Date | null, end: Date | null) => void;
  onSearch?: () => void;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  startDate,
  endDate,
  onDateRangeChange,
  onSearch
}) => {
  const handleStartDateChange = (englishDate: string, nepaliDate: string) => {
    onDateRangeChange(englishDate ? new Date(englishDate) : null, endDate);
  };

  const handleEndDateChange = (englishDate: string, nepaliDate: string) => {
    onDateRangeChange(startDate, englishDate ? new Date(englishDate) : null);
  };

  const clearFilters = () => {
    onDateRangeChange(null, null);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NepaliDatePicker
          label="Start Date"
          value={startDate ? startDate.toISOString().split('T')[0] : ''}
          onChange={handleStartDateChange}
          id="start-date"
        />
        <NepaliDatePicker
          label="End Date"
          value={endDate ? endDate.toISOString().split('T')[0] : ''}
          onChange={handleEndDateChange}
          id="end-date"
        />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={clearFilters}>
          Clear Filters
        </Button>
        {onSearch && (
          <Button onClick={onSearch} className="bg-green-600 hover:bg-green-700">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        )}
      </div>
    </div>
  );
};
