
import NepaliDate from 'nepali-date-converter';

// Nepali date interface
interface NepaliDateInterface {
  year: number;
  month: number;
  day: number;
}

export const convertNepaliToEnglish = (year: number, month: number, day: number): Date => {
  try {
    // Create a NepaliDate instance with the provided BS date
    const nepaliDate = new NepaliDate(year, month - 1, day); // month is 0-indexed in the library
    
    // Convert to English date
    const englishDate = nepaliDate.toJsDate();
    
    return englishDate;
  } catch (error) {
    console.error('Error converting Nepali to English date:', error);
    // Fallback to current date if conversion fails
    return new Date();
  }
};

export const convertEnglishToNepali = (date: Date): NepaliDateInterface => {
  try {
    // Create NepaliDate from JS Date
    const nepaliDate = new NepaliDate(date);
    
    return {
      year: nepaliDate.getYear(),
      month: nepaliDate.getMonth() + 1, // month is 0-indexed in the library, so add 1
      day: nepaliDate.getDate()
    };
  } catch (error) {
    console.error('Error converting English to Nepali date:', error);
    // Fallback to a default Nepali date
    return {
      year: 2081,
      month: 1,
      day: 1
    };
  }
};

export const getCurrentNepaliDate = (): NepaliDateInterface => {
  const today = new Date();
  return convertEnglishToNepali(today);
};

export const formatNepaliDate = (year: number, month: number, day: number): string => {
  return `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
};
