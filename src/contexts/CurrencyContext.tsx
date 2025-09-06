
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
  convert: (amount: number, fromCurrency?: string) => number;
  format: (amount: number, isLocal?: boolean, isBase?: boolean) => string;
  exchangeRates: { [key: string]: number };
}

const defaultCountry = countries.find(c => c.code === 'US') || countries[0];

const CurrencyContext = React.createContext<CurrencyContextType>({
  country: defaultCountry,
  currency: defaultCountry.currency,
  loading: true,
  convert: (amount) => amount,
  format: (amount, isLocal = false, isBase = false) => `$${amount.toFixed(2)}`,
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
  
  const convert = (amount: number, fromCurrency: string = BASE_CURRENCY_CODE): number => {
    // Converts an amount from any currency TO the user's selected currency
    if (fromCurrency === country.currency.code) {
        return amount;
    }
    // First, convert from the source currency back to the base currency (USD)
    const baseRate = exchangeRates[fromCurrency] || 1;
    const amountInBase = amount / baseRate;

    // Then, convert from the base currency to the target (user's) currency
    return convertCurrency(amountInBase, country.currency.code, exchangeRates);
  }

  const format = (amount: number, isLocal: boolean = false, isBase: boolean = false) => {
    // isLocal: The amount is already in the event's specific local currency (e.g. MWK). Format it as such.
    // isBase: The amount is in the platform's base currency (USD). Convert it to the user's selected currency and format.
    // default (both false): Same as isBase. Assumes the amount is in USD.

    if (isLocal) {
        // Find the currency for the amount, assuming it might not be the user's default.
        // This is a simplification; a more robust solution would pass the currency code.
        // For now, we format with the user's currency symbol but don't convert.
        return formatCurrency(amount, country.currency);
    }
    
    // If it's base or default, convert from USD to the user's selected currency.
    const finalAmount = convertCurrency(amount, country.currency.code, exchangeRates);
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
