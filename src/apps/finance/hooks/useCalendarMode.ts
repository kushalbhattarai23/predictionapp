import { useEffect, useState, useCallback } from 'react';
import { convertEnglishToNepali, formatNepaliDate } from '@/utils/dateConverter';

export type CalendarMode = 'english' | 'nepali';

const STORAGE_KEY = 'finance.calendarMode';
const EVENT_NAME = 'finance:calendar-mode-change';

const readMode = (): CalendarMode => {
  if (typeof window === 'undefined') return 'english';
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === 'nepali' ? 'nepali' : 'english';
};

export const useCalendarMode = () => {
  const [mode, setModeState] = useState<CalendarMode>(readMode);

  useEffect(() => {
    const handler = () => setModeState(readMode());
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const setMode = useCallback((next: CalendarMode) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(EVENT_NAME));
    setModeState(next);
  }, []);

  return { mode, setMode };
};

export const formatDateByMode = (
  englishDate?: string | null,
  nepaliDate?: string | null,
  mode: CalendarMode = 'english'
): string => {
  if (!englishDate && !nepaliDate) return '';
  if (mode === 'nepali') {
    if (nepaliDate) return `${nepaliDate} BS`;
    if (englishDate) {
      try {
        const n = convertEnglishToNepali(new Date(englishDate));
        return `${formatNepaliDate(n.year, n.month, n.day)} BS`;
      } catch {
        return new Date(englishDate).toLocaleDateString();
      }
    }
  }
  return englishDate ? new Date(englishDate).toLocaleDateString() : '';
};
