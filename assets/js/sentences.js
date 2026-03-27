// =========================================
// assets/js/sentences.js  —  Heavy English
// =========================================

const RULES = {
  'present-simple-affirmative':             'Subject + V1  (he/she/it → V + s/es)',
  'present-simple-negative':                'Subject + do/does + not + V1',
  'present-simple-question':                'Do/Does + subject + V1?',
  'present-continuous-affirmative':         'Subject + am/is/are + V-ing',
  'present-continuous-negative':            'Subject + am/is/are + not + V-ing',
  'present-continuous-question':            'Am/Is/Are + subject + V-ing?',
  'present-perfect-affirmative':            'Subject + have/has + V3',
  'present-perfect-negative':               'Subject + have/has + not + V3',
  'present-perfect-question':               'Have/Has + subject + V3?',
  'present-perfect-continuous-affirmative': 'Subject + have/has + been + V-ing',
  'present-perfect-continuous-negative':    'Subject + have/has + not + been + V-ing',
  'present-perfect-continuous-question':    'Have/Has + subject + been + V-ing?',
  'past-simple-affirmative':                'Subject + V2 (past form)',
  'past-simple-negative':                   'Subject + did not + V1',
  'past-simple-question':                   'Did + subject + V1?',
  'past-continuous-affirmative':            'Subject + was/were + V-ing',
  'past-continuous-negative':               'Subject + was/were + not + V-ing',
  'past-continuous-question':               'Was/Were + subject + V-ing?',
  'past-perfect-affirmative':               'Subject + had + V3',
  'past-perfect-negative':                  'Subject + had + not + V3',
  'past-perfect-question':                  'Had + subject + V3?',
  'future-simple-affirmative':              'Subject + will + V1',
  'future-simple-negative':                 'Subject + will + not + V1',
  'future-simple-question':                 'Will + subject + V1?',
  'future-continuous-affirmative':          'Subject + will + be + V-ing',
  'future-continuous-negative':             'Subject + will + not + be + V-ing',
  'future-continuous-question':             'Will + subject + be + V-ing?',
  'future-perfect-affirmative':             'Subject + will + have + V3',
  'future-perfect-negative':                'Subject + will + not + have + V3',
  'future-perfect-question':                'Will + subject + have + V3?',
};

// Мотиваційні фрази при правильній відповіді
const CORRECT_PHRASES = [
  'Amazing! 🎉', 'Perfect!', 'Awesome! 🔥', 'Nailed it!',
  'Brilliant!', 'Spot on! ✓', 'Great job!', 'Excellent!',
  'Well done!', 'Keep it up! 💪', 'Superb!', 'You got it!',
];

const DISTRACTORS = [
  'the','a','an','to','of','in','on','at','by','for','with','from','up','out',
  'is','are','was','were','be','been','being','have','has','had',
  'do','does','did','can','could','would','should','may','might',
  'very','always','never','often','just','already','still','here','there','soon',
  'good','bad','big','new','old','my','your','her','his','their','its',
  'some','this','that','more','him','them','it','us',
  'not','too','also','even','back','ever','only','much','well',
];

const CAT_MAP = {
  general:'general', habits:'general', hobbies:'general', leisure:'general',
  sports:'general',  social:'general', nature:'general',  food:'general',
  skills:'general',  shopping:'general',
  work:'work', travel:'travel', school:'school', home:'home',
};

const SEEN_KEY   = 'sentencesSeen';
const SEEN_LIMIT = 40;

let allSentences    = [];
let seenIds         = [];
let currentSentence = null;
let selectedWords   = [];
let selectedIndexes = [];
let currentWordBank = [];
let autoSpeak       = false;
let feedbackTimer   = null;

const filters = {
  time:     new Set(['present','past','future']),
  type:     new Set(['simple','continuous']),
  form:     new Set(['affirmative','negative','question']),
  category: new Set(['general','work','travel','school','home']),
};

