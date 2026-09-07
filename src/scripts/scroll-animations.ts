/* ==========================================
   SCROLL ANIMATIONS
========================================== */

export function initScrollAnimations(): void {
  const scrollElements = document.querySelectorAll<HTMLElement>('.scroll-animation');

  // Exit early if no elements are found on the page
  if (scrollElements.length === 0) return;

  const observerOptions: IntersectionObserverInit = { threshold: 0.2 };

  const scrollObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        (entry.target as HTMLElement).classList.add('appear');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  scrollElements.forEach((el) => scrollObserver.observe(el));

  /**
   * Force appear on load for elements already in viewport
   */
  const forceAppearOnLoad = (): void => {
    scrollElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.8 && !el.classList.contains('appear')) {
        el.classList.add('appear');
        scrollObserver.unobserve(el);
      }
    });
  };

  // Run once on initialization
  forceAppearOnLoad();

  /**
   * Debounced resize handler to improve performance
   */
  let resizeTimeout: number | undefined;
  window.addEventListener('resize', () => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout(forceAppearOnLoad, 150);
  });
}
