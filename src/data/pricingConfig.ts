/**
 * Saremi Academy Centralized Pricing Configuration
 *
 * NOTE: All tuition fees, packages, hourly rates, and discounts are centrally managed here.
 * Never hard-code prices inside UI components. The actual fee structure can be updated here
 * or loaded from the backend without modifying frontend presentation code.
 */

export type CurrencyCode = 'INR' | 'USD';

export interface TuitionPackage {
  id: string;
  name: string;
  badge?: string;
  tagline: string;
  classesCount: number;
  classDurationMinutes: number;
  validityWeeks: number;
  priceINR: number;
  priceUSD: number;
  features: string[];
  recommended?: boolean;
}

export interface PricingConfig {
  defaultCurrency: CurrencyCode;
  trialFeeINR: number;
  trialFeeUSD: number;
  packages: TuitionPackage[];
  discounts: {
    siblingDiscountPercent: number;
    annualTermDiscountPercent: number;
  };
}

export const SAREMI_PRICING_CONFIG: PricingConfig = {
  defaultCurrency: 'INR',
  trialFeeINR: 0, // 100% Free diagnostic trial
  trialFeeUSD: 0,
  discounts: {
    siblingDiscountPercent: 10,
    annualTermDiscountPercent: 15
  },
  packages: [
    {
      id: 'pkg-starter-4',
      name: 'Standard 1:1 (4 Sessions / Month)',
      tagline: '1 Live 1:1 session per week for steady acoustic posture and progress',
      classesCount: 4,
      classDurationMinutes: 45,
      validityWeeks: 4,
      priceINR: 2499,
      priceUSD: 35,
      features: [
        '4 Live 1:1 sessions (45 mins each)',
        'Tanpura & Swara Tuner app access',
        'Personalized practice sheet after each class',
        'Reschedule up to 6 hours before slot'
      ]
    },
    {
      id: 'pkg-intensive-8',
      name: 'Standard 1:1 (8 Sessions / Month)',
      badge: 'Popular',
      tagline: '2 Live 1:1 sessions per week for fast-track skill acquisition',
      classesCount: 8,
      classDurationMinutes: 45,
      validityWeeks: 4,
      priceINR: 4499,
      priceUSD: 60,
      features: [
        '8 Live 1:1 sessions (2x weekly)',
        'Dedicated certified faculty guru',
        'Saremi Riyaaz practice companion & tuner',
        'Video homework review within 24 hours'
      ]
    },
    {
      id: 'pkg-foundation-16',
      name: '2-Month Term (16 Sessions • Save 10%)',
      badge: 'Save 10%',
      tagline: 'Systematic discipline, raga/scale repertoire & notation drills (₹4,299/mo)',
      classesCount: 16,
      classDurationMinutes: 45,
      validityWeeks: 8,
      priceINR: 8598,
      priceUSD: 115,
      features: [
        '16 Live 1:1 sessions with dedicated mentor',
        'Saremi Riyaaz practice companion & tuner',
        'Video homework review within 24 hours',
        'Mid-term vocal/instrument assessment',
        'Flexible slot rescheduling'
      ]
    },
    {
      id: 'pkg-conservatory-24',
      name: '3-Month Term (24 Sessions • Save 15%)',
      badge: '👑 Best Value',
      tagline: 'Structured classical & modern curriculum with level completion certification (₹3,999/mo)',
      classesCount: 24,
      classDurationMinutes: 45,
      validityWeeks: 12,
      priceINR: 11997,
      priceUSD: 160,
      recommended: true,
      features: [
        '24 Live 1:1 sessions with Gharana maestros',
        'Complete 4-Pillar syllabus covering major ragas/studies',
        'Saremi Graded Examination entry included',
        'Official Conservatory Certificate upon graduation',
        'Priority maestro masterclass seat reservation'
      ]
    }
  ]
};

/**
 * Utility functions for pricing retrieval
 */
export function getTuitionPackages(): TuitionPackage[] {
  return SAREMI_PRICING_CONFIG.packages;
}

export function getTuitionPackageById(id: string): TuitionPackage | undefined {
  return SAREMI_PRICING_CONFIG.packages.find((p) => p.id === id);
}

export function getDefaultPackage(): TuitionPackage {
  return (
    SAREMI_PRICING_CONFIG.packages.find((p) => p.recommended) ||
    SAREMI_PRICING_CONFIG.packages[1]
  );
}

export function formatPrice(amount: number, currency: CurrencyCode = 'INR'): string {
  if (amount === 0) return 'Free';
  if (currency === 'INR') {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  return `$${amount.toLocaleString('en-US')} USD`;
}

export function getPerClassRate(pkg: TuitionPackage, currency: CurrencyCode = 'INR'): string {
  const price = currency === 'INR' ? pkg.priceINR : pkg.priceUSD;
  const perClass = Math.round(price / pkg.classesCount);
  return formatPrice(perClass, currency);
}