// ═══════════════════════════════════════════
//  ІНІЦІАЛІЗАЦІЯ
// ═══════════════════════════════════════════
async function init() {
  try {
    const res = await fetch('data/sentences.json');
    allSentences = await res.json();
  } catch (e) {
    console.error('Cannot load sentences.json', e);
    return;
  }

  try {
    const raw = localStorage.getItem(SEEN_KEY);
    seenIds = raw ? JSON.parse(raw) : [];
  } catch { seenIds = []; }

  setupFilters();
  nextSentence();

  document.getElementById('btn-next').addEventListener('click',  () => animateCard(nextSentence));
  document.getElementById('btn-clear').addEventListener('click', () => { clearSel(); renderAnswer(); renderWordBank(); clearFeedback(); });
  document.getElementById('btn-check').addEventListener('click', checkAnswer);
  document.getElementById('speak-btn').addEventListener('click', speakSentence);

  // Drawer
  document.getElementById('menu-btn').addEventListener('click',     () => setDrawer(true));
  document.getElementById('drawer-close').addEventListener('click',  () => setDrawer(false));
  document.getElementById('drawer-overlay').addEventListener('click',() => setDrawer(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setDrawer(false); });

  // Visibility switches
  bindSwitch('toggle-rule',          'rule-block');
  bindSwitch('toggle-sentence-type', 'sentence-type-block');
  bindSwitch('toggle-scale',         'tense-scale-block');

  // Auto-speak switch
  const autoSpeakEl = document.getElementById('toggle-autospeak');
  if (autoSpeakEl) {
    autoSpeakEl.addEventListener('change', () => { autoSpeak = autoSpeakEl.checked; });
  }
}

function bindSwitch(id, targetId) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('change', () => {
    document.getElementById(targetId)?.classList.toggle('is-hidden', !el.checked);
  });
}

// ═══════════════════════════════════════════
//  ФІЛЬТРИ
// ═══════════════════════════════════════════
function setupFilters() {
  document.querySelectorAll('[data-filter-group]').forEach(block => {
    const group = block.dataset.filterGroup;
    if (!filters[group]) return;
    block.addEventListener('change', e => handleFilterChange(group, e.target, block));
  });
}

function handleFilterChange(group, input, block) {
  const inputs    = Array.from(block.querySelectorAll('input[type="checkbox"]'));
  const allInput  = inputs.find(i => i.value === 'all');
  const valueInps = inputs.filter(i => i.value !== 'all');

  if (input.value === 'all') {
    valueInps.forEach(i => i.checked = input.checked);
  } else if (!input.checked && allInput) {
    allInput.checked = false;
  }
  if (!valueInps.some(i => i.checked)) valueInps.forEach(i => i.checked = true);
  if (allInput) allInput.checked = valueInps.every(i => i.checked);

  filters[group] = new Set(valueInps.filter(i => i.checked).map(i => i.value));
  animateCard(nextSentence);
}

// ═══════════════════════════════════════════
//  ВИБІР РЕЧЕННЯ
// ═══════════════════════════════════════════
function getPool() {
  return allSentences.filter(s =>
    filters.time.has(s.tense_time)
    && filters.type.has(s.tense_type)
    && filters.form.has(s.form)
    && filters.category.has(CAT_MAP[s.category] ?? 'general')
  );
}

function nextSentence() {
  const pool = getPool();
  if (!pool.length) { showEmpty(); return; }

  let candidates = pool.filter(s => !seenIds.includes(s.id));
  if (!candidates.length) { seenIds = []; candidates = pool; }
  if (currentSentence && candidates.length > 1) {
    candidates = candidates.filter(s => s.id !== currentSentence.id);
  }

  const sentence = candidates[Math.floor(Math.random() * candidates.length)];
  currentSentence = sentence;

  seenIds = [sentence.id, ...seenIds].slice(0, SEEN_LIMIT);
  try { localStorage.setItem(SEEN_KEY, JSON.stringify(seenIds)); } catch {}

  clearSel();
  clearFeedback();
  renderSentence();
}

// ═══════════════════════════════════════════
//  РЕНДЕР
// ═══════════════════════════════════════════
function renderSentence() {
  const s = currentSentence;
  if (!s) return;

  document.getElementById('sentence-type-text').textContent = genTypeLabel(s);

  const ruleKey = `${s.tense_time}-${s.tense_type}-${s.form}`;
  document.getElementById('rule-text').textContent = RULES[ruleKey] ?? '';

  document.getElementById('ua-sentence-text').textContent = s.ua;

  updateScale(s);

  currentWordBank = buildWordBank(s);
  renderAnswer();
  renderWordBank();
}

