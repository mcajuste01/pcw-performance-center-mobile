import { useState, useRef, useCallback } from "react";

/**
 * Simple pull-to-refresh hook for mobile.
 * Returns { containerRef, isRefreshing, pullDistance } — attach containerRef to
 * the scrollable container element.
 */
export function usePullToRefresh(onRefresh) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(null);
  const containerRef = useRef(null);

  const onTouchStart = useCallback((e) => {
    const el = containerRef.current;
    if (!el) return;
    if (el.scrollTop > 0) return; // only trigger at top
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchMove = useCallback((e) => {
    if (startY.current === null) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      setPullDistance(Math.min(delta, 80));
    }
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (pullDistance >= 60 && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
    startY.current = null;
  }, [pullDistance, isRefreshing, onRefresh]);

  const handlers = { onTouchStart, onTouchMove, onTouchEnd };

  return { containerRef, isRefreshing, pullDistance, handlers };
}