
'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getUserProfile } from '@/services/userService';
import type { UserProfile } from '@/lib/types';
import { countries, currencies, convertCurrency, formatCurrency, Country, Currency, BASE_CURRENCY_CODE } from '@/lib/currency';

interface CurrencyContextType {
  country: Country;
  currency: Currency;
  loading: boolean;
  convert: (amount: number, toLocal?: boolean) => number;
  format: (amount: number, isLocal?: boolean) => string;
  exchangeRates: { [key: string]: number };
}

const defaultCountry = countries.find(c => c.code === 'US') || countries[0];

const CurrencyContext = React.createContext<CurrencyContextType>({
  country: defaultCountry,
  currency: defaultCountry.currency,
  loading: true,
  convert: (amount) => amount,
  format: (amount) => `$${amount.toFixed(2)}`,
  exchangeRates: {},
});

export const useCurrency = () => React.useContext(CurrencyContext);

export const CurrencyProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [country, setCountry] = React.useState<Country>(defaultCountry);
  const [exchangeRates, setExchangeRates] = React.useState<{ [key: string]: number }>({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchUserCurrency = async () => {
      if (user) {
        const profile = await getUserProfile(user.uid);
        if (profile) {
            if (profile.countryCode) {
                const savedCountry = countries.find(c => c.code === profile.countryCode) || defaultCountry;
                setCountry(savedCountry);
            }
            if (profile.exchangeRates) {
                setExchangeRates(profile.exchangeRates);
            }
        }
      }
      setLoading(false);
    };

    if (!authLoading) {
      fetchUserCurrency();
    }
  }, [user, authLoading]);
  
  const convert = (amount: number, toLocal: boolean = false) => {
    if (toLocal) {
        return convertCurrency(amount, country.currency.code, exchangeRates);
    }
    return amount; // Assumes amount is already in base currency if toLocal is false
  }

  const format = (amount: number, isLocal: boolean = false) => {
    // If isLocal is true, it means the amount is already in the local currency.
    // Otherwise, the amount is in the base currency (USD) and needs conversion.
    const currencyToUse = isLocal ? country.currency : currencies[BASE_CURRENCY_CODE];
    const amountToFormat = isLocal ? amount : convertCurrency(amount, country.currency.code, exchangeRates);
    
    // This logic was flawed. We need to decide which currency to display based on the context.
    // The `isLocal` flag is the best indicator. If true, use the user's local currency.
    // If false, it means we are displaying a base value, so use the base currency format.
    // However, the intent of the app is to show everything in local currency.
    // Let's adjust to always convert and show local currency unless specified otherwise.
    
    const finalAmount = isLocal ? amount : convertCurrency(amount, country.currency.code, exchangeRates);
    return formatCurrency(finalAmount, country.currency);
  };
  
  const value = {
    country,
    currency: country.currency,
    loading,
    convert,
    format,
    exchangeRates
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};
