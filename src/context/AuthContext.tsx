import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { auth, googleProvider, db } from '@/src/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import {
  fetchUserProfile,
  saveUserProfile,
  ADMIN_EMAIL,
  isStaffAdmin
} from '@/src/lib/firestoreService';
import { UserProfile, Role, ShippingAddress, NotificationPreferences } from '@/src/types';
import { connectStudentIdentityToTrial } from '@/src/lib/courseCrmService';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isProfileReady: boolean;
  profileSyncError: string | null;
  role: Role;
  isAdmin: boolean;
  requiresPasswordChange: boolean;
  switchActiveRole: (newRole: Role) => void;
  signInWithGoogle: () => Promise<any>;
  signInWithEmail: (e: string, p: string) => Promise<any>;
  signUpWithEmail: (e: string, p: string, name: string, phone?: string) => Promise<any>;
  sendResetEmail: (email: string) => Promise<void>;
  completePasswordChange: (newPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserContact: (name: string, phone: string) => Promise<void>;
  updateStudentProfile: (partial: Partial<UserProfile>) => Promise<void>;
  saveAddress: (address: ShippingAddress) => Promise<void>;
  updateNotifications: (prefs: NotificationPreferences) => Promise<void>;
  refreshProfile: () => Promise<void>;
  retryProfileSync: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileReady, setIsProfileReady] = useState(false);
  const [profileSyncError, setProfileSyncError] = useState<string | null>(null);

  // Source of truth for role: Real Firestore user profile document or bootstrapped super admin email.
  // Users can never manually spoof or simulate roles.
  const calculatedRole: Role = (() => {
    if (user?.email === ADMIN_EMAIL) return 'super_admin';
    if (profile?.role) return profile.role as Role;
    if (user) return 'student';
    return 'visitor';
  })();

  const isAdmin = calculatedRole === 'admin' || calculatedRole === 'super_admin' || user?.email === ADMIN_EMAIL;

  // Manual role switching is prohibited per system RBAC requirements
  const switchActiveRole = (_newRole: Role) => {
    console.warn('Manual role override is prohibited in production RBAC mode. Using verified profile role.');
  };

  /**
   * Authoritative First-Login Bootstrap Flow:
   * AUTHENTICATION COMPLETE
   * ↓
   * CHECK /users/{uid}
   * ↓
   * IF MISSING -> CREATE OWN MINIMUM PROFILE (/users/{request.auth.uid})
   * ↓
   * RESOLVE ROLE
   */
  const syncProfile = async (firebaseUser: User, extraData?: { phone?: string }): Promise<UserProfile | null> => {
    // 1. Check existing /users/{uid} and /teachers/{uid} documents
    const existing = await fetchUserProfile(firebaseUser.uid);

    if (!existing) {
      // 2. Check if user is an existing teacher registered under teachers collection
      let teacherDocData: any = null;
      try {
        const teacherSnap = await getDoc(doc(db, 'teachers', firebaseUser.uid));
        if (teacherSnap.exists()) {
          teacherDocData = teacherSnap.data();
        } else if (firebaseUser.email) {
          const teachersQuery = query(
            collection(db, 'teachers'),
            where('email', '==', firebaseUser.email.toLowerCase())
          );
          const qSnap = await getDocs(teachersQuery);
          if (!qSnap.empty) {
            teacherDocData = qSnap.docs[0].data();
          }
        }
      } catch (tErr) {
        console.warn('[Teacher Lookup Note]', tErr);
      }

      if (teacherDocData) {
        const teacherProfile: UserProfile = {
          id: firebaseUser.uid,
          email: firebaseUser.email || teacherDocData.email || '',
          name: teacherDocData.name || firebaseUser.displayName || 'Faculty Guru',
          role: 'teacher',
          phone: teacherDocData.phone || extraData?.phone || '',
          teacherId: teacherDocData.teacherId || `SM-TEA-${Date.now().toString().slice(-4)}`,
          specialization: teacherDocData.specialization || 'Indian Classical Music',
          status: 'active',
          bio: teacherDocData.bio || '',
          photoURL: teacherDocData.photo || firebaseUser.photoURL || '',
          notificationPreferences: {
            marketingEmails: false,
            transactionalEmails: true,
            smsAlerts: true
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await saveUserProfile(teacherProfile).catch((err) => console.warn('Teacher user profile bootstrap note:', err));
        setProfile(teacherProfile);
        return teacherProfile;
      }

      // 3. Create own minimum student profile for first-time login
      const minimumProfile: UserProfile = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || 'Learner',
        role: 'student', // Standard safe role allowed by firestore.rules
        phone: extraData?.phone || firebaseUser.phoneNumber || '',
        photoURL: firebaseUser.photoURL || '',
        bio: '',
        preferredInstrument: 'vocals',
        skillLevel: 'Beginner',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
        purchasedCourses: [],
        subscriptionStatus: {
          active: false,
          classesRemaining: 0,
          totalClasses: 0
        },
        classes: [],
        attendance: [],
        progress: [],
        enrolledCourses: [],
        savedAddresses: [],
        notificationPreferences: {
          marketingEmails: true,
          transactionalEmails: true,
          smsAlerts: true
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await saveUserProfile(minimumProfile);
      setProfile(minimumProfile);
      return minimumProfile;
    } else {
      // Existing profile: preserve authoritative database fields and roles
      let activeProfile = { ...existing };

      // If existing profile has a teacher record in /teachers/{uid}, ensure role remains 'teacher'
      try {
        const teacherSnap = await getDoc(doc(db, 'teachers', firebaseUser.uid));
        if (teacherSnap.exists()) {
          const tData = teacherSnap.data();
          activeProfile = {
            ...activeProfile,
            role: 'teacher',
            teacherId: tData.teacherId || activeProfile.teacherId || firebaseUser.uid,
            specialization: tData.specialization || activeProfile.specialization || 'Indian Classical Music'
          };
        }
      } catch (tErr) {
        console.warn('Notice checking teacher status on sync:', tErr);
      }

      if (extraData?.phone && !activeProfile.phone) {
        activeProfile.phone = extraData.phone;
        await saveUserProfile(activeProfile).catch((err) => console.warn('Notice saving phone:', err));
      }
      setProfile(activeProfile);

      // Connect any prior trial bookings to this student user identity
      if (firebaseUser.email && activeProfile.role === 'student') {
        connectStudentIdentityToTrial(
          firebaseUser.email,
          firebaseUser.uid,
          firebaseUser.displayName || activeProfile.name,
          activeProfile.phone || extraData?.phone
        ).catch((err) => console.warn('Notice syncing trial identity:', err));
      }

      return activeProfile;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setProfileSyncError(null);

      if (currentUser) {
        try {
          const synced = await syncProfile(currentUser);
          setUser(currentUser);
          setProfile(synced);
          setIsProfileReady(true);
        } catch (err: any) {
          console.warn('[Profile Bootstrap Notice] Sync failed, retry available:', err?.message || err);
          setUser(currentUser);
          setProfile(null);
          setIsProfileReady(false);
          setProfileSyncError('Unable to load your profile. Please check your connection.');
        }
      } else {
        setUser(null);
        setProfile(null);
        setIsProfileReady(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const retryProfileSync = async () => {
    if (!auth.currentUser) return;
    setProfileSyncError(null);
    setLoading(true);
    try {
      const synced = await syncProfile(auth.currentUser);
      if (synced) {
        setUser(auth.currentUser);
        setProfile(synced);
        setIsProfileReady(true);
      }
    } catch (err: any) {
      console.warn('Profile retry notice:', err?.message || err);
      setProfileSyncError('Unable to load profile. Please verify your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred.user) {
        return await syncProfile(cred.user);
      }
      return null;
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // Normal user action: dismissed or closed popup window
        console.info('Google sign-in popup dismissed by user.');
        return null;
      }
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      return await syncProfile(cred.user);
    }
    return null;
  };

  const signUpWithEmail = async (email: string, pass: string, name: string, phone?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: name });
      return await syncProfile(cred.user, { phone });
    }
    return null;
  };

  const sendResetEmail = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const completePasswordChange = async (newPassword: string) => {
    if (!user) throw new Error('No active authenticated session.');
    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters.');
    }

    // 1. Update password in Firebase Authentication
    await updatePassword(user, newPassword);

    // 2. Persist updated security flag in user profile
    if (profile) {
      const updated: UserProfile = {
        ...profile,
        requiresPasswordChange: false,
        updatedAt: new Date().toISOString()
      };
      await saveUserProfile(updated);
      setProfile(updated);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user || !user.email) throw new Error('No active authenticated session.');
    if (!currentPassword) throw new Error('Current password is required.');
    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters.');
    }

    // Reauthenticate with current credential
    const cred = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, cred);

    // Update password
    await updatePassword(user, newPassword);

    // If requiresPasswordChange was set, clear it
    if (profile?.requiresPasswordChange) {
      const updated: UserProfile = {
        ...profile,
        requiresPasswordChange: false,
        updatedAt: new Date().toISOString()
      };
      await saveUserProfile(updated);
      setProfile(updated);
    }
  };

  const logout = async () => {
    await fbSignOut(auth);
    setUser(null);
    setProfile(null);
  };

  const updateUserContact = async (name: string, phone: string) => {
    if (!user || !profile) return;
    const updated: UserProfile = {
      ...profile,
      name,
      phone,
      updatedAt: new Date().toISOString()
    };
    await saveUserProfile(updated);
    setProfile(updated);
    if (user && name !== user.displayName) {
      await updateProfile(user, { displayName: name });
    }
  };

  const updateStudentProfile = async (partial: Partial<UserProfile>) => {
    if (!profile) return;
    const updated: UserProfile = {
      ...profile,
      ...partial,
      id: profile.id, // Ensure unique ID cannot be changed
      email: profile.email, // Ensure email remains stable
      updatedAt: new Date().toISOString()
    };
    await saveUserProfile(updated);
    setProfile(updated);
    if (user && partial.name && partial.name !== user.displayName) {
      await updateProfile(user, { displayName: partial.name });
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await syncProfile(user);
    }
  };

  const saveAddress = async (address: ShippingAddress) => {
    if (!profile) return;
    const current = profile.savedAddresses || [];
    const updated: UserProfile = {
      ...profile,
      savedAddresses: [address, ...current.filter((a) => a.line1 !== address.line1)],
      updatedAt: new Date().toISOString()
    };
    await saveUserProfile(updated);
    setProfile(updated);
  };

  const updateNotifications = async (prefs: NotificationPreferences) => {
    if (!profile) return;
    const updated: UserProfile = {
      ...profile,
      notificationPreferences: {
        ...prefs,
        transactionalEmails: true // Mandatory per requirements
      },
      updatedAt: new Date().toISOString()
    };
    await saveUserProfile(updated);
    setProfile(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isProfileReady,
        profileSyncError,
        role: calculatedRole,
        isAdmin,
        requiresPasswordChange: !!profile?.requiresPasswordChange,
        switchActiveRole,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        sendResetEmail,
        completePasswordChange,
        changePassword,
        logout,
        updateUserContact,
        updateStudentProfile,
        saveAddress,
        updateNotifications,
        refreshProfile,
        retryProfileSync
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