function genTypeLabel(s) {
  const T = { present:'Present', past:'Past', future:'Future' };
  const Y = { simple:'Simple', continuous:'Continuous', perfect:'Perfect', 'perfect-continuous':'Perfect Continuous' };
  const F = { affirmative:'Affirmative', negative:'Negative', question:'Question' };
  // Формат: "Present Simple, Affirmative"
  return `${T[s.tense_time]||s.tense_time} ${Y[s.tense_type]||s.tense_type}, ${F[s.form]||s.form}`;
}

function updateScale(s) {
  const POS = { past:'8%', present:'50%', future:'92%' };
  const SYM = { affirmative:'✓', negative:'✕', question:'?' };
  const ind = document.getElementById('tense-scale-indicator');
  if (!ind) return;
  ind.style.left   = POS[s.tense_time] ?? '50%';
  ind.textContent  = SYM[s.form] ?? '✓';
  ind.className    = `tense-scale-indicator tense-form-${s.form}`;
}

// ═══════════════════════════════════════════
//  WORD BANK
// ═══════════════════════════════════════════
function buildWordBank(s) {
  const answer   = getAnswerWords(s.en);
  const minSlots = Math.max(9, Math.ceil(answer.length / 3) * 3);
  const needed   = minSlots - answer.length;

  const answerLow  = new Set(answer.map(w => w.toLowerCase()));
  const pool       = shuffleArr(DISTRACTORS.filter(d => !answerLow.has(d.toLowerCase())));
  const distractors = pool.slice(0, needed);

  while (answer.length + distractors.length < 9) {
    distractors.push(DISTRACTORS[Math.floor(Math.random() * DISTRACTORS.length)]);
  }
  return shuffleArr([...answer, ...distractors]);
}

function getAnswerWords(en) {
  return en.split(' ').map(w => w.replace(/[.!?,;:]+$/, '')).filter(Boolean);
}

