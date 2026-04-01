// =========================================
// assets/js/words.js  —  Heavy English
// Логіка тренажера слів v2
// =========================================

// ── Стани (виводяться з quality) ─────────
// quality null  → 'new'
// quality 0     → 'weak'
// quality 1–2   → 'familiar'
// quality 3+    → 'known'

function qualityToState(q) {
  if (q === null || q === undefined) return 'new';
  if (q === 0)  return 'weak';
  if (q <= 2)   return 'familiar';
  return 'known';
}

// Cooldown: мінімум карток між показами одного слова
function getCooldown(q) {
  if (q === null || q === undefined) return 0;
  if (q === 0)  return 5;
  if (q === 1)  return 12;
  if (q === 2)  return 25;
  return 60 + (q - 3) * 20;
}

// Ваги для вибору групи
const WEIGHTS = {
  new: 4,
  weak: 5,
  familiar: 3,
  known: 0.5
};

const STORAGE_KEY   = 'wordsProgress';
const CARDIDX_KEY   = 'wordsCardIndex';

// ── Стан додатку ──────────────────────────
let allWords    = [];
let progress    = {};   // { "id": { quality, seen, seenAt } }
let cardIndex   = 0;    // лічильник карток
let currentWord = null;
let showEnglish = true;

// ── Рахунок сесії ─────────────────────────
// Кількість слів, що перейшли в статус "known" за поточну сесію.
// Живе лише в пам'яті — скидається при перезавантаженні сторінки.
let sessionScore = 0;

// ── DOM ───────────────────────────────────
const btnEn   = document.getElementById('btn-en');
const btnUa   = document.getElementById('btn-ua');
const enMode  = document.getElementById('en-mode');
const uaMode  = document.getElementById('ua-mode');

const toggleEn = document.getElementById('toggle-en');
const toggleUa = document.getElementById('toggle-ua');

const enTranslationBlock = document.getElementById('en-translation-block');
const enExamplesBlock    = document.getElementById('en-examples-block');
const uaTranslationBlock = document.getElementById('ua-translation-block');
const uaExamplesBlock    = document.getElementById('ua-examples-block');

const progressFill = document.getElementById('progress-fill');
const btnKnow      = document.getElementById('btn-know');
const btnDontKnow  = document.getElementById('btn-dont-know');
const wordCard     = document.getElementById('word-card');

const elWordEn          = document.getElementById('word-en');
const elWordUaMain      = document.getElementById('word-ua-main');
const elTranscription   = document.getElementById('word-transcription');
const elTranslationText = document.getElementById('word-ua');

const speakBtn   = document.getElementById('speak-btn');
const speakBtnUa = document.getElementById('speak-btn-ua');

const formsBlock = document.getElementById('word-forms-block');
const formPast   = document.getElementById('form-past');
const formPP     = document.getElementById('form-pp');

// Елементи лічильника в хедері
const elSessionScore = document.getElementById('session-score');
const elKnownRatio   = document.getElementById('known-ratio');

// ═══════════════════════════════════════════
//  ІНІЦІАЛІЗАЦІЯ
// ═══════════════════════════════════════════
async function init() {
  try {
    const res = await fetch('data/words.json');
    allWords  = await res.json();
  } catch (e) {
    console.error('Не вдалося завантажити words.json', e);
    return;
  }

  loadProgress();
  showNextWord();
  updateProgressBar();
  updateHeaderCounter();

  // Мова
  btnEn.addEventListener('click', () => setLang(true));
  btnUa.addEventListener('click', () => setLang(false));

  // Відповіді
  btnKnow.addEventListener('click',     () => handleAnswer(true));
  btnDontKnow.addEventListener('click', () => handleAnswer(false));

  // Тогглери
  toggleEn.addEventListener('change', () => {
    const v = toggleEn.checked;
    enTranslationBlock.classList.toggle('visible', v);
    enExamplesBlock.classList.toggle('visible', v);
    if (formsBlock && currentWord?.forms) {
      formsBlock.classList.toggle('visible', v);
    }
  });

  toggleUa.addEventListener('change', () => {
    const v = toggleUa.checked;
    uaTranslationBlock.classList.toggle('visible', v);
    uaExamplesBlock.classList.toggle('visible', v);
  });

  // Озвучення
  if (speakBtn)   speakBtn.addEventListener('click',   speakWord);
  if (speakBtnUa) speakBtnUa.addEventListener('click', speakWord);
}

// ═══════════════════════════════════════════
//  ПРОГРЕС — LocalStorage
// ═══════════════════════════════════════════
function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    progress  = raw ? JSON.parse(raw) : {};
  } catch { progress = {}; }

  const ci = localStorage.getItem(CARDIDX_KEY);
  cardIndex = ci ? parseInt(ci, 10) : 0;
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  localStorage.setItem(CARDIDX_KEY, String(cardIndex));
}

