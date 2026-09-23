import { useRef, TouchEvent } from 'react';

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  minDistance?: number;
}

export function useSwipeGesture({ onSwipeLeft, onSwipeRight, minDistance = 50 }: SwipeOptions) {
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (e.changedTouches.length === 1) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const deltaX = touchEndX - touchStartX.current;
      const deltaY = touchEndY - touchStartY.current;

      // Ensure horizontal swipe is dominant over vertical scroll
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) >= minDistance) {
        if (deltaX < 0) {
          onSwipeLeft?.();
        } else {
          onSwipeRight?.();
        }
      }
    }
  };

  return {
    onTouchStart,
    onTouchEnd,
  };
}
