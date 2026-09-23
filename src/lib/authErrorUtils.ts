/**
 * Helper to translate Firebase Authentication error codes into friendly, actionable messages.
 */
export function getFriendlyAuthErrorMessage(err: any): string {
  if (!err) return 'An unexpected error occurred. Please try again.';

  const code = err.code || '';
  const message = err.message || '';

  if (code === 'auth/operation-not-allowed') {
    return 'Email/Password sign-in is currently not enabled in your Firebase Authentication Console. Please enable "Email/Password" under Firebase Console -> Build -> Authentication -> Sign-in method.';
  }

  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found'
  ) {
    return 'Invalid email or password. Please verify your credentials or use the reset link.';
  }

  if (
    code === 'auth/email-already-in-use' ||
    message.includes('EMAIL_EXISTS') ||
    code.includes('EMAIL_EXISTS')
  ) {
    return 'An account with this email address already exists. Please verify the email or provide a new address.';
  }

  if (code === 'auth/weak-password') {
    return 'Password is too weak. Please use at least 6 characters.';
  }

  if (code === 'auth/invalid-email') {
    return 'Please provide a valid email address.';
  }

  if (code === 'auth/user-disabled') {
    return 'This account has been disabled. Please contact SaReMi Academy administration.';
  }

  if (code === 'auth/too-many-requests') {
    return 'Access to this account has been temporarily disabled due to many failed login attempts. Please try again later.';
  }

  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Sign-in popup was dismissed before completing.';
  }

  return message || 'Authentication failed. Please verify your details and try again.';
}
