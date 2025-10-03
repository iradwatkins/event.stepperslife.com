# PAY-016: Multi-Currency Display

**Epic:** EPIC-008 - Enhanced Payment Processing
**Story Points:** 2
**Priority:** Low
**Sprint:** TBD
**Status:** Ready for Development

---

## User Story

**As an** international user browsing events from outside the United States
**I want to** view ticket prices in my local currency
**So that I** can understand the cost in familiar terms without manual conversion

---

## Acceptance Criteria

### 1. Currency Detection
- [ ] System detects user's country from IP address geolocation
- [ ] Currency preference inferred from country (e.g., UK → GBP, Japan → JPY)
- [ ] Fallback to browser locale if geolocation unavailable
- [ ] User can manually override currency preference in settings
- [ ] Currency preference stored in session/cookies
- [ ] Selected currency persists across sessions for logged-in users

### 2. Currency Conversion Display
- [ ] Original USD price displayed prominently
- [ ] Converted price shown below/beside in smaller text
- [ ] Format: "$25.00 USD (≈ £19.50 GBP)"
- [ ] Conversion rates fetched from reliable API (exchangerate-api.io)
- [ ] Rates cached for 1 hour to reduce API calls
- [ ] Conversion disclaimer: "Approximate conversion - charged in USD"

### 3. Supported Currencies
- [ ] Support top 20 currencies by transaction volume:
  - USD (United States Dollar) - base currency
  - EUR (Euro)
  - GBP (British Pound)
  - CAD (Canadian Dollar)
  - AUD (Australian Dollar)
  - JPY (Japanese Yen)
  - MXN (Mexican Peso)
  - INR (Indian Rupee)
  - CNY (Chinese Yuan)
  - BRL (Brazilian Real)
  - And 10 others (see technical specs)
- [ ] Currency codes displayed using ISO 4217 standard
- [ ] Currency symbols localized correctly (€, £, ¥, etc.)

### 4. Number Formatting
- [ ] Numbers formatted according to locale conventions
- [ ] US: $1,234.56 | EU: 1.234,56 € | Japan: ¥1,234
- [ ] Decimal places match currency standard (2 for USD/EUR, 0 for JPY)
- [ ] Thousands separators applied correctly
- [ ] Use Intl.NumberFormat API for consistent formatting

### 5. UI Currency Selector
- [ ] Currency dropdown in header/navigation
- [ ] Dropdown shows currency code and symbol (e.g., "USD $", "EUR €")
- [ ] Flag icons for visual recognition (optional)
- [ ] Selected currency highlighted
- [ ] Change triggers immediate page update (no reload)
- [ ] Setting saved to user profile if logged in

### 6. Checkout Processing
- [ ] Checkout clearly states "Payment processed in USD"
- [ ] Final amount shown in USD before payment
- [ ] Converted price displayed for reference throughout checkout
- [ ] Square payment always in USD (no actual multi-currency processing)
- [ ] Receipt shows USD amount charged

### 7. Exchange Rate Display
- [ ] Exchange rate shown in small text: "1 USD = 0.78 GBP"
- [ ] Rate source and timestamp displayed
- [ ] "Rates updated hourly" disclaimer
- [ ] Link to exchange rate provider for transparency

### 8. Caching Strategy
- [ ] Exchange rates cached in Redis for 1 hour
- [ ] API calls limited to 1 per hour per currency
- [ ] Fallback to stale cache if API unavailable (with warning)
- [ ] Cache warming for popular currencies on startup
- [ ] Cache invalidation on demand (admin tool)

### 9. Analytics Tracking
- [ ] Track currency selection by users
- [ ] Monitor most popular non-USD currencies
- [ ] Track conversion rate impact on purchases
- [ ] Geographic distribution of currency preferences
- [ ] A/B test currency display vs. no display

### 10. Error Handling
- [ ] Graceful degradation if conversion API unavailable
- [ ] Show USD-only if conversion fails
- [ ] Log conversion errors without disrupting UX
- [ ] Alert admin if API down for >1 hour
- [ ] User message: "Currency conversion temporarily unavailable"

### 11. Mobile Optimization
- [ ] Currency selector accessible on mobile
- [ ] Converted prices don't clutter mobile layout
- [ ] Tap to toggle between USD and local currency
- [ ] Responsive formatting for all screen sizes

### 12. SEO Considerations
- [ ] Prices rendered server-side for SEO
- [ ] Structured data includes USD price (canonical)
- [ ] hreflang tags for international pages
- [ ] Currency parameter in URL query (optional: ?currency=GBP)

---

## Technical Specifications

### Currency Conversion Service

```typescript
// lib/services/currency.service.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: Date;
}

export const SUPPORTED_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'MXN', 'INR', 'CNY', 'BRL',
  'CHF', 'KRW', 'SEK', 'NOK', 'DKK', 'PLN', 'NZD', 'SGD', 'HKD', 'ZAR',
] as const;

export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

export class CurrencyService {
  private readonly API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';
  private readonly CACHE_TTL = 3600; // 1 hour in seconds

  /**
   * Get exchange rate for currency pair
   */
  async getExchangeRate(to: SupportedCurrency): Promise<ExchangeRate> {
    // Check cache first
    const cacheKey = `exchange_rate:USD:${to}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from API
    try {
      const response = await fetch(this.API_URL);
      const data = await response.json();

      const rate = data.rates[to];
      if (!rate) {
        throw new Error(`Exchange rate not available for ${to}`);
      }

      const exchangeRate: ExchangeRate = {
        from: 'USD',
        to,
        rate,
        timestamp: new Date(),
      };

      // Cache for 1 hour
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(exchangeRate));

      return exchangeRate;
    } catch (error) {
      console.error('Exchange rate fetch error:', error);

      // Try to get stale cache as fallback
      const staleCache = await redis.get(`${cacheKey}:stale`);
      if (staleCache) {
        console.log('Using stale exchange rate as fallback');
        return JSON.parse(staleCache);
      }

      throw error;
    }
  }

  /**
   * Convert amount from USD to target currency
   */
  async convert(amountUSD: number, to: SupportedCurrency): Promise<number> {
    if (to === 'USD') {
      return amountUSD;
    }

    const exchangeRate = await this.getExchangeRate(to);
    return amountUSD * exchangeRate.rate;
  }

  /**
   * Format amount with currency symbol and locale
   */
  formatAmount(amount: number, currency: SupportedCurrency, locale?: string): string {
    const localeMap: Record<SupportedCurrency, string> = {
      USD: 'en-US',
      EUR: 'de-DE',
      GBP: 'en-GB',
      CAD: 'en-CA',
      AUD: 'en-AU',
      JPY: 'ja-JP',
      MXN: 'es-MX',
      INR: 'en-IN',
      CNY: 'zh-CN',
      BRL: 'pt-BR',
      CHF: 'de-CH',
      KRW: 'ko-KR',
      SEK: 'sv-SE',
      NOK: 'nb-NO',
      DKK: 'da-DK',
      PLN: 'pl-PL',
      NZD: 'en-NZ',
      SGD: 'en-SG',
      HKD: 'zh-HK',
      ZAR: 'en-ZA',
    };

    const targetLocale = locale || localeMap[currency];

    return new Intl.NumberFormat(targetLocale, {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'JPY' ? 0 : 2,
      maximumFractionDigits: currency === 'JPY' ? 0 : 2,
    }).format(amount);
  }

  /**
   * Get currency symbol
   */
  getCurrencySymbol(currency: SupportedCurrency): string {
    const symbolMap: Record<SupportedCurrency, string> = {
      USD: '$', EUR: '€', GBP: '£', CAD: 'CA$', AUD: 'A$', JPY: '¥',
      MXN: 'MX$', INR: '₹', CNY: '¥', BRL: 'R$', CHF: 'CHF', KRW: '₩',
      SEK: 'kr', NOK: 'kr', DKK: 'kr', PLN: 'zł', NZD: 'NZ$', SGD: 'S$',
      HKD: 'HK$', ZAR: 'R',
    };

    return symbolMap[currency];
  }

  /**
   * Detect currency from country code
   */
  detectCurrency(countryCode: string): SupportedCurrency {
    const countryToCurrency: Record<string, SupportedCurrency> = {
      US: 'USD', GB: 'GBP', DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR',
      CA: 'CAD', AU: 'AUD', JP: 'JPY', MX: 'MXN', IN: 'INR', CN: 'CNY',
      BR: 'BRL', CH: 'CHF', KR: 'KRW', SE: 'SEK', NO: 'NOK', DK: 'DKK',
      PL: 'PLN', NZ: 'NZD', SG: 'SGD', HK: 'HKD', ZA: 'ZAR',
    };

    return countryToCurrency[countryCode] || 'USD';
  }

  /**
   * Get user's currency preference
   */
  async getUserCurrency(
    ipAddress?: string,
    userPreference?: SupportedCurrency
  ): Promise<SupportedCurrency> {
    // User preference takes priority
    if (userPreference && SUPPORTED_CURRENCIES.includes(userPreference)) {
      return userPreference;
    }

    // Try IP geolocation
    if (ipAddress) {
      try {
        const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
        const data = await response.json();
        const countryCode = data.country_code;

        if (countryCode) {
          return this.detectCurrency(countryCode);
        }
      } catch (error) {
        console.error('IP geolocation error:', error);
      }
    }

    // Default to USD
    return 'USD';
  }

  /**
   * Warm cache for popular currencies
   */
  async warmCache(): Promise<void> {
    const popularCurrencies: SupportedCurrency[] = ['EUR', 'GBP', 'CAD', 'AUD', 'JPY'];

    await Promise.all(
      popularCurrencies.map(currency => this.getExchangeRate(currency))
    );

    console.log('Currency cache warmed for popular currencies');
  }
}

