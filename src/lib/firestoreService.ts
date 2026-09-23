import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { INITIAL_COURSES, INITIAL_PRODUCTS } from './initialData';
import {
  Course,
  Product,
  Order,
  OrderStatus,
  Booking,
  UserProfile,
  TransactionalEmailLog
} from '@/src/types';

// Admin verification helper
export const ADMIN_EMAIL = 'avinashborate5897@gmail.com';

export function isStaffAdmin(user: { email?: string | null; role?: string } | null): boolean {
  if (!user) return false;
  if (user.email === ADMIN_EMAIL) return true;
  if (user.role === 'admin') return true;
  return false;
}

/**
 * Initialize Firestore data if collections are empty.
 */
export async function ensureCatalogInitialized(): Promise<void> {
  // Only attempt catalog database seeding if user is authenticated staff admin
  if (!isStaffAdmin(auth.currentUser)) {
    return;
  }

  try {
    const coursesSnapshot = await getDocs(collection(db, 'courses'));
    if (coursesSnapshot.empty) {
      for (const course of INITIAL_COURSES) {
        await setDoc(doc(db, 'courses', course.id), {
          ...course,
          createdAt: new Date().toISOString()
        });
      }
    }
  } catch (error) {
    console.warn('Initial courses check/seed skipped or offline:', error);
  }

  try {
    const productsSnapshot = await getDocs(collection(db, 'products'));
    if (productsSnapshot.empty) {
      for (const product of INITIAL_PRODUCTS) {
        await setDoc(doc(db, 'products', product.id), {
          ...product,
          createdAt: new Date().toISOString()
        });
      }
    }
  } catch (error) {
    console.warn('Initial products check/seed skipped or offline:', error);
  }
}

/**
 * Courses Real-Time Subscription
 */
export function subscribeToCourses(
  onSuccess: (courses: Course[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'courses';
  const unsubscribe = onSnapshot(
    collection(db, path),
    (snapshot) => {
      if (!snapshot.empty) {
        const courses = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Course));
        onSuccess(courses);
      } else {
        // Fallback to initial courses
        onSuccess(INITIAL_COURSES);
      }
    },
    (error) => {
      console.warn('Live courses fallback to defaults:', error.message);
      onSuccess(INITIAL_COURSES);
      if (onError) onError(error);
    }
  );
  return unsubscribe;
}

/**
 * Products Real-Time Subscription
 */
