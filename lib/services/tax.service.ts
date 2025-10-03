/**
 * Tax Service
 *
 * Handles sales tax calculations for ticket purchases based on event location.
 * Implements state and local tax rate lookup with caching for performance.
 *
 * @module TaxService
 */

import { prisma } from '@/lib/prisma';

// US State Sales Tax Rates (as of 2024)
// Base rates - local rates may apply on top
const STATE_TAX_RATES: Record<string, number> = {
  'AL': 0.04,    // Alabama
  'AK': 0.00,    // Alaska (no state tax)
  'AZ': 0.056,   // Arizona
  'AR': 0.065,   // Arkansas
  'CA': 0.0725,  // California
  'CO': 0.029,   // Colorado
  'CT': 0.0635,  // Connecticut
  'DE': 0.00,    // Delaware (no sales tax)
  'FL': 0.06,    // Florida
  'GA': 0.04,    // Georgia
  'HI': 0.04,    // Hawaii
  'ID': 0.06,    // Idaho
  'IL': 0.0625,  // Illinois
  'IN': 0.07,    // Indiana
  'IA': 0.06,    // Iowa
  'KS': 0.065,   // Kansas
  'KY': 0.06,    // Kentucky
  'LA': 0.0445,  // Louisiana
  'ME': 0.055,   // Maine
  'MD': 0.06,    // Maryland
  'MA': 0.0625,  // Massachusetts
  'MI': 0.06,    // Michigan
  'MN': 0.06875, // Minnesota
  'MS': 0.07,    // Mississippi
  'MO': 0.04225, // Missouri
  'MT': 0.00,    // Montana (no sales tax)
  'NE': 0.055,   // Nebraska
  'NV': 0.0685,  // Nevada
  'NH': 0.00,    // New Hampshire (no sales tax)
  'NJ': 0.06625, // New Jersey
  'NM': 0.05125, // New Mexico
  'NY': 0.04,    // New York
  'NC': 0.0475,  // North Carolina
  'ND': 0.05,    // North Dakota
  'OH': 0.0575,  // Ohio
  'OK': 0.045,   // Oklahoma
  'OR': 0.00,    // Oregon (no sales tax)
  'PA': 0.06,    // Pennsylvania
  'RI': 0.07,    // Rhode Island
  'SC': 0.06,    // South Carolina
  'SD': 0.045,   // South Dakota
  'TN': 0.07,    // Tennessee
  'TX': 0.0625,  // Texas
  'UT': 0.0485,  // Utah
  'VT': 0.06,    // Vermont
  'VA': 0.053,   // Virginia
  'WA': 0.065,   // Washington
  'WV': 0.06,    // West Virginia
  'WI': 0.05,    // Wisconsin
  'WY': 0.04,    // Wyoming
  'DC': 0.06,    // District of Columbia
};

// Major city local tax add-ons
const LOCAL_TAX_OVERRIDES: Record<string, number> = {
  // California
  'CA-LOS-ANGELES': 0.0250,
  'CA-SAN-FRANCISCO': 0.0125,
  'CA-SAN-DIEGO': 0.0225,
  'CA-SACRAMENTO': 0.0200,

  // Texas
  'TX-AUSTIN': 0.0200,
  'TX-HOUSTON': 0.0200,
  'TX-DALLAS': 0.0200,
  'TX-SAN-ANTONIO': 0.0125,

  // New York
  'NY-NEW-YORK-CITY': 0.04875,

  // Illinois
  'IL-CHICAGO': 0.0125,

  // Colorado
  'CO-DENVER': 0.041,

  // Washington
  'WA-SEATTLE': 0.037,
};

export interface TaxCalculation {
  taxableAmount: number;
  stateTaxRate: number;
  localTaxRate: number;
  combinedTaxRate: number;
  taxAmount: number;
  total: number;
  jurisdiction: {
    state: string;
    city?: string;
    zip?: string;
  };
  isExempt: boolean;
  exemptionReason?: string;
}

export interface TaxExemption {
  id: string;
  eventId: string;
  exemptionType: 'NON_PROFIT' | 'GOVERNMENT' | 'EDUCATIONAL' | 'RELIGIOUS';
  certificateNumber?: string;
  expiresAt?: Date;
  approved: boolean;
}

/**
 * Tax Service Class
 */
export class TaxService {
  private taxRateCache: Map<string, { rate: number; timestamp: number }> = new Map();
  private cacheDurationMs = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Calculate sales tax for a ticket purchase
   */
  async calculateSalesTax(params: {
    taxableAmount: number;
    eventId: string;
    state: string;
    city?: string;
    zip?: string;
  }): Promise<TaxCalculation> {
    const { taxableAmount, eventId, state, city, zip } = params;

    // Check for tax exemption
    const exemption = await this.checkTaxExemption(eventId);
    if (exemption?.approved) {
      return {
        taxableAmount,
        stateTaxRate: 0,
        localTaxRate: 0,
        combinedTaxRate: 0,
        taxAmount: 0,
        total: taxableAmount,
        jurisdiction: { state, city, zip },
        isExempt: true,
        exemptionReason: exemption.exemptionType
      };
    }

    // Get tax rates
    const stateTaxRate = this.getStateTaxRate(state);
    const localTaxRate = this.getLocalTaxRate(state, city);
    const combinedTaxRate = stateTaxRate + localTaxRate;

    // Calculate tax amount (rounded up to nearest cent)
    const taxAmount = this.roundTaxAmount(taxableAmount * combinedTaxRate);
    const total = taxableAmount + taxAmount;

    return {
      taxableAmount,
      stateTaxRate,
      localTaxRate,
      combinedTaxRate,
      taxAmount,
      total,
      jurisdiction: { state, city, zip },
      isExempt: false
    };
  }