export const currencyService = new CurrencyService();
```

### React Component

```typescript
// components/ui/CurrencyPrice.tsx
'use client';

import { useState, useEffect } from 'react';
import { useCurrency } from '@/hooks/useCurrency';

interface CurrencyPriceProps {
  amountUSD: number;
  showOriginal?: boolean;
  className?: string;
}

export function CurrencyPrice({
  amountUSD,
  showOriginal = true,
  className = '',
}: CurrencyPriceProps) {
  const { currency, convertAmount, formatAmount } = useCurrency();
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);

  useEffect(() => {
    if (currency !== 'USD') {
      convertAmount(amountUSD, currency).then(setConvertedAmount);
    }
  }, [amountUSD, currency, convertAmount]);

  const formattedUSD = formatAmount(amountUSD, 'USD');

  if (currency === 'USD' || convertedAmount === null) {
    return <span className={className}>{formattedUSD}</span>;
  }

  const formattedConverted = formatAmount(convertedAmount, currency);

  return (
    <div className={className}>
      <div className="font-semibold">{formattedUSD}</div>
      <div className="text-sm text-muted-foreground">
        ≈ {formattedConverted}
        <span className="ml-1 text-xs">*</span>
      </div>
    </div>
  );
}

// Currency selector component
export function CurrencySelector() {
  const { currency, setCurrency, supportedCurrencies } = useCurrency();

  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value as any)}
      className="border rounded-md px-3 py-1 text-sm"
    >
      {supportedCurrencies.map((curr) => (
        <option key={curr} value={curr}>
          {curr} {getCurrencySymbol(curr)}
        </option>
      ))}
    </select>
  );
}
```

### Custom Hook

```typescript
// hooks/useCurrency.ts
'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { SupportedCurrency, SUPPORTED_CURRENCIES } from '@/lib/services/currency.service';

interface CurrencyContextValue {
  currency: SupportedCurrency;
  setCurrency: (currency: SupportedCurrency) => void;
  convertAmount: (amountUSD: number, to: SupportedCurrency) => Promise<number>;
  formatAmount: (amount: number, currency: SupportedCurrency) => string;
  supportedCurrencies: readonly SupportedCurrency[];
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<SupportedCurrency>('USD');

