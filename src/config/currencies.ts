
import { Currency } from '@/types';

export const currencies: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'NPR', symbol: 'रु', name: 'Nepalese Rupees' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupees' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
];

export const defaultCurrency = currencies[0]; // USD

export const getCurrencySymbol = (currencyCode: string): string => {
  const currency = currencies.find(c => c.code === currencyCode);
  return currency?.symbol || currencyCode;
};

export const formatCurrency = (amount: number, currencyCode: string): string => {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${amount.toFixed(2)}`;
};
