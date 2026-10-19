/** Smooth scrolling unless the user asked the OS to reduce motion (CSS `scroll-behavior` does not cover JS scrolling). */
export function scrollBehavior(): ScrollBehavior {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'auto';
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}