  useEffect(() => {
    // Load from localStorage or detect
    const stored = localStorage.getItem('currency_preference') as SupportedCurrency;
    if (stored && SUPPORTED_CURRENCIES.includes(stored)) {
      setCurrencyState(stored);
    } else {
      // Detect from browser locale
      const browserLocale = navigator.language.split('-')[1]?.toUpperCase();
      const detected = detectCurrencyFromCountry(browserLocale);
      setCurrencyState(detected);
    }
  }, []);

  const setCurrency = useCallback((newCurrency: SupportedCurrency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('currency_preference', newCurrency);
  }, []);

  const convertAmount = useCallback(
    async (amountUSD: number, to: SupportedCurrency): Promise<number> => {
      const response = await fetch(`/api/currency/convert?amount=${amountUSD}&to=${to}`);
      const data = await response.json();
      return data.converted;
    },
    []
  );

  const formatAmount = useCallback(
    (amount: number, currency: SupportedCurrency): string => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
      }).format(amount);
    },
    []
  );

  const value: CurrencyContextValue = {
    currency,
    setCurrency,
    convertAmount,
    formatAmount,
    supportedCurrencies: SUPPORTED_CURRENCIES,
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
}
```

### API Route

```typescript
// app/api/currency/convert/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { currencyService, SUPPORTED_CURRENCIES } from '@/lib/services/currency.service';
import { z } from 'zod';

const convertSchema = z.object({
  amount: z.string().transform(Number),
  to: z.enum(SUPPORTED_CURRENCIES),
});

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const params = convertSchema.parse({
      amount: searchParams.get('amount'),
      to: searchParams.get('to'),
    });

    const converted = await currencyService.convert(params.amount, params.to);
    const formatted = currencyService.formatAmount(converted, params.to);
    const exchangeRate = await currencyService.getExchangeRate(params.to);

    return NextResponse.json({
      original: params.amount,
      converted,
      formatted,
      currency: params.to,
      rate: exchangeRate.rate,
      timestamp: exchangeRate.timestamp,
    });
  } catch (error) {
    console.error('Currency conversion error:', error);
    return NextResponse.json(
      { error: 'Conversion failed' },
      { status: 500 }
    );
  }
}
```

---

## Dependencies

### Technical Dependencies
- Exchange rate API (exchangerate-api.com)
- Redis for caching
- Next.js 14+
- React Context API
- Intl.NumberFormat API

### Story Dependencies
- None (standalone feature)

---

## Testing Requirements

### Unit Tests
- Test currency conversion calculations
- Test number formatting for all currencies
- Test cache hit/miss scenarios
- Test currency detection logic
- Test fallback to stale cache

### Integration Tests
- Test complete conversion flow
- Test API rate limiting
- Test cache expiration
- Test currency selector UI

### Edge Cases
- Test with unavailable exchange rate API
- Test with unsupported currencies
- Test with zero/negative amounts
- Test with very large amounts

---

## Security Considerations

### API Rate Limiting
- Limit conversion API calls (1 per hour per currency)
- Implement client-side rate limiting
- Use cached rates whenever possible

### Data Validation
- Validate currency codes against whitelist
- Sanitize amount inputs
- Prevent injection attacks

---

## Monitoring & Analytics

### Key Metrics
- Most popular non-USD currencies
- Conversion API uptime
- Cache hit rate
- Currency selector usage rate

### Alerts
- Alert when exchange rate API down >1 hour
- Alert on cache failures
- Alert on unusual currency selections

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests with 90%+ coverage
- [ ] Integration tests passing
- [ ] Exchange rate API integrated
- [ ] Caching implemented
- [ ] UI components tested on all devices
- [ ] Documentation complete
- [ ] Product owner approval

---

## Notes

### Important Disclaimers
- Display-only conversion (processing still in USD)
- Approximate rates (updated hourly)
- Final charge always in USD via Square

### Future Enhancements
- True multi-currency payment processing
- Dynamic currency conversion at checkout
- Historical exchange rate tracking
- Currency hedging for organizers