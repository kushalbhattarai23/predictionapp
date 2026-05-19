
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { currencies, defaultCurrency } from '@/config/currencies';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency?: string): string {
  // Get preferred currency from localStorage if not provided
  const currencyCode = currency || localStorage.getItem('preferredCurrency') || defaultCurrency.code;
  const currencyObj = currencies.find(c => c.code === currencyCode) || defaultCurrency;
  
  return `${currencyObj.symbol} ${amount.toLocaleString()}`;
}

export function getCurrentCurrency() {
  const currencyCode = localStorage.getItem('preferredCurrency') || defaultCurrency.code;
  return currencies.find(c => c.code === currencyCode) || defaultCurrency;
}
