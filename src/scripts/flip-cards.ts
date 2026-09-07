/* ==========================================
   FLIP CARDS
========================================== */

export function initFlipCards(): void {
  const cards = document.querySelectorAll<HTMLElement>('.flip-card');

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      const inner = card.querySelector<HTMLElement>('.flip-card-inner');
      if (inner) {
        inner.classList.toggle('flipped');
      }
    });
  });
}