function getWordData(id) {
  return progress[id] ?? { quality: null, seen: 0, seenAt: -9999 };
}

// ═══════════════════════════════════════════
//  ЛІЧИЛЬНИК У ХЕДЕРІ
// ═══════════════════════════════════════════

/**
 * Повертає кількість слів з будь-яким позитивним прогресом (quality >= 1).
 * Тобто слова, на які хоча б раз натиснули Know.
 */
function countKnown() {
  let count = 0;

  for (const word of allWords) {
    const d = getWordData(word.id);
    if (qualityToState(d.quality) === 'known') count++;
  }

  return count;
}

/**
 * Оновлює відображення лічильника в хедері.
 * Формат: "+12 312/5000"  або  "312/5000" (якщо сесія порожня)
 */
function updateHeaderCounter() {
  if (!elKnownRatio || !allWords.length) return;

  const known = countKnown();
  const total = allWords.length;

  // Ratio
  elKnownRatio.textContent = `${known}/${total}`;

  // Session score
  if (elSessionScore) {
    if (sessionScore > 0) {
      elSessionScore.textContent = `+${sessionScore}`;
      elSessionScore.style.display = 'flex';
    } else {
      elSessionScore.style.display = 'none';
    }
  }
}

/**
 * Збільшує рахунок сесії та анімує його.
 */
function incrementSessionScore() {
  sessionScore++;

  if (!elSessionScore) return;

  // Якщо перше нарахування — показати з анімацією появи
  if (sessionScore === 1) {
    elSessionScore.textContent = `+${sessionScore}`;
    elSessionScore.style.display = 'flex';
    // Анімація вже в CSS через display:flex (scorePopIn)
  } else {
    // Bump-анімація при збільшенні
    elSessionScore.textContent = `+${sessionScore}`;
    elSessionScore.classList.remove('bump');
    // Форс-рефлоу щоб анімація спрацювала знову
    void elSessionScore.offsetWidth;
    elSessionScore.classList.add('bump');
  }
}

// ═══════════════════════════════════════════
//  ВИБІР НАСТУПНОГО СЛОВА
// ═══════════════════════════════════════════

function isEligible(word) {
  if (word.id === currentWord?.id) return false;
  const d = getWordData(word.id);
  if (cardIndex - d.seenAt < 2) return false;
  return (cardIndex - d.seenAt) >= getCooldown(d.quality);
}

function buildGroups() {
  const groups = { new: [], weak: [], familiar: [], known: [] };

  for (const word of allWords) {
    if (!isEligible(word)) continue;
    const state = qualityToState(getWordData(word.id).quality);
    groups[state].push(word);
  }

  const total = Object.values(groups).reduce((s, g) => s + g.length, 0);
  if (total === 0) {
    for (const word of allWords) {
      if (word.id === currentWord?.id) continue;
      const state = qualityToState(getWordData(word.id).quality);
      groups[state].push(word);
    }
  }

  return groups;
}

function pickGroup(groups) {
  const available = Object.entries(WEIGHTS)
    .filter(([state]) => groups[state].length > 0)
    .map(([state, weight]) => ({ state, weight }));

  if (!available.length) return null;

  const total = available.reduce((s, g) => s + g.weight, 0);
  let rand    = Math.random() * total;

  for (const { state, weight } of available) {
    rand -= weight;
    if (rand <= 0) return state;
  }
  return available[available.length - 1].state;
}

function pickNextWord() {
  const groups = buildGroups();
  const state  = pickGroup(groups);
  if (!state || !groups[state].length) return null;

  const pool = groups[state];
  return pool[Math.floor(Math.random() * pool.length)];
}

// ═══════════════════════════════════════════
//  ПОКАЗ СЛОВА
// ═══════════════════════════════════════════
function showNextWord() {
  const word = pickNextWord();
  if (!word) return;

  currentWord = word;
  cardIndex++;
  renderWord(word);
}

function renderWord(word) {
  elWordEn.textContent          = word.en;
  elTranscription.textContent   = word.transcription;
  elTranslationText.textContent = word.ua;
  elWordUaMain.textContent      = word.ua;

  const uaTransText = uaTranslationBlock.querySelector('.word-translation-text');
  const uaTransIPA  = uaTranslationBlock.querySelector('.word-transcription');
  if (uaTransText) uaTransText.textContent = word.en;
  if (uaTransIPA)  uaTransIPA.textContent  = word.transcription;

  if (formsBlock) {
    if (word.forms && (word.forms.past || word.forms.v3)) {
      if (formPast) formPast.textContent = word.forms.past ? `Past: ${word.forms.past}` : '';
      if (formPP)   formPP.textContent   = word.forms.v3   ? `V3: ${word.forms.v3}`     : '';
    } else {
      if (formPast) formPast.textContent = '';
      if (formPP)   formPP.textContent   = '';
    }
  }

  fillExamples(enExamplesBlock, word);
  fillExamples(uaExamplesBlock, word);

  resetToggles();
  applyLangView();
  updateProgressBar();
}

