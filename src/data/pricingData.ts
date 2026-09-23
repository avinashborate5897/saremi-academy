// Pricing configuration and models for Saremi Academy

export type CourseId = 'singing' | 'guitar' | 'keyboard' | 'tabla' | 'violin' | 'flute';
export type LearningMode = 'one_to_one' | 'group' | 'premium_one_to_one';

export interface SaremiCourse {
  id: CourseId;
  name: string;
  instrument: string;
  description: string;
  iconName: string;
  allowedModes: LearningMode[];
  active: boolean;
}

export interface SaremiPackage {
  id: string;
  name?: string;
  learningMode: LearningMode;
  sessionsPerMonth: 4 | 8;
  durationMonths: 1 | 2 | 3;
  monthlyDisplayPrice: number;
  totalPrice: number;
  sessions?: number;
  totalClasses?: number;
  classesPerWeek?: number;
  classDurationMins?: number;
  priceINR?: number;
  priceUSD?: number;
  price?: number | string;
  tagline?: string;
  features?: string[];
  currency: 'INR';
  discountLabel?: string;
  bestValue?: boolean;
  active: boolean;
}

// 1. Course Definitions
export const OFFICIAL_COURSES: SaremiCourse[] = [
  { id: 'singing', name: 'Singing', instrument: 'Vocals', description: 'Classical and contemporary vocal training.', iconName: 'Mic', allowedModes: ['group', 'one_to_one'], active: true },
  { id: 'guitar', name: 'Guitar', instrument: 'Guitar', description: 'Acoustic and electric guitar mastery.', iconName: 'Guitar', allowedModes: ['group', 'one_to_one'], active: true },
  { id: 'keyboard', name: 'Keyboard', instrument: 'Piano/Synth', description: 'Piano and modern keyboard techniques.', iconName: 'Piano', allowedModes: ['one_to_one'], active: true },
  { id: 'tabla', name: 'Tabla', instrument: 'Tabla', description: 'Traditional Indian percussion rhythms.', iconName: 'Drum', allowedModes: ['one_to_one'], active: true },
  { id: 'violin', name: 'Violin', instrument: 'Violin', description: 'Premium classical strings education.', iconName: 'Music', allowedModes: ['premium_one_to_one'], active: true },
  { id: 'flute', name: 'Flute', instrument: 'Flute', description: 'Premium woodwind mastery.', iconName: 'Wind', allowedModes: ['premium_one_to_one'], active: true }
];

// 2. Package Definitions
export const OFFICIAL_PACKAGES: SaremiPackage[] = [
  // STANDARD 1:1 - 4 Sessions
  { id: 'pkg-std-1-1-4s-1m', learningMode: 'one_to_one', sessionsPerMonth: 4, durationMonths: 1, monthlyDisplayPrice: 2499, totalPrice: 2499, currency: 'INR', active: true },
  { id: 'pkg-std-1-1-4s-2m', learningMode: 'one_to_one', sessionsPerMonth: 4, durationMonths: 2, monthlyDisplayPrice: 2299, totalPrice: 4598, currency: 'INR', discountLabel: '🔥 SAVE 10%', active: true },
  { id: 'pkg-std-1-1-4s-3m', learningMode: 'one_to_one', sessionsPerMonth: 4, durationMonths: 3, monthlyDisplayPrice: 1999, totalPrice: 5997, currency: 'INR', discountLabel: 'SAVE 15%', bestValue: true, active: true },
  
  // STANDARD 1:1 - 8 Sessions
  { id: 'pkg-std-1-1-8s-1m', learningMode: 'one_to_one', sessionsPerMonth: 8, durationMonths: 1, monthlyDisplayPrice: 4499, totalPrice: 4499, currency: 'INR', active: true },
  { id: 'pkg-std-1-1-8s-2m', learningMode: 'one_to_one', sessionsPerMonth: 8, durationMonths: 2, monthlyDisplayPrice: 4299, totalPrice: 8598, currency: 'INR', discountLabel: '🔥 SAVE 10%', active: true },
  { id: 'pkg-std-1-1-8s-3m', learningMode: 'one_to_one', sessionsPerMonth: 8, durationMonths: 3, monthlyDisplayPrice: 3999, totalPrice: 11997, currency: 'INR', discountLabel: 'SAVE 15%', bestValue: true, active: true },
  
  // GROUP - 8 Sessions
  { id: 'pkg-grp-8s-1m', learningMode: 'group', sessionsPerMonth: 8, durationMonths: 1, monthlyDisplayPrice: 1899, totalPrice: 1899, currency: 'INR', active: true },
  { id: 'pkg-grp-8s-2m', learningMode: 'group', sessionsPerMonth: 8, durationMonths: 2, monthlyDisplayPrice: 1709, totalPrice: 3418, currency: 'INR', discountLabel: '🔥 SAVE 10%', active: true },
  { id: 'pkg-grp-8s-3m', learningMode: 'group', sessionsPerMonth: 8, durationMonths: 3, monthlyDisplayPrice: 1614, totalPrice: 4842, currency: 'INR', discountLabel: 'SAVE 15%', bestValue: true, active: true },

  // PREMIUM 1:1 - 4 Sessions
  { id: 'pkg-prm-1-1-4s-1m', learningMode: 'premium_one_to_one', sessionsPerMonth: 4, durationMonths: 1, monthlyDisplayPrice: 2699, totalPrice: 2699, currency: 'INR', active: true },
  { id: 'pkg-prm-1-1-4s-2m', learningMode: 'premium_one_to_one', sessionsPerMonth: 4, durationMonths: 2, monthlyDisplayPrice: 2429, totalPrice: 4858, currency: 'INR', discountLabel: '🔥 SAVE 10%', active: true },
  { id: 'pkg-prm-1-1-4s-3m', learningMode: 'premium_one_to_one', sessionsPerMonth: 4, durationMonths: 3, monthlyDisplayPrice: 2299, totalPrice: 6897, currency: 'INR', discountLabel: 'SAVE 15%', bestValue: true, active: true },
  
  // PREMIUM 1:1 - 8 Sessions
  { id: 'pkg-prm-1-1-8s-1m', learningMode: 'premium_one_to_one', sessionsPerMonth: 8, durationMonths: 1, monthlyDisplayPrice: 4999, totalPrice: 4999, currency: 'INR', active: true },
  { id: 'pkg-prm-1-1-8s-2m', learningMode: 'premium_one_to_one', sessionsPerMonth: 8, durationMonths: 2, monthlyDisplayPrice: 4499, totalPrice: 8998, currency: 'INR', discountLabel: '🔥 SAVE 10%', active: true },
  { id: 'pkg-prm-1-1-8s-3m', learningMode: 'premium_one_to_one', sessionsPerMonth: 8, durationMonths: 3, monthlyDisplayPrice: 4249, totalPrice: 12747, currency: 'INR', discountLabel: 'SAVE 15%', bestValue: true, active: true },
];

export function getPackages(mode: LearningMode, sessionsPerMonth: 4 | 8): SaremiPackage[] {
  return OFFICIAL_PACKAGES.filter(p => p.learningMode === mode && p.sessionsPerMonth === sessionsPerMonth && p.active);
}

/**
 * Authoritative Package Lookup with backwards-compatibility aliases
 */
export function getAuthoritativePackage(packageIdOrAlias?: string): SaremiPackage | undefined {
  if (!packageIdOrAlias) return OFFICIAL_PACKAGES[5]; // Default: 3-month standard 8-classes

  const direct = OFFICIAL_PACKAGES.find(p => p.id === packageIdOrAlias);
  if (direct) return direct;

  const id = packageIdOrAlias.toLowerCase();
  if (id.includes('grp') || id.includes('group')) {
    if (id.includes('3m') || id.includes('24') || id.includes('three')) return OFFICIAL_PACKAGES[8];
    if (id.includes('2m') || id.includes('16') || id.includes('two')) return OFFICIAL_PACKAGES[7];
    return OFFICIAL_PACKAGES[6];
  }

  if (id.includes('prm') || id.includes('premium') || id.includes('maestro') || id.includes('violin') || id.includes('flute')) {
    if (id.includes('8s') || id.includes('weekly2') || id.includes('8-classes') || id.includes('8classes')) {
      if (id.includes('3m') || id.includes('24') || id.includes('three')) return OFFICIAL_PACKAGES[14]; // ₹12,747
      if (id.includes('2m') || id.includes('16') || id.includes('two')) return OFFICIAL_PACKAGES[13]; // ₹8,998
      return OFFICIAL_PACKAGES[12]; // ₹4,999
    }
    if (id.includes('3m') || id.includes('12') || id.includes('three')) return OFFICIAL_PACKAGES[11]; // ₹6,897
    if (id.includes('2m') || id.includes('8') || id.includes('two')) return OFFICIAL_PACKAGES[10]; // ₹4,858
    return OFFICIAL_PACKAGES[9]; // ₹2,699
  }

  if (id.includes('4s') || id.includes('weekly1') || id.includes('starter-4')) {
    if (id.includes('3m') || id.includes('12')) return OFFICIAL_PACKAGES[2];
    if (id.includes('2m') || id.includes('8')) return OFFICIAL_PACKAGES[1];
    return OFFICIAL_PACKAGES[0];
  }

  if (id.includes('3month') || id.includes('3m') || id.includes('24') || id.includes('term') || id.includes('certification')) {
    return OFFICIAL_PACKAGES[5];
  }
  if (id.includes('2month') || id.includes('2m') || id.includes('16')) {
    return OFFICIAL_PACKAGES[4];
  }

  return OFFICIAL_PACKAGES[3]; // Standard 8s / 1m
}

export function getPackageById(packageId: string): SaremiPackage {
  return getAuthoritativePackage(packageId) || OFFICIAL_PACKAGES[5];
}

export function getAuthoritativePrice(
  packageIdOrAlias: string,
  options?: { isRenewal?: boolean; currency?: 'INR' | 'USD' }
) {
  const pkg = getAuthoritativePackage(packageIdOrAlias) || OFFICIAL_PACKAGES[5];
  const currency = options?.currency || 'INR';
  const basePrice = pkg.totalPrice;
  const isRenewal = !!options?.isRenewal;
  const renewalDiscountPercent = isRenewal ? 12 : 0;
  const finalPrice = isRenewal ? Math.round(basePrice * 0.88) : basePrice;

  return {
    package: pkg,
    basePrice,
    finalPrice,
    currency,
    isRenewal,
    renewalDiscountPercent
  };
}