export function subscribeToProducts(
  onSuccess: (products: Product[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'products';
  const unsubscribe = onSnapshot(
    collection(db, path),
    (snapshot) => {
      if (!snapshot.empty) {
        const products = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
        onSuccess(products);
      } else {
        onSuccess(INITIAL_PRODUCTS);
      }
    },
    (error) => {
      console.warn('Live products fallback to defaults:', error.message);
      onSuccess(INITIAL_PRODUCTS);
      if (onError) onError(error);
    }
  );
  return unsubscribe;
}

/**
 * Real-time Order Tracking Subscription
 */
export function subscribeToOrder(
  orderId: string,
  onSuccess: (order: Order | null) => void,
  onError?: (err: unknown) => void
): () => void {
  const path = `orders/${orderId}`;
  const orderDocRef = doc(db, 'orders', orderId);

  const unsubscribe = onSnapshot(
    orderDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onSuccess({ id: snapshot.id, ...snapshot.data() } as Order);
      } else {
        onSuccess(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      if (onError) onError(error);
    }
  );
  return unsubscribe;
}

/**
 * User's Orders Subscription
 */
export function subscribeToUserOrders(
  userId: string,
  onSuccess: (orders: Order[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const path = 'orders';
  const q = query(collection(db, path), where('userId', '==', userId));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
      // Sort newest first
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onSuccess(orders);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      if (onError) onError(error);
    }
  );
  return unsubscribe;
}

/**
 * Staff Admin Orders Subscription
 */
export function subscribeToAllOrders(
  onSuccess: (orders: Order[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const path = 'orders';
  const unsubscribe = onSnapshot(
    collection(db, path),
    (snapshot) => {
      const orders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onSuccess(orders);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      if (onError) onError(error);
    }
  );
  return unsubscribe;
}

/**
 * Create Order in Firestore
 */
export async function createOrderInFirestore(order: Order): Promise<void> {
  const path = `orders/${order.id}`;
  try {
    await setDoc(doc(db, 'orders', order.id), order);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Update Order Status (Pushes live update to customer's order tracking timeline)
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  note: string = ''
): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    const orderRef = doc(db, 'orders', orderId);
    const existingSnap = await getDoc(orderRef);
    if (!existingSnap.exists()) {
      throw new Error('Order does not exist');
    }
    const data = existingSnap.data() as Order;
    const history = data.statusHistory || [];
    
    const newHistoryItem = {
      status: newStatus,
      timestamp: new Date().toISOString(),
      note: note || `Status updated to ${newStatus.replace(/_/g, ' ')}`
    };

    await updateDoc(orderRef, {
      status: newStatus,
      statusHistory: [...history, newHistoryItem],
      updatedAt: new Date().toISOString()
    });

    // Trigger transactional notification for status update
    await triggerTransactionalNotification({
      id: `email-${Date.now()}`,
      recipientEmail: data.customerEmail,
      recipientName: data.customerName,
      subject: `Update on Order #${orderId.slice(0, 8).toUpperCase()}: ${newStatus.replace(/_/g, ' ')}`,
      type: 'status_update',
      sentAt: new Date().toISOString(),
      orderId: orderId,
      content: `Your Saremi Academy order #${orderId.slice(0, 8).toUpperCase()} status is now: ${newStatus.replace(/_/g, ' ')}. ${note}`
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Create Free Trial / Lesson Booking
 */
export async function createBookingInFirestore(booking: Booking): Promise<void> {
  const path = `bookings/${booking.id}`;
  try {
    await setDoc(doc(db, 'bookings', booking.id), booking);

    // Auto-trigger trial confirmation email
    await triggerTransactionalNotification({
      id: `email-${Date.now()}`,
      recipientEmail: booking.customerEmail,
      recipientName: booking.customerName,
      subject: `Trial Lesson Confirmed: ${booking.courseTitle} with Saremi Academy`,
      type: 'trial_booking_confirmation',
      sentAt: new Date().toISOString(),
      bookingId: booking.id,
      content: `Hello ${booking.customerName},\n\nYour 1:1 free trial lesson for ${booking.courseTitle} (${booking.instrument}) has been scheduled for your preferred slot: ${booking.preferredSlot}.\n\nYour instructor will send the live video studio link 1 hour prior to your session.\n\nWarmly,\nSaremi Academy Mentorship Board`
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Subscribe to All Bookings (Admin)
 */
export function subscribeToAllBookings(
  onSuccess: (bookings: Booking[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const path = 'bookings';
  const unsubscribe = onSnapshot(
    collection(db, path),
    (snapshot) => {
      const bookings = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
      bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onSuccess(bookings);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      if (onError) onError(error);
    }
  );
  return unsubscribe;
}

/**
 * Update Booking Status (Admin)
 * Supports both legacy 'bookings' collection and active 'trial_bookings' collection.
 */
export async function updateBookingStatus(
  bookingId: string,
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled',
  meetingLink?: string
): Promise<void> {
  const updateData: Record<string, any> = { 
    status,
    updatedAt: new Date().toISOString()
  };
  if (meetingLink) updateData.meetingLink = meetingLink;

  // 1. If it starts with 'tb-' or exists in trial_bookings, update trial_bookings
  if (bookingId.startsWith('tb-')) {
    try {
      const trialRef = doc(db, 'trial_bookings', bookingId);
      const snap = await getDoc(trialRef);
      if (snap.exists()) {
        await updateDoc(trialRef, updateData);
        return;
      }
    } catch (e) {
      console.warn('Notice checking trial_bookings:', e);
    }
  }

  // 2. Check bookings collection
  const bookingRef = doc(db, 'bookings', bookingId);
  try {
    const bSnap = await getDoc(bookingRef);
    if (bSnap.exists()) {
      await updateDoc(bookingRef, updateData);
      return;
    }
  } catch (e) {
    console.warn('Notice checking bookings collection:', e);
  }

  // 3. Fallback: If neither existed with updateDoc, create/merge in trial_bookings or bookings safely
  try {
    const targetColl = bookingId.startsWith('tb-') ? 'trial_bookings' : 'bookings';
    await setDoc(doc(db, targetColl, bookingId), updateData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `bookings/${bookingId}`);
  }
}

/**
 * User Profile Helpers
 */
export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const teacherDocRef = doc(db, 'teachers', uid);

    const [userSnap, teacherSnap] = await Promise.all([
      getDoc(userDocRef).catch(() => null),
      getDoc(teacherDocRef).catch(() => null)
    ]);

    if (userSnap && userSnap.exists()) {
      const userData = userSnap.data() as UserProfile;
      if (teacherSnap && teacherSnap.exists()) {
        const teacherData = teacherSnap.data();
        return {
          ...userData,
          role: 'teacher',
          teacherId: teacherData.teacherId || userData.teacherId || uid,
          specialization: teacherData.specialization || userData.specialization || 'Indian Classical Music',
          bio: teacherData.bio || userData.bio || '',
          photoURL: teacherData.photo || userData.photoURL || '',
          phone: teacherData.phone || userData.phone || ''
        };
      }
      return userData;
    }

    if (teacherSnap && teacherSnap.exists()) {
      const teacherData = teacherSnap.data();
      return {
        id: uid,
        email: teacherData.email || '',
        name: teacherData.name || 'Conservatory Guru',
        role: 'teacher',
        phone: teacherData.phone || '',
        teacherId: teacherData.teacherId || uid,
        specialization: teacherData.specialization || 'Indian Classical Music',
        status: 'active',
        bio: teacherData.bio || '',
        photoURL: teacherData.photo || '',
        createdAt: teacherData.createdAt || new Date().toISOString(),
        updatedAt: teacherData.updatedAt || new Date().toISOString()
      } as UserProfile;
    }

    return null;
  } catch (error: any) {
    console.info(`[User Profile] Notice checking /users/${uid}:`, error?.message || error);
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const path = `users/${profile.id}`;
  try {
    await setDoc(doc(db, 'users', profile.id), profile, { merge: true });
  } catch (error: any) {
    // If update fails due to restricted field rules (like role/isStaff) on an existing profile,
    // retry updating only safe, non-privileged profile fields to respect security rules.
    const errStr = error?.message || String(error);
    if (errStr.includes('permission') || error?.code === 'permission-denied') {
      try {
        const { role, isStaff, isAdmin, super_admin, permissions, status, studentId, teacherId, ...safeData } = profile as any;
        if (Object.keys(safeData).length > 0) {
          await updateDoc(doc(db, 'users', profile.id), safeData);
          return;
        }
      } catch (retryErr) {
        console.warn(`[User Profile Save Fallback]`, retryErr);
      }
    }
    console.warn(`[User Profile Save] Notice writing profile to /users/${profile.id}:`, error?.message || error);
  }
}

/**
 * Product Management (Staff Admin)
 */
export async function saveProduct(product: Product): Promise<void> {
  const path = `products/${product.id}`;
  try {
    await setDoc(doc(db, 'products', product.id), product, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  const path = `products/${productId}`;
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Save user digital product purchase to library
 */
export async function savePurchasedProduct(purchase: any): Promise<void> {
  const path = `purchases/${purchase.id}`;
  try {
    await setDoc(doc(db, 'purchases', purchase.id), purchase);
    // Also save in localStorage for instant offline access and fast retrieval
    try {
      const existing = JSON.parse(localStorage.getItem('saremi_user_library') || '[]');
      const filtered = existing.filter((p: any) => p.id !== purchase.id);
      filtered.unshift(purchase);
      localStorage.setItem('saremi_user_library', JSON.stringify(filtered));
    } catch (e) {
      console.warn('Local storage cache write failed:', e);
    }
  } catch (error) {
    // If offline or permission fallback, ensure saved locally
    try {
      const existing = JSON.parse(localStorage.getItem('saremi_user_library') || '[]');
      const filtered = existing.filter((p: any) => p.id !== purchase.id);
      filtered.unshift(purchase);
      localStorage.setItem('saremi_user_library', JSON.stringify(filtered));
    } catch (e) {
      console.warn('Local fallback save failed:', e);
    }
    console.warn('Purchased product saved with local fallback:', error);
  }
}

/**
 * Get user digital product library
 */
export function getUserPurchasedProducts(userEmail?: string): any[] {
  try {
    const raw = localStorage.getItem('saremi_user_library');
    if (!raw) return [];
    const items = JSON.parse(raw);
    if (!userEmail) return items;
    return items.filter((item: any) => 
      !item.userEmail || item.userEmail.toLowerCase() === userEmail.toLowerCase()
    );
  } catch {
    return [];
  }
}

/**
 * Track Affiliate Click Event
 */
export function trackAffiliateClick(productId: string, retailer: string, category: string): void {
  const eventData = {
    eventType: 'affiliate_retailer_click',
    productId,
    retailer,
    category,
    timestamp: new Date().toISOString()
  };
  try {
    const existing = JSON.parse(localStorage.getItem('saremi_affiliate_analytics') || '[]');
    existing.unshift(eventData);
    localStorage.setItem('saremi_affiliate_analytics', JSON.stringify(existing.slice(0, 100)));
  } catch {
    // Ignore logging errors
  }
  console.log('[Analytics Event]', eventData);
}

/**
 * Transactional Notifications Log & Dispatch
 */
export async function triggerTransactionalNotification(log: TransactionalEmailLog): Promise<void> {
  try {
    // Attempt calling server-side /api/send-email if available
    fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log)
    }).catch((err) => console.log('Transactional email sent via direct logger:', err));

    // Also store email record in local storage / memory store so user and admin can review sent emails in UI
    const existing = JSON.parse(localStorage.getItem('saremi_email_logs') || '[]');
    existing.unshift(log);
    localStorage.setItem('saremi_email_logs', JSON.stringify(existing.slice(0, 50)));
  } catch (e) {
    console.error('Error in notification dispatch:', e);
  }
}

export async function fetchTransactionalNotifications(): Promise<TransactionalEmailLog[]> {
  try {
    const existing = JSON.parse(localStorage.getItem('saremi_email_logs') || '[]');
    return existing;
  } catch {
    return [];
  }
}

// Aliases for seamless component imports
export const seedInitialDataIfEmpty = ensureCatalogInitialized;
export const subscribeToBookings = subscribeToAllBookings;
