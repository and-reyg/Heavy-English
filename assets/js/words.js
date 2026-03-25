// =========================================
// assets/js/words.js
// Повна логіка тренажера слів — Heavy English
// =========================================

// ── Константи станів ──────────────────────
const STATES = {
  NEW:      'new',
  WEAK:     'weak',
  FAMILIAR: 'familiar',
  KNOWN:    'known'
};

// Ваги для вибору групи (чим більше — тим частіше)
const WEIGHTS = {
  [STATES.NEW]:      3,
  [STATES.WEAK]:     5,
  [STATES.FAMILIAR]: 2,
  [STATES.KNOWN]:    1
};

const STORAGE_KEY  = 'wordsProgress';
const RECENT_LIMIT = 5;

// ── Стан додатку ──────────────────────────
let allWords    = [];
let progress    = {};
let recentIds   = [];
let currentWord = null;
let showEnglish = true;

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
const speakBtn          = document.getElementById('speak-btn');
const speakBtnUa        = document.getElementById('speak-btn-ua');
const elTranslationText = document.getElementById('word-ua');

// ═══════════════════════════════════════════
//  ІНІЦІАЛІЗАЦІЯ
// ═══════════════════════════════════════════
async function init() {
  try {
    const res = await fetch('data/words.json');
    speakBtn.addEventListener('click', speakWord);
    speakBtnUa.addEventListener('click', speakWord);
    allWords  = await res.json();
  } catch (e) {
    console.error('Не вдалося завантажити words.json', e);
    return;
  }

  loadProgress();
  showNextWord();
  updateProgressBar();

  btnEn.addEventListener('click',       () => setLang(true));
  btnUa.addEventListener('click',       () => setLang(false));
  btnKnow.addEventListener('click',     () => handleAnswer(true));
  btnDontKnow.addEventListener('click', () => handleAnswer(false));

  toggleEn.addEventListener('change', () => {
    const v = toggleEn.checked;
    enTranslationBlock.classList.toggle('visible', v);
    enExamplesBlock.classList.toggle('visible', v);
  });

  toggleUa.addEventListener('change', () => {
    const v = toggleUa.checked;
    uaTranslationBlock.classList.toggle('visible', v);
    uaExamplesBlock.classList.toggle('visible', v);
  });
}

