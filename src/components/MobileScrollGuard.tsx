import { useEffect } from 'react';

/**
 * MobileScrollGuard: proactively fixes accidental scroll locking on mobile
 * - Ensures html/body can scroll (removes overflow hidden/100vh locks)
 * - Re-runs on resize, orientation change, and visibility changes
 */
export const MobileScrollGuard = () => {
  useEffect(() => {
    const applyFix = () => {
      const html = document.documentElement as HTMLElement;
      const body = document.body as HTMLElement;

      // Remove inline overflow locks
      if (html.style.overflow === 'hidden') html.style.overflow = '';
      if (body.style.overflow === 'hidden') body.style.overflow = '';
      if (html.style.overflowY === 'hidden') html.style.overflowY = '';
      if (body.style.overflowY === 'hidden') body.style.overflowY = '';

      // Avoid hard locking the page height
      if (getComputedStyle(body).height === '100vh') body.style.height = '';

      // Ensure natural scrolling
      (html.style as any).webkitOverflowScrolling = 'touch';
      (body.style as any).webkitOverflowScrolling = 'touch';

      // Defensive: force-visible scrollbars if needed
      if (getComputedStyle(html).overflowY === 'hidden') html.style.overflowY = 'auto';
      if (getComputedStyle(body).overflowY === 'hidden') body.style.overflowY = 'auto';

      // Ensure touch actions are not disabled
      const styleEl = document.getElementById('mobile-scroll-guard') as HTMLStyleElement | null;
      const css = `html, body { touch-action: auto !important; overscroll-behavior-y: auto !important; }`;
      if (styleEl) {
        styleEl.textContent = css;
      } else {
        const s = document.createElement('style');
        s.id = 'mobile-scroll-guard';
        s.textContent = css;
        document.head.appendChild(s);
      }
    };

    // Run after paint to override any early locks
    requestAnimationFrame(() => applyFix());
    const onResize = () => applyFix();
    const onShow = () => applyFix();

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    document.addEventListener('visibilitychange', onShow);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      document.removeEventListener('visibilitychange', onShow);
    };
  }, []);

  return null;
};

export default MobileScrollGuard;
