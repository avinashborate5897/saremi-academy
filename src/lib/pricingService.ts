import { collection, getDocs, setDoc, doc, updateDoc, onSnapshot, query } from 'firebase/firestore';
import { db } from './firebase';
import { SaremiPackage, OFFICIAL_PACKAGES, LearningMode } from '../data/pricingData';

const PACKAGES_COLLECTION = 'saremi_packages';

/**
 * Sync hardcoded packages to firestore if they don't exist
 * Called once on app load or admin view open
 */
export async function initializePackagesInFirestore() {
  try {
    const snapshot = await getDocs(collection(db, PACKAGES_COLLECTION));
    if (snapshot.empty) {
      console.log('Initializing packages in Firestore...');
      const batch = OFFICIAL_PACKAGES.map(pkg => setDoc(doc(db, PACKAGES_COLLECTION, pkg.id), pkg));
      await Promise.all(batch);
    }
  } catch (err) {
    console.warn('Packages initialization note (may be non-admin or offline):', err);
  }
}

/**
 * Subscribe to packages for real-time updates
 */
export function subscribeToPackages(
  callback: (packages: SaremiPackage[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, PACKAGES_COLLECTION));
  return onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const packages: SaremiPackage[] = [];
        snapshot.forEach(doc => {
          packages.push(doc.data() as SaremiPackage);
        });
        callback(packages);
      } else {
        callback(OFFICIAL_PACKAGES);
      }
    },
    (err) => {
      console.warn('Real-time packages listener fallback to defaults:', err.message);
      callback(OFFICIAL_PACKAGES);
      if (onError) onError(err);
    }
  );
}

export async function updatePackage(packageId: string, updates: Partial<SaremiPackage>) {
  const ref = doc(db, PACKAGES_COLLECTION, packageId);
  await updateDoc(ref, updates);
}

export async function createPackage(pkg: SaremiPackage) {
  const ref = doc(db, PACKAGES_COLLECTION, pkg.id);
  await setDoc(ref, pkg);
}

/**
 * Find matching package from live packages list
 */
export function findMatchingPackage(
  packagesList: SaremiPackage[],
  mode: LearningMode,
  sessionsPerMonth: 4 | 8,
  durationMonths: 1 | 2 | 3
): SaremiPackage | undefined {
  const list = Array.isArray(packagesList) && packagesList.length > 0 ? packagesList : OFFICIAL_PACKAGES;
  return list.find(p => p.learningMode === mode && p.sessionsPerMonth === sessionsPerMonth && p.durationMonths === durationMonths && p.active !== false);
}

/**
 * Format pricing details for a given package selection
 */
export function formatPackagePricingOption(
  pkg: SaremiPackage | undefined,
  durationMonths: 1 | 2 | 3,
  sessionsPerMonth: 4 | 8
) {
  if (!pkg) {
    const baseMonthly = sessionsPerMonth === 4 ? 2499 : 4499;
    const discountFactor = durationMonths === 2 ? 0.9 : durationMonths === 3 ? 0.85 : 1.0;
    const monthlyPrice = Math.round(baseMonthly * discountFactor);
    const totalPrice = monthlyPrice * durationMonths;

    return {
      packageId: `fallback-${sessionsPerMonth}s-${durationMonths}m`,
      duration: durationMonths,
      durationLabel: `${durationMonths} Month${durationMonths > 1 ? 's' : ''}`,
      monthlyPrice,
      totalPrice,
      sessionsTotal: sessionsPerMonth * durationMonths,
      badge: durationMonths === 2 ? '🔥 SAVE 10%' : durationMonths === 3 ? '👑 SAVE 15%' : null,
      savingsLabel: durationMonths > 1 ? `Save on ${durationMonths}-month plan` : null,
      isBestValue: durationMonths === 3
    };
  }

  const monthlyPrice = pkg.monthlyDisplayPrice || Math.round(pkg.totalPrice / pkg.durationMonths);
  const totalPrice = pkg.totalPrice || (monthlyPrice * pkg.durationMonths);
  const sessionsTotal = pkg.sessions || (pkg.sessionsPerMonth * pkg.durationMonths);

  let savingsLabel = null;
  if (pkg.durationMonths === 2) {
    savingsLabel = `Save on 2-month plan`;
  } else if (pkg.durationMonths === 3) {
    savingsLabel = `Save on 3-month plan • Best Value`;
  }

  return {
    packageId: pkg.id,
    duration: pkg.durationMonths as 1 | 2 | 3,
    durationLabel: `${pkg.durationMonths} Month${pkg.durationMonths > 1 ? 's' : ''}`,
    monthlyPrice,
    totalPrice,
    sessionsTotal,
    badge: pkg.discountLabel || (pkg.durationMonths === 2 ? '🔥 SAVE 10%' : pkg.durationMonths === 3 ? '👑 SAVE 15%' : null),
    savingsLabel,
    isBestValue: !!pkg.bestValue || pkg.durationMonths === 3
  };
}