function fillExamples(block, word) {
  const items = block.querySelectorAll('.example-item');
  word.examples.forEach((ex, i) => {
    if (items[i]) items[i].innerHTML = highlightWord(ex, word.en);
  });
}

function highlightWord(sentence, word) {
  const re = new RegExp(`\\b(${escapeRegex(word)})\\b`, 'gi');
  return sentence.replace(re, '<strong>$1</strong>');
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ═══════════════════════════════════════════
//  ВІДПОВІДЬ — головна логіка
// ═══════════════════════════════════════════
function handleAnswer(knew) {
  if (!currentWord) return;

  const id = currentWord.id;
  const d  = getWordData(id);
  const q  = d.quality;

  // 🧠 Запам'ятали попередній стан
  const prevState = qualityToState(q);

  // ═══════════════════════════════
  //  ЛОГІКА KNOW / DON'T KNOW
  // ═══════════════════════════════
  if (knew) {
    // 🟢 Нове слово → одразу known
    if (q === null) {
      d.quality = 5;
    }
    // 🟡 Після помилки → поступове навчання
    else if (q === 0) {
      d.quality = 1;
    }
    else if (q === 1 || q === 2) {
      d.quality = q + 1;
    }
    else {
      d.quality = Math.min(q + 1, 5);
    }
  } else {
    // ❌ DON'T KNOW
    if (q === null || q <= 2) {
      d.quality = 0;
    } else {
      d.quality = 2; // якщо було known → не в нуль, а назад у навчання
    }
  }

  // ═══════════════════════════════
  //  ОНОВЛЕННЯ ДАНИХ
  // ═══════════════════════════════
  d.seen   = (d.seen || 0) + 1;
  d.seenAt = cardIndex;

  progress[id] = d;
  saveProgress();

  // 🧠 Новий стан після зміни
  const newState = qualityToState(d.quality);

  // ✅ Session score тільки якщо стало known
  if (newState === 'known' && prevState !== 'known') {
    incrementSessionScore();
  }

  // 🔄 Оновлюємо UI
  updateHeaderCounter();

  animateCard(knew);
}

// ═══════════════════════════════════════════
//  ПРОГРЕС-БАР
// ═══════════════════════════════════════════
function updateProgressBar() {
  if (!allWords.length || !progressFill) return;
  const known = countKnown();
  progressFill.style.width = Math.round((known / allWords.length) * 100) + '%';
}

// ═══════════════════════════════════════════
//  МОВА
// ═══════════════════════════════════════════
function setLang(isEnglish) {
  showEnglish = isEnglish;
  btnEn.classList.toggle('active', isEnglish);
  btnEn.setAttribute('aria-pressed', String(isEnglish));
  btnUa.classList.toggle('active', !isEnglish);
  btnUa.setAttribute('aria-pressed', String(!isEnglish));
  applyLangView();
}

function applyLangView() {
  enMode.style.display = showEnglish ? '' : 'none';
  uaMode.style.display = showEnglish ? 'none' : '';
  resetToggles();
}

// ═══════════════════════════════════════════
//  ТОГГЛ
// ═══════════════════════════════════════════
function resetToggles() {
  toggleEn.checked = false;
  toggleUa.checked = false;
  enTranslationBlock.classList.remove('visible');
  enExamplesBlock.classList.remove('visible');
  uaTranslationBlock.classList.remove('visible');
  uaExamplesBlock.classList.remove('visible');
  if (formsBlock) formsBlock.classList.remove('visible');
}

// ═══════════════════════════════════════════
//  АНІМАЦІЯ
// ═══════════════════════════════════════════
function animateCard(knew) {
  const dx = knew ? '60px' : '-60px';

  wordCard.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
  wordCard.style.opacity    = '0';
  wordCard.style.transform  = `translateX(${dx})`;

  setTimeout(() => {
    wordCard.style.transition = 'none';
    wordCard.style.opacity    = '0';
    wordCard.style.transform  = `translateX(${knew ? '-60px' : '60px'})`;

    showNextWord();

    requestAnimationFrame(() => requestAnimationFrame(() => {
      wordCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      wordCard.style.opacity    = '1';
      wordCard.style.transform  = 'translateX(0)';
    }));
  }, 270);
}

// ═══════════════════════════════════════════
//  ОЗВУЧЕННЯ
// ═══════════════════════════════════════════
function speakWord() {
  if (!currentWord) return;
  const u = new SpeechSynthesisUtterance(currentWord.en);
  u.lang  = 'en-US';
  u.rate  = 0.95;
  u.pitch = 1;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

// ── Старт ─────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
