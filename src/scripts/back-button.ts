/* ==========================================
   BACK BUTTON (404 page)
========================================== */

export function initBackButton(): void {
  const backButton = document.getElementById('back-btn');
  if (!backButton) return;

  backButton.addEventListener('click', () => history.back());
}