// ═══════════════════════════════════════════
//  ПРОГРЕС — LocalStorage
// ═══════════════════════════════════════════
function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    progress  = raw ? JSON.parse(raw) : {};
  } catch {
    progress = {};
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function getWordProgress(id) {
  return progress[id] ?? { state: STATES.NEW, seen: 0, lastSeen: null };
}

// ═══════════════════════════════════════════
//  ВИБІР НАСТУПНОГО СЛОВА
// ═══════════════════════════════════════════
function groupWords() {
  const groups = {
    [STATES.NEW]:      [],
    [STATES.WEAK]:     [],
    [STATES.FAMILIAR]: [],
    [STATES.KNOWN]:    []
  };
  for (const word of allWords) {
    const state = getWordProgress(word.id).state ?? STATES.NEW;
    groups[state].push(word);
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

function pickFromGroup(words) {
  const filtered = words.filter(w => !recentIds.includes(w.id));
  const pool     = filtered.length > 0 ? filtered : words;
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickNextWord() {
  const groups = groupWords();
  const state  = pickGroup(groups);
  if (!state) return null;
  return pickFromGroup(groups[state]);
}

// ═══════════════════════════════════════════
//  РЕНДЕР СЛОВА
// ═══════════════════════════════════════════
function showNextWord() {
  const word = pickNextWord();
  if (!word) return;

  currentWord = word;
  recentIds   = [word.id, ...recentIds].slice(0, RECENT_LIMIT);
  renderWord(word);
}

function renderWord(word) {
  // EN картка
  elWordEn.textContent          = word.en;
  elTranscription.textContent   = word.transcription;
  elTranslationText.textContent = word.ua;

  // UA картка
  elWordUaMain.textContent = word.ua;

  const uaTransText = uaTranslationBlock.querySelector('.word-translation-text');
  const uaTransIPA  = uaTranslationBlock.querySelector('.word-transcription');
  if (uaTransText) uaTransText.textContent = word.en;
  if (uaTransIPA)  uaTransIPA.textContent  = word.transcription;

  // Приклади — EN блок
  const enItems = enExamplesBlock.querySelectorAll('.example-item');
  word.examples.forEach((ex, i) => {
    if (enItems[i]) enItems[i].innerHTML = highlightWord(ex, word.en);
  });

  // Приклади — UA блок
  const uaItems = uaExamplesBlock.querySelectorAll('.example-item');
  word.examples.forEach((ex, i) => {
    if (uaItems[i]) uaItems[i].innerHTML = highlightWord(ex, word.en);
  });

  updateProgressBar();
  resetToggles();
  applyLangView();
}

function highlightWord(sentence, word) {
  const re = new RegExp(`\\b(${escapeRegex(word)})\\b`, 'gi');
  return sentence.replace(re, '<strong>$1</strong>');
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ═══════════════════════════════════════════
//  ВІДПОВІДЬ КОРИСТУВАЧА
// ═══════════════════════════════════════════
function handleAnswer(knew) {
  if (!currentWord) return;

  const id = currentWord.id;
  const p  = getWordProgress(id);

  p.state   = knew ? nextStateKnow(p.state) : STATES.WEAK;
  p.seen    = (p.seen || 0) + 1;
  p.lastSeen = Date.now();

  progress[id] = p;
  saveProgress();
  animateCard(knew);
}

function nextStateKnow(state) {
  const order = [STATES.NEW, STATES.WEAK, STATES.FAMILIAR, STATES.KNOWN];
  const idx   = order.indexOf(state);
  return order[Math.min(idx + 1, order.length - 1)];
}

// ═══════════════════════════════════════════
//  ПРОГРЕС-БАР
// ═══════════════════════════════════════════
function updateProgressBar() {
  if (!allWords.length || !progressFill) return;
  const known = Object.values(progress).filter(p => p.state === STATES.KNOWN).length;
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
//  ТОГГЛЕР
// ═══════════════════════════════════════════
function resetToggles() {
  toggleEn.checked = false;
  toggleUa.checked = false;
  enTranslationBlock.classList.remove('visible');
  enExamplesBlock.classList.remove('visible');
  uaTranslationBlock.classList.remove('visible');
  uaExamplesBlock.classList.remove('visible');
}

// ═══════════════════════════════════════════
//  АНІМАЦІЯ
// ═══════════════════════════════════════════
function animateCard(knew) {
  const dx = knew ? '60px' : '-60px';

  wordCard.style.transition = 'opacity 0.28s ease, transform 0.28s ease';
  wordCard.style.opacity    = '0';
  wordCard.style.transform  = `translateX(${dx})`;

  setTimeout(() => {
    wordCard.style.transition = 'none';
    wordCard.style.opacity    = '0';
    wordCard.style.transform  = `translateX(${knew ? '-60px' : '60px'})`;

    showNextWord();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        wordCard.style.transition = 'opacity 0.32s ease, transform 0.32s ease';
        wordCard.style.opacity    = '1';
        wordCard.style.transform  = 'translateX(0)';
      });
    });
  }, 300);
}

// ── Старт ─────────────────────────────────
document.addEventListener('DOMContentLoaded', init);

// говоріння слова
function speakWord() {
  if (!currentWord) return;

  const utterance = new SpeechSynthesisUtterance(currentWord.en);

  // англійська вимова
  utterance.lang = 'en-US';

  // (опціонально) швидкість / тон
  utterance.rate = 1;
  utterance.pitch = 1;

  speechSynthesis.cancel(); // зупиняє попереднє
  speechSynthesis.speak(utterance);
}