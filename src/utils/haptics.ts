/**
 * Haptic Feedback Utilities using Web Vibration API (`navigator.vibrate`).
 * Provides subtle tactile feedback for mobile touch interactions.
 */

export type HapticPattern = 
  | 'light'        // Subtle navigation click (10ms)
  | 'medium'       // Button press, toggle (20ms)
  | 'heavy'        // Important action like starting live class (35ms)
  | 'success'      // Double pulse for booking/submission complete ([15, 40, 20]ms)
  | 'warning'      // Double pulse ([30, 50, 30]ms)
  | 'selection';   // Micro tap for tab / key selection (6ms)

export const triggerHaptic = (pattern: HapticPattern = 'light'): void => {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) {
    return;
  }

  try {
    switch (pattern) {
      case 'selection':
        navigator.vibrate(6);
        break;
      case 'light':
        navigator.vibrate(12);
        break;
      case 'medium':
        navigator.vibrate(22);
        break;
      case 'heavy':
        navigator.vibrate(38);
        break;
      case 'success':
        navigator.vibrate([15, 40, 25]);
        break;
      case 'warning':
        navigator.vibrate([30, 50, 30]);
        break;
      default:
        navigator.vibrate(15);
    }
  } catch (err) {
    // Ignore permissions or browser policy errors gracefully
  }
};
