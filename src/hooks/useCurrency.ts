
import { useState, useEffect } from 'react';
import { currencies, defaultCurrency, getCurrencySymbol } from '@/config/currencies';
import { Currency } from '@/types';
import { useUserPreferences, useUpdateUserPreferences } from '@/hooks/useUserPreferences';

export const useCurrency = () => {
  const { data: userPreferences } = useUserPreferences();
  const updatePreferencesMutation = useUpdateUserPreferences();
  
  const currentCurrencyCode = userPreferences?.preferred_currency || defaultCurrency.code;
  const currentCurrency = currencies.find(c => c.code === currentCurrencyCode) || defaultCurrency;

  const formatAmount = (amount: number) => {
    return `${currentCurrency.symbol} ${amount.toLocaleString()}`;
  };

  const updateCurrency = (currencyCode: string) => {
    const currency = currencies.find(c => c.code === currencyCode);
    if (currency) {
      updatePreferencesMutation.mutate({ preferred_currency: currencyCode });
    }
  };

  return {
    currency: currentCurrency,
    formatAmount,
    updateCurrency,
    getCurrencySymbol
  };
};
