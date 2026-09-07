/* ==========================================
   HEADER & MOBILE NAVIGATION
========================================== */

export function initHeader(): void {
  const header = document.getElementById('site-header');
  const nav = document.querySelector<HTMLElement>('nav');
  const menuToggle = document.getElementById('menu-toggle');
  const navMenu = document.getElementById('primary-menu');
  const scrollThreshold = 50;

  /**
   * Scroll Handling (Consolidated)
   */
  const handleScroll = (): void => {
    const scrolled = window.scrollY > scrollThreshold;
    if (header) header.classList.toggle('scrolled', scrolled);
    if (nav) nav.classList.toggle('scrolled', scrolled);
  };

  /**
   * Toggle Hamburger Menu
   */
  const toggleMenu = (force?: boolean): void => {
    if (!menuToggle || !navMenu) return;

    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    const shouldOpen = typeof force === 'boolean' ? force : !expanded;

    menuToggle.setAttribute('aria-expanded', String(shouldOpen));
    navMenu.toggleAttribute('hidden', !shouldOpen);
    navMenu.classList.toggle('active', shouldOpen);
    menuToggle.classList.toggle('open', shouldOpen);

    if (shouldOpen) {
      document.addEventListener('click', outsideClickListener);
    } else {
      document.removeEventListener('click', outsideClickListener);
    }
  };

  const outsideClickListener = (e: Event): void => {
    const target = e.target as Node;
    if (!navMenu?.contains(target) && !menuToggle?.contains(target)) {
      toggleMenu(false);
    }
  };

  /**
   * Smooth Anchor Scroll
   */
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e: MouseEvent) => {
      const target = document.querySelector<HTMLElement>(link.hash);
      if (!target) return;

      e.preventDefault();
      target.setAttribute('tabindex', '-1');
      target.scrollIntoView({ behavior: 'smooth' });
      target.focus({ preventScroll: true });

      if (navMenu?.classList.contains('active')) {
        toggleMenu(false);
      }
    });
  });

  /**
   * Event Listeners & Init
   */
  menuToggle?.addEventListener('click', () => toggleMenu());

  // Passive listener allows the browser to scroll smoothly without waiting for JS execution
  window.addEventListener('scroll', handleScroll, { passive: true });

  // Execute immediately on load to catch current scroll position
  handleScroll();
}