function shuffleArr(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ═══════════════════════════════════════════
//  RENDER ANSWER & WORD BANK
// ═══════════════════════════════════════════
function renderAnswer() {
  const preview = document.getElementById('answer-preview');
  preview.classList.remove('is-correct', 'is-wrong');
  if (!selectedWords.length) {
    preview.innerHTML = '<span class="answer-placeholder">Tap words below to build the sentence</span>';
    return;
  }
  let words = [...selectedWords];

  if (currentSentence?.form === 'question' && words.length) {
    words[words.length - 1] += '?';
  }

  preview.innerHTML = words
    .map(w => `<span class="answer-token">${escHtml(w)}</span>`)
    .join('');
}

function renderWordBank() {
  const bank = document.getElementById('word-bank');
  bank.innerHTML = currentWordBank.map((word, i) => {
    const used = selectedIndexes.includes(i) ? ' is-used' : '';
    return `<button class="word-chip${used}" type="button" data-index="${i}">${escHtml(word)}</button>`;
  }).join('');
  bank.querySelectorAll('.word-chip').forEach(chip => {
    chip.addEventListener('click', () => toggleWord(Number(chip.dataset.index)));
  });
}

function toggleWord(index) {
  // Якщо вже є результат перевірки — ігноруємо кліки
  const preview = document.getElementById('answer-preview');
  if (preview.classList.contains('is-correct')) return;

  const pos = selectedIndexes.indexOf(index);
  if (pos >= 0) {
    selectedIndexes.splice(pos, 1);
    selectedWords.splice(pos, 1);
  } else {
    selectedIndexes.push(index);
    selectedWords.push(currentWordBank[index]);
  }
  renderAnswer();
  renderWordBank();
  // Знімаємо фідбек при зміні відповіді
  if (preview.classList.contains('is-wrong')) {
    preview.classList.remove('is-wrong');
    clearFeedback();
  }
}

// ═══════════════════════════════════════════
//  ПЕРЕВІРКА
// ═══════════════════════════════════════════
function checkAnswer() {
  if (!currentSentence || !selectedWords.length) return;

  const answer    = getAnswerWords(currentSentence.en);

  // якщо питання — додаємо ? до останнього слова
  let userAnswer = [...selectedWords];
  if (currentSentence.form === 'question' && userAnswer.length) {
    userAnswer[userAnswer.length - 1] += '?';
  }

  const isCorrect = arrEq(selectedWords, answer);

  const preview = document.getElementById('answer-preview');
  preview.classList.remove('is-correct', 'is-wrong');
  preview.classList.add(isCorrect ? 'is-correct' : 'is-wrong');

  document.querySelectorAll('.word-chip').forEach(chip => {
    chip.classList.remove('is-correct', 'is-wrong');
    if (selectedIndexes.includes(Number(chip.dataset.index))) {
      chip.classList.add(isCorrect ? 'is-correct' : 'is-wrong');
    }
  });

  showFeedback(isCorrect, answer);

  if (isCorrect) {
    if (autoSpeak) {
      // Спочатку озвучуємо — потім переходимо
      speakSentence(() => {
        feedbackTimer = setTimeout(() => animateCard(nextSentence), 500);
      });
    } else {
      feedbackTimer = setTimeout(() => animateCard(nextSentence), 1200);
    }
  }
}

function showFeedback(isCorrect, answer) {
  const el = document.getElementById('sent-feedback');
  if (!el) return;

  clearFeedback();

  if (isCorrect) {
    const phrase = CORRECT_PHRASES[Math.floor(Math.random() * CORRECT_PHRASES.length)];
    el.textContent = phrase;
    el.className   = 'sent-feedback is-correct';
  } else {
    // Показуємо правильне речення
    el.textContent = '→ ' + answer.join(' ');
    el.className   = 'sent-feedback is-wrong';
  }
}

function clearFeedback() {
  if (feedbackTimer) { clearTimeout(feedbackTimer); feedbackTimer = null; }
  const el = document.getElementById('sent-feedback');
  if (el) { el.textContent = ''; el.className = 'sent-feedback'; }
}

function arrEq(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

// ═══════════════════════════════════════════
//  ОЧИСТИТИ
// ═══════════════════════════════════════════
function clearSel() {
  selectedWords   = [];
  selectedIndexes = [];
}

// ═══════════════════════════════════════════
//  ГУЧНОМОВЕЦЬ
// ═══════════════════════════════════════════
function speakSentence(onEnd) {
  if (!currentSentence) { if (onEnd) onEnd(); return; }
  const u  = new SpeechSynthesisUtterance(currentSentence.en);
  u.lang   = 'en-US';
  u.rate   = 0.92;
  u.pitch  = 1;
  if (onEnd) u.onend = onEnd;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

// ═══════════════════════════════════════════
//  DRAWER
// ═══════════════════════════════════════════
function setDrawer(open) {
  document.getElementById('settings-drawer').classList.toggle('open', open);
  document.getElementById('drawer-overlay').hidden = !open;
  document.getElementById('menu-btn').setAttribute('aria-expanded', String(open));
}

// ═══════════════════════════════════════════
//  ПОРОЖНІЙ СТАН
// ═══════════════════════════════════════════
function showEmpty() {
  document.getElementById('sentence-type-text').textContent = 'No sentences found';
  document.getElementById('ua-sentence-text').textContent   = 'Change filters in the menu ↗';
  document.getElementById('rule-text').textContent          = '';
  document.getElementById('word-bank').innerHTML            = '';
  clearSel();
  clearFeedback();
  renderAnswer();
}

// ═══════════════════════════════════════════
//  АНІМАЦІЯ
// ═══════════════════════════════════════════
function animateCard(callback) {
  const card = document.getElementById('sentence-card');
  card.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
  card.style.opacity    = '0';
  card.style.transform  = 'translateX(24px)';

  setTimeout(() => {
    callback();
    card.style.transition = 'none';
    card.style.opacity    = '0';
    card.style.transform  = 'translateX(-24px)';

    requestAnimationFrame(() => requestAnimationFrame(() => {
      card.style.transition = 'opacity 0.28s ease, transform 0.28s ease';
      card.style.opacity    = '1';
      card.style.transform  = 'translateX(0)';
    }));
  }, 230);
}

// ── Helpers ──
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

document.addEventListener('DOMContentLoaded', init);
