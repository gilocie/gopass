

// A simplified list of countries and their currencies.
// In a real-world application, this would be more comprehensive.

export interface Currency {
    code: string;
    symbol: string;
    name: string;
}

export interface Country {
    code: string;
    name: string;
    currency: Currency;
}

export const currencies: Record<string, Currency> = {
    USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
    MWK: { code: 'MWK', symbol: 'K', name: 'Malawian Kwacha' },
    EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
    GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
    JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    CAD: { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
    AUD: { code: 'AUD', symbol: '$', name: 'Australian Dollar' },
    CHF: { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
    CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
    RUB: { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
    ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
    AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    KES: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
    NGN: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
    GHS: { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
};

export const countries: Country[] = [
    { code: 'US', name: 'United States', currency: currencies.USD },
    { code: 'MW', name: 'Malawi', currency: currencies.MWK },
    { code: 'DE', name: 'Germany', currency: currencies.EUR },
    { code: 'FR', name: 'France', currency: currencies.EUR },
    { code: 'GB', name: 'United Kingdom', currency: currencies.GBP },
].sort((a, b) => a.name.localeCompare(b.name));


// --- CURRENCY CONVERSION LOGIC ---

// Base currency for all stored prices in the app (e.g., plans, events)
export const BASE_CURRENCY_CODE: 'USD' = 'USD';


// Default rates if a user hasn't specified their own. This is how many of the target currency you get for 1 USD.
const DEFAULT_EXCHANGE_RATES: { [key: string]: number } = {
    USD: 1,
    MWK: 1750,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 157.6,
    CAD: 1.37,
    AUD: 1.5,
    CHF: 0.89,
    CNY: 7.26,
    INR: 83.5,
    BRL: 5.44,
    RUB: 88.2,
    ZAR: 18.0,
    AED: 3.67,
    KES: 128.5,
    NGN: 1480,
    GHS: 14.8,
};

/**
 * Converts an amount from the base currency (USD) to the target currency.
 * @param amount The amount in the BASE_CURRENCY (USD).
 * @param targetCurrencyCode The currency code to convert to.
 * @param userRates A dictionary of user-defined exchange rates from base currency.
 * @returns The converted amount.
 */
export function convertCurrency(amount: number, targetCurrencyCode: string, userRates: { [key: string]: number } = {}): number {
    if (targetCurrencyCode === BASE_CURRENCY_CODE) {
        return amount;
    }

    // Use the user's rate if available, otherwise fall back to the default rate.
    const rate = userRates[targetCurrencyCode] || DEFAULT_EXCHANGE_RATES[targetCurrencyCode];

    if (!rate) {
        // Fallback for an unknown currency, return the base amount
        return amount;
    }

    return amount * rate;
}

/**
 * Formats a number into a currency string.
 * @param amount The amount to format (already converted to the target currency).
 * @param currency The currency object.
 * @returns A formatted string, e.g., "$49.00" or "K85,750".
 */
export function formatCurrency(amount: number, currency: Currency): string {
    const isWholeNumber = currency.code === 'MWK' || currency.code === 'JPY';
    if (isWholeNumber) {
        return `${currency.symbol}${Math.round(amount).toLocaleString()}`;
    }
    return `${currency.symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatEventPrice(event: { price: number, currency: string }): string {
    const currencyInfo = currencies[event.currency] || { symbol: event.currency, code: event.currency };
    // If the event currency is the same as the user's selected currency, no conversion needed.
    // This handles cases like an MWK event being viewed by a user with MWK currency settings.
    if (event.currency === currencyInfo.code) {
      return formatCurrency(event.price, currencyInfo);
    }
    // This function now assumes that if currencies differ, the event.price is in BASE_CURRENCY (USD)
    // and needs to be converted to the user's local currency. The useCurrency hook handles this logic.
    // For direct display where context is not available, we can format it directly.
    return formatCurrency(event.price, currencyInfo);
}