  /**
   * Get state tax rate
   */
  private getStateTaxRate(state: string): number {
    const normalizedState = state.toUpperCase().trim();
    return STATE_TAX_RATES[normalizedState] || 0;
  }

  /**
   * Get local tax rate with caching
   */
  private getLocalTaxRate(state: string, city?: string): number {
    if (!city) return 0;

    const normalizedState = state.toUpperCase().trim();
    const normalizedCity = city.toUpperCase().trim().replace(/\s+/g, '-');
    const key = `${normalizedState}-${normalizedCity}`;

    // Check cache
    const cached = this.taxRateCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheDurationMs) {
      return cached.rate;
    }

    // Look up local rate
    const localRate = LOCAL_TAX_OVERRIDES[key] || 0;

    // Cache for next time
    this.taxRateCache.set(key, {
      rate: localRate,
      timestamp: Date.now()
    });

    return localRate;
  }

  /**
   * Round tax amount to nearest cent (always round up per regulations)
   */
  private roundTaxAmount(amount: number): number {
    return Math.ceil(amount * 100) / 100;
  }

  /**
   * Check if event is tax-exempt
   */
  private async checkTaxExemption(eventId: string): Promise<TaxExemption | null> {
    try {
      const exemption = await prisma.taxExemption.findFirst({
        where: {
          eventId,
          approved: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } }
          ]
        }
      });

      return exemption as any; // Type cast for compatibility
    } catch (error) {
      console.error('Error checking tax exemption:', error);
      return null;
    }
  }

  /**
   * Get tax rate information for display
   */
  async getTaxRateInfo(state: string, city?: string): Promise<{
    state: string;
    stateTaxRate: number;
    localTaxRate: number;
    combinedTaxRate: number;
    description: string;
  }> {
    const stateTaxRate = this.getStateTaxRate(state);
    const localTaxRate = this.getLocalTaxRate(state, city);
    const combinedTaxRate = stateTaxRate + localTaxRate;

    const description = city
      ? `${state} state tax (${(stateTaxRate * 100).toFixed(2)}%) + ${city} local tax (${(localTaxRate * 100).toFixed(2)}%)`
      : `${state} state tax (${(stateTaxRate * 100).toFixed(2)}%)`;

    return {
      state,
      stateTaxRate,
      localTaxRate,
      combinedTaxRate,
      description
    };
  }

  /**
   * Extract state from venue address
   */
  extractStateFromAddress(address: string): string | null {
    // Try to extract state abbreviation from address
    const stateMatch = address.match(/\b([A-Z]{2})\b/);
    if (stateMatch && stateMatch[1] && STATE_TAX_RATES[stateMatch[1] as keyof typeof STATE_TAX_RATES] !== undefined) {
      return stateMatch[1];
    }
    return null;
  }

  /**
   * Extract city from venue address
   */
  extractCityFromAddress(address: string): string | null {
    // Basic city extraction - can be enhanced
    const parts = address.split(',');
    if (parts.length >= 2) {
      const city = parts[parts.length - 2];
      return city ? city.trim() : null;
    }
    return null;
  }

  /**
   * Extract zip code from venue address
   */
  extractZipFromAddress(address: string): string | null {
    const zipMatch = address.match(/\b(\d{5}(?:-\d{4})?)\b/);
    return zipMatch && zipMatch[1] ? zipMatch[1] : null;
  }

  /**
   * Clear tax rate cache (for testing or rate updates)
   */
  clearCache(): void {
    this.taxRateCache.clear();
  }

  /**
   * Validate tax calculation
   */
  validateTaxCalculation(calculation: TaxCalculation): boolean {
    // Ensure tax rate is reasonable (0-15%)
    if (calculation.combinedTaxRate < 0 || calculation.combinedTaxRate > 0.15) {
      return false;
    }

    // Ensure tax amount is properly calculated
    const expectedTax = this.roundTaxAmount(
      calculation.taxableAmount * calculation.combinedTaxRate
    );
    if (Math.abs(calculation.taxAmount - expectedTax) > 0.01) {
      return false;
    }

    // Ensure total is correct
    const expectedTotal = calculation.taxableAmount + calculation.taxAmount;
    if (Math.abs(calculation.total - expectedTotal) > 0.01) {
      return false;
    }

    return true;
  }
}

// Export singleton instance
export const taxService = new TaxService();

// Export for testing
export { STATE_TAX_RATES, LOCAL_TAX_OVERRIDES };