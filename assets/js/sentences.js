// =========================================
// assets/js/sentences.js
// Логіка сторінки речень
// =========================================

document.addEventListener('DOMContentLoaded', () => {

  const btnEn  = document.getElementById('btn-en');
  const btnUa  = document.getElementById('btn-ua');
  const enMode = document.getElementById('en-mode');
  const uaMode = document.getElementById('ua-mode');

  const toggleEn = document.getElementById('toggle-en');
  const toggleUa = document.getElementById('toggle-ua');

  const enTranslationBlock = document.getElementById('en-translation-block');
  const enContextBlock     = document.getElementById('en-context-block');

  const uaTranslationBlock = document.getElementById('ua-translation-block');
  const uaContextBlock     = document.getElementById('ua-context-block');

  const sentenceCard   = document.getElementById('sentence-card');
  const btnKnow        = document.getElementById('btn-know');
  const btnDontKnow    = document.getElementById('btn-dont-know');

  // ── Перемикання мови ──
  function setLang(lang) {
    if (lang === 'en') {
      btnEn.classList.add('active');
      btnEn.setAttribute('aria-pressed', 'true');
      btnUa.classList.remove('active');
      btnUa.setAttribute('aria-pressed', 'false');
      enMode.style.display = '';
      uaMode.style.display = 'none';
    } else {
      btnUa.classList.add('active');
      btnUa.setAttribute('aria-pressed', 'true');
      btnEn.classList.remove('active');
      btnEn.setAttribute('aria-pressed', 'false');
      uaMode.style.display = '';
      enMode.style.display = 'none';
    }
    resetToggles();
  }

  btnEn.addEventListener('click', () => setLang('en'));
  btnUa.addEventListener('click', () => setLang('ua'));

  // ── Тогглери ──
  toggleEn.addEventListener('change', () => {
    const show = toggleEn.checked;
    enTranslationBlock.classList.toggle('visible', show);
    enContextBlock.classList.toggle('visible', show);
  });

  toggleUa.addEventListener('change', () => {
    const show = toggleUa.checked;
    uaTranslationBlock.classList.toggle('visible', show);
    uaContextBlock.classList.toggle('visible', show);
  });

  function resetToggles() {
    toggleEn.checked = false;
    toggleUa.checked = false;
    enTranslationBlock.classList.remove('visible');
    enContextBlock.classList.remove('visible');
    uaTranslationBlock.classList.remove('visible');
    uaContextBlock.classList.remove('visible');
  }

  // ── Анімація карток ──
  function animateCard(direction) {
    const dx = direction === 'know' ? '60px' : '-60px';
    sentenceCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    sentenceCard.style.opacity = '0';
    sentenceCard.style.transform = `translateX(${dx})`;

    setTimeout(() => {
      sentenceCard.style.transition = 'none';
      sentenceCard.style.opacity = '0';
      sentenceCard.style.transform = `translateX(${direction === 'know' ? '-60px' : '60px'})`;
      resetToggles();

      // ← тут JS буде підставляти наступне речення

      requestAnimationFrame(() => {
        sentenceCard.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
        sentenceCard.style.opacity = '1';
        sentenceCard.style.transform = 'translateX(0)';
      });
    }, 320);
  }

  btnKnow.addEventListener('click', () => animateCard('know'));
  btnDontKnow.addEventListener('click', () => animateCard('dontknow'));

});
