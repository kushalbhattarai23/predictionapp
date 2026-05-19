
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { convertNepaliToEnglish, convertEnglishToNepali, getCurrentNepaliDate, formatNepaliDate } from '@/utils/dateConverter';

// Nepali date interface
interface NepaliDate {
  year: number;
  month: number;
  day: number;
}

interface NepaliDatePickerProps {
  label?: string;
  value?: string;
  onChange: (englishDate: string, nepaliDate: string) => void;
  required?: boolean;
  id?: string;
}

export const NepaliDatePicker: React.FC<NepaliDatePickerProps> = ({
  label,
  value,
  onChange,
  required = false,
  id
}) => {
  const [englishDate, setEnglishDate] = useState<Date>(new Date());
  const [nepaliDate, setNepaliDate] = useState<NepaliDate>({ year: 2081, month: 1, day: 1 });

  const nepaliMonths = [
    'बैशाख', 'जेठ', 'असार', 'श्रावण', 'भाद्र', 'असोज',
    'कार्तिक', 'मंसिर', 'पुष', 'माघ', 'फाल्गुन', 'चैत्र'
  ];

  // Initialize with current dates
  useEffect(() => {
    if (value && value !== '') {
      try {
        const date = new Date(value);
        setEnglishDate(date);
        const convertedNepali = convertEnglishToNepali(date);
        setNepaliDate(convertedNepali);
      } catch (error) {
        console.error('Error converting initial date:', error);
      }
    } else {
      try {
        const currentNepali = getCurrentNepaliDate();
        setNepaliDate(currentNepali);
        const today = new Date();
        setEnglishDate(today);
      } catch (error) {
        console.error('Error setting current date:', error);
      }
    }
  }, [value]);

  // Handle English date change
  const handleEnglishDateChange = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setEnglishDate(selectedDate);
      const englishDateString = selectedDate.toISOString().split('T')[0];
      const convertedNepali = convertEnglishToNepali(selectedDate);
      setNepaliDate(convertedNepali);
      
      const nepaliDateString = formatNepaliDate(convertedNepali.year, convertedNepali.month, convertedNepali.day);
      onChange(englishDateString, nepaliDateString);
    }
  };

  // Handle Nepali date change
  const handleNepaliDateChange = (field: keyof NepaliDate, value: string) => {
    const numValue = parseInt(value) || 0;
    const newNepaliDate = {
      ...nepaliDate,
      [field]: numValue
    };
    setNepaliDate(newNepaliDate);
  };

  // Convert Nepali to English
  const convertToEnglish = () => {
    if (nepaliDate.year && nepaliDate.month && nepaliDate.day) {
      try {
        const convertedEnglish = convertNepaliToEnglish(nepaliDate.year, nepaliDate.month, nepaliDate.day);
        setEnglishDate(convertedEnglish);
        
        const englishDateString = convertedEnglish.toISOString().split('T')[0];
        const nepaliDateString = formatNepaliDate(nepaliDate.year, nepaliDate.month, nepaliDate.day);
        onChange(englishDateString, nepaliDateString);
      } catch (error) {
        console.error('Error converting Nepali to English date:', error);
      }
    }
  };

  return (
    <div className="space-y-4">
      {label && <Label htmlFor={id} className="text-sm font-medium">{label}</Label>}
      
      {/* English Date Input */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-600">English Date (AD)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal h-12 border-2 hover:border-blue-300 focus:border-blue-400 transition-colors",
                !englishDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {englishDate ? format(englishDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={englishDate}
              onSelect={handleEnglishDateChange}
              initialFocus
              className="p-3"
            />
          </PopoverContent>
        </Popover>
        {englishDate && (
          <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
            <strong>Current:</strong> {format(englishDate, "yyyy-MM-dd")} AD
          </div>
        )}
      </div>

      {/* Nepali Date Input */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-600">Nepali Date (BS)</Label>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor={`${id}-nepali-year`} className="text-xs text-gray-500">Year (वर्ष)</Label>
            <Input
              id={`${id}-nepali-year`}
              type="number"
              value={nepaliDate.year}
              onChange={(e) => handleNepaliDateChange('year', e.target.value)}
              placeholder="2081"
              min="1970"
              max="2100"
              className="h-12 border-2 hover:border-orange-300 focus:border-orange-400 transition-colors"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`${id}-nepali-month`} className="text-xs text-gray-500">Month (महिना)</Label>
            <div className="relative">
              <Input
                id={`${id}-nepali-month`}
                type="number"
                value={nepaliDate.month}
                onChange={(e) => handleNepaliDateChange('month', e.target.value)}
                placeholder="1"
                min="1"
                max="12"
                className="h-12 border-2 hover:border-orange-300 focus:border-orange-400 transition-colors"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                {nepaliMonths[nepaliDate.month - 1] || ''}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`${id}-nepali-day`} className="text-xs text-gray-500">Day (दिन)</Label>
            <Input
              id={`${id}-nepali-day`}
              type="number"
              value={nepaliDate.day}
              onChange={(e) => handleNepaliDateChange('day', e.target.value)}
              placeholder="1"
              min="1"
              max="32"
              className="h-12 border-2 hover:border-orange-300 focus:border-orange-400 transition-colors"
            />
          </div>
        </div>
        
        <div className="text-xs text-gray-500 bg-orange-50 p-3 rounded-lg">
          <strong>Format:</strong> YYYY/MM/DD (e.g., 2081/01/15)
          <br />
          <strong>Current:</strong> {formatNepaliDate(nepaliDate.year, nepaliDate.month, nepaliDate.day)} BS
        </div>

        <Button 
          type="button"
          onClick={convertToEnglish}
          variant="outline"
          size="sm"
          className="w-full"
        >
          Convert Nepali Date to English
        </Button>
      </div>
    </div>
  );
};
