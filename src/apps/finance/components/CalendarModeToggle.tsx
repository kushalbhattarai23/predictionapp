import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';
import { useCalendarMode, CalendarMode } from '@/apps/finance/hooks/useCalendarMode';

export const CalendarModeToggle: React.FC = () => {
  const { mode, setMode } = useCalendarMode();
  return (
    <Select value={mode} onValueChange={(v) => setMode(v as CalendarMode)}>
      <SelectTrigger className="h-9 w-[140px]">
        <Globe className="h-4 w-4 mr-1" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-background z-50">
        <SelectItem value="english">English (AD)</SelectItem>
        <SelectItem value="nepali">Nepali (BS)</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default CalendarModeToggle;
