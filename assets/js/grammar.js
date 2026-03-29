// assets/js/grammar.js — акордеон для граматичних правил

document.addEventListener('DOMContentLoaded', () => {
  const headers = document.querySelectorAll('.tense-header');

  headers.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const body     = document.getElementById(targetId);
      if (!body) return;

      const isOpen = btn.getAttribute('aria-expanded') === 'true';

      // Закриваємо всі (один відкритий за раз)
      headers.forEach(h => {
        h.setAttribute('aria-expanded', 'false');
        const b = document.getElementById(h.dataset.target);
        if (b) b.hidden = true;
      });

      // Якщо був закритий — відкриваємо
      if (!isOpen) {
        btn.setAttribute('aria-expanded', 'true');
        body.hidden = false;

        // Плавний скрол до картки
        const card = btn.closest('.tense-card');
        setTimeout(() => {
          card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
      }
    });
  });
});
