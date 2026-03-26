// =========================================
// assets/js/sentences.js
// Sentence generator mockup interactions
// =========================================

const sentenceSamples = [
  {
    id: 1,
    time: 'present',
    type: 'simple',
    form: 'affirmative',
    category: 'work',
    situation: 'office',
    mode: 'easy',
    typeLabel: 'Present Simple Affirmative',
    rule: 'Subject + base verb (V1) / verb + -s/-es for he, she, it',
    ua: 'Я працюю в офісі.',
    answer: ['I', 'work', 'in', 'an', 'office'],
    wordBank: ['I', 'office', 'in', 'work', 'am', 'an', 'the', 'is', 'are']
  },
  {
    id: 2,
    time: 'present',
    type: 'continuous',
    form: 'question',
    category: 'home',
    situation: 'cleaning',
    mode: 'easy-plus',
    typeLabel: 'Present Continuous Question',
    rule: 'Am / Is / Are + subject + verb-ing?',
    ua: 'Ти зараз прибираєш кімнату?',
    answer: ['Are', 'you', 'cleaning', 'the', 'room', 'now'],
    wordBank: ['room', 'you', 'Are', 'cleaning', 'the', 'now', 'is', 'do', 'room?']
  },
  {
    id: 3,
    time: 'past',
    type: 'simple',
    form: 'negative',
    category: 'travel',
    situation: 'airport',
    mode: 'easy',
    typeLabel: 'Past Simple Negative',
    rule: 'Subject + did not + base verb',
    ua: 'Ми не запізнилися в аеропорт.',
    answer: ['We', 'did', 'not', 'arrive', 'late', 'at', 'the', 'airport'],
    wordBank: ['arrive', 'late', 'We', 'airport', 'did', 'at', 'not', 'the', 'were']
  },
  {
    id: 4,
    time: 'future',
    type: 'simple',
    form: 'affirmative',
    category: 'school',
    situation: 'exam',
    mode: 'easy',
    typeLabel: 'Future Simple Affirmative',
    rule: 'Subject + will + base verb',
    ua: 'Вона складе іспит завтра.',
    answer: ['She', 'will', 'pass', 'the', 'exam', 'tomorrow'],
    wordBank: ['pass', 'the', 'She', 'exam', 'will', 'tomorrow', 'is', 'a', 'passes']
  },
  {
    id: 5,
    time: 'present',
    type: 'perfect',
    form: 'affirmative',
    category: 'general',
    situation: 'daily-life',
    mode: 'easy-plus',
    typeLabel: 'Present Perfect Affirmative',
    rule: 'Subject + have / has + V3',
    ua: 'Я вже закінчив цю книгу.',
    answer: ['I', 'have', 'already', 'finished', 'this', 'book'],
    wordBank: ['I', 'book', 'already', 'have', 'finished', 'this', 'am', 'finish', 'has']
  },
  {
    id: 6,
    time: 'future',
    type: 'perfect-continuous',
    form: 'question',
    category: 'work',
    situation: 'meeting',
    mode: 'easy-plus',
    typeLabel: 'Future Perfect Continuous Question',
    rule: 'Will + subject + have been + verb-ing ... ?',
    ua: 'Ти будеш працювати над цим проєктом уже дві години?',
    answer: ['Will', 'you', 'have', 'been', 'working', 'on', 'this', 'project', 'for', 'two', 'hours'],
    wordBank: ['you', 'Will', 'project', 'have', 'for', 'been', 'working', 'this', 'on', 'two', 'hours', 'are']
  },
  {
    id: 7,
    time: 'past',
    type: 'continuous',
    form: 'affirmative',
    category: 'travel',
    situation: 'train',
    mode: 'easy',
    typeLabel: 'Past Continuous Affirmative',
    rule: 'Subject + was / were + verb-ing',
    ua: 'Ми їхали потягом увечері.',
    answer: ['We', 'were', 'traveling', 'by', 'train', 'in', 'the', 'evening'],
    wordBank: ['by', 'train', 'We', 'traveling', 'the', 'in', 'were', 'evening', 'did']
  },
  {
    id: 8,
    time: 'present',
    type: 'simple',
    form: 'question',
    category: 'school',
    situation: 'classroom',
    mode: 'easy',
    typeLabel: 'Present Simple Question',
    rule: 'Do / Does + subject + base verb?',
    ua: 'Ти часто читаєш у класі?',
    answer: ['Do', 'you', 'often', 'read', 'in', 'class'],
    wordBank: ['often', 'read', 'Do', 'in', 'class', 'you', 'does', 'are', 'reads']
  }
];

const categorySituations = {
  general: ['daily-life'],
  work: ['office', 'meeting'],
  travel: ['airport', 'train'],
  school: ['exam', 'classroom'],
  home: ['cleaning']
};

const state = {
  currentIndex: 0,
  currentSentence: null,
  selectedWords: [],
  selectedIndexes: [],
  filters: {
    time: new Set(['present', 'past', 'future']),
    type: new Set(['simple', 'continuous', 'perfect', 'perfect-continuous']),
    form: new Set(['affirmative', 'negative', 'question']),
    category: new Set(['general', 'work', 'travel', 'school', 'home']),
    situation: new Set(),
    mode: new Set(['easy', 'easy-plus'])
  }
};

const timelinePositions = {
  past: '8%',
  present: '50%',
  future: '92%'
};

const formSymbols = {
  affirmative: '✓',
  negative: '✕',
  question: '?'
};

document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.getElementById('menu-btn');
  const drawer = document.getElementById('settings-drawer');
  const drawerClose = document.getElementById('drawer-close');
  const overlay = document.getElementById('drawer-overlay');

  const sentenceBuilder = document.getElementById('sentence-builder');
  const sentenceTypeBlock = document.getElementById('sentence-type-block');
  const sentenceTypeText = document.getElementById('sentence-type-text');
  const tenseScaleBlock = document.getElementById('tense-scale-block');
  const tenseIndicator = document.getElementById('tense-scale-indicator');
  const ruleBlock = document.getElementById('rule-block');
  const ruleText = document.getElementById('rule-text');
  const uaSentenceText = document.getElementById('ua-sentence-text');
  const answerPreview = document.getElementById('answer-preview');
  const wordBank = document.getElementById('word-bank');

  const btnNext = document.getElementById('btn-next');
  const btnClear = document.getElementById('btn-clear');
  const btnCheck = document.getElementById('btn-check');

  const toggleRule = document.getElementById('toggle-rule');
  const toggleSentenceType = document.getElementById('toggle-sentence-type');
  const toggleScale = document.getElementById('toggle-scale');
  const situationOptions = document.getElementById('situation-options');

  buildSituationOptions();
  bindFilterBlocks();
  syncSituationFilters();
  renderMatchingSentence(true);

  menuBtn.addEventListener('click', () => setDrawer(true));
  drawerClose.addEventListener('click', () => setDrawer(false));
  overlay.addEventListener('click', () => setDrawer(false));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setDrawer(false);
    }
  });

  toggleRule.addEventListener('change', () => {
    ruleBlock.classList.toggle('is-hidden', !toggleRule.checked);
  });

  toggleSentenceType.addEventListener('change', () => {
    sentenceTypeBlock.classList.toggle('is-hidden', !toggleSentenceType.checked);
  });

  toggleScale.addEventListener('change', () => {
    tenseScaleBlock.classList.toggle('is-hidden', !toggleScale.checked);
  });

  btnNext.addEventListener('click', () => {
    animateBuilder(() => renderMatchingSentence(false));
  });

  btnClear.addEventListener('click', () => {
    clearSelection();
    renderAnswer();
    renderWordBank();
  });

  btnCheck.addEventListener('click', () => {
    if (!state.currentSentence) {
      return;
    }

    const isCorrect = arraysEqual(state.selectedWords, state.currentSentence.answer);
    answerPreview.classList.remove('is-correct', 'is-wrong');
    answerPreview.classList.add(isCorrect ? 'is-correct' : 'is-wrong');

    document.querySelectorAll('.word-chip').forEach((chip, index) => {
      chip.classList.remove('is-correct', 'is-wrong');

      if (state.selectedIndexes.includes(index)) {
        chip.classList.add(isCorrect ? 'is-correct' : 'is-wrong');
      }
    });
  });

  function setDrawer(isOpen) {
    drawer.classList.toggle('open', isOpen);
    overlay.hidden = !isOpen;
    menuBtn.setAttribute('aria-expanded', String(isOpen));
  }

  function buildSituationOptions() {
    const labels = {
      'daily-life': 'Daily life',
      office: 'Office',
      meeting: 'Meeting',
      airport: 'Airport',
      train: 'Train',
      exam: 'Exam',
      classroom: 'Classroom',
      cleaning: 'Cleaning'
    };

    const allSituations = Object.values(categorySituations).flat();

    situationOptions.innerHTML = [
      createChipMarkup('all', 'All', true),
      ...allSituations.map((value) => createChipMarkup(value, labels[value], true))
    ].join('');
  }

  function createChipMarkup(value, label, checked) {
    return `
      <label class="option-chip">
        <input type="checkbox" value="${value}" ${checked ? 'checked' : ''} />
        <span>${label}</span>
      </label>
    `;
  }

  function bindFilterBlocks() {
    document.querySelectorAll('[data-filter-group]').forEach((block) => {
      const groupName = block.dataset.filterGroup;
      block.addEventListener('change', (event) => {
        const input = event.target;
        if (!(input instanceof HTMLInputElement)) {
          return;
        }

        handleFilterChange(groupName, input, block);
        if (groupName === 'category') {
          syncSituationFilters();
        }
        if (groupName === 'situation') {
          normalizeAllCheckbox(block);
        }
        renderMatchingSentence(true);
      });
    });
  }

  function handleFilterChange(groupName, changedInput, block) {
    const inputs = Array.from(block.querySelectorAll('input[type="checkbox"]'));
    const allInput = inputs.find((input) => input.value === 'all');
    const valueInputs = inputs.filter((input) => input.value !== 'all' && !input.disabled);

    if (changedInput.value === 'all') {
      valueInputs.forEach((input) => {
        input.checked = changedInput.checked;
      });
    } else if (!changedInput.checked && allInput) {
      allInput.checked = false;
    }

    const checkedCount = valueInputs.filter((input) => input.checked).length;
    if (checkedCount === 0) {
      valueInputs.forEach((input) => {
        input.checked = true;
      });
    }

    if (allInput) {
      allInput.checked = valueInputs.every((input) => input.checked);
    }

    state.filters[groupName] = new Set(
      valueInputs.filter((input) => input.checked).map((input) => input.value)
    );
  }

  function syncSituationFilters() {
    const enabledSituations = new Set();
    state.filters.category.forEach((category) => {
      (categorySituations[category] || []).forEach((situation) => {
        enabledSituations.add(situation);
      });
    });

    const block = document.querySelector('[data-filter-group="situation"]');
    const inputs = Array.from(block.querySelectorAll('input[type="checkbox"]'));
    const allInput = inputs.find((input) => input.value === 'all');
    const situationInputs = inputs.filter((input) => input.value !== 'all');

    situationInputs.forEach((input) => {
      const isEnabled = enabledSituations.has(input.value);
      input.disabled = !isEnabled;
      input.closest('.option-chip').classList.toggle('is-hidden', !isEnabled);

      if (!isEnabled) {
        input.checked = false;
      }
    });

    let activeSituations = situationInputs.filter((input) => input.checked && !input.disabled);
    if (!activeSituations.length) {
      situationInputs.forEach((input) => {
        if (!input.disabled) {
          input.checked = true;
        }
      });
      activeSituations = situationInputs.filter((input) => input.checked && !input.disabled);
    }

    if (allInput) {
      allInput.checked = activeSituations.length === situationInputs.filter((input) => !input.disabled).length;
    }

    state.filters.situation = new Set(activeSituations.map((input) => input.value));
  }

  function normalizeAllCheckbox(block) {
    const allInput = block.querySelector('input[value="all"]');
    const valueInputs = Array.from(block.querySelectorAll('input[type="checkbox"]'))
      .filter((input) => input.value !== 'all' && !input.disabled);

    if (allInput) {
      allInput.checked = valueInputs.every((input) => input.checked);
    }
  }

  function getFilteredSentences() {
    return sentenceSamples.filter((item) => (
      state.filters.time.has(item.time)
      && state.filters.type.has(item.type)
      && state.filters.form.has(item.form)
      && state.filters.category.has(item.category)
      && state.filters.situation.has(item.situation)
      && state.filters.mode.has(item.mode)
    ));
  }

  function renderMatchingSentence(resetIndex) {
    const matches = getFilteredSentences();

    if (!matches.length) {
      state.currentSentence = null;
      clearSelection();
      sentenceTypeText.textContent = 'Немає речень для таких фільтрів';
      ruleText.textContent = 'Зміни параметри в меню, щоб знову показати речення.';
      uaSentenceText.textContent = 'Поки що тут порожньо.';
      answerPreview.className = 'answer-preview';
      answerPreview.innerHTML = '<span class="answer-placeholder">Вибери інші фільтри в меню</span>';
      wordBank.innerHTML = '';
      return;
    }

    if (resetIndex) {
      state.currentIndex = 0;
    } else {
      state.currentIndex = (state.currentIndex + 1) % matches.length;
    }

    state.currentSentence = matches[state.currentIndex];
    clearSelection();
    renderSentence();
  }

  function renderSentence() {
    const item = state.currentSentence;
    if (!item) {
      return;
    }

    sentenceTypeText.textContent = item.typeLabel;
    ruleText.textContent = item.rule;
    uaSentenceText.textContent = item.ua;
    answerPreview.className = 'answer-preview';
    renderAnswer();
    renderWordBank();
    updateTimeline(item);
  }

  function updateTimeline(item) {
    const left = timelinePositions[item.time] || '50%';
    tenseIndicator.style.left = left;
    tenseIndicator.textContent = formSymbols[item.form] || '✓';
    tenseIndicator.className = `tense-scale-indicator tense-form-${item.form}`;
  }

  function renderAnswer() {
    answerPreview.classList.remove('is-correct', 'is-wrong');

    if (!state.selectedWords.length) {
      answerPreview.innerHTML = '<span class="answer-placeholder">Натискай на слова нижче, щоб зібрати речення</span>';
      return;
    }

    answerPreview.innerHTML = state.selectedWords
      .map((word) => `<span class="answer-token">${word}</span>`)
      .join('');
  }

  function renderWordBank() {
    if (!state.currentSentence) {
      wordBank.innerHTML = '';
      return;
    }

    wordBank.innerHTML = state.currentSentence.wordBank.map((word, index) => {
      const usedClass = state.selectedIndexes.includes(index) ? 'is-used' : '';
      return `
        <button
          class="word-chip ${usedClass}"
          type="button"
          data-index="${index}"
        >
          ${word}
        </button>
      `;
    }).join('');

    wordBank.querySelectorAll('.word-chip').forEach((chip) => {
      chip.addEventListener('click', () => toggleWord(Number(chip.dataset.index)));
    });
  }

  function toggleWord(index) {
    if (!state.currentSentence) {
      return;
    }

    const currentPosition = state.selectedIndexes.indexOf(index);
    if (currentPosition >= 0) {
      state.selectedIndexes.splice(currentPosition, 1);
      state.selectedWords.splice(currentPosition, 1);
    } else {
      state.selectedIndexes.push(index);
      state.selectedWords.push(state.currentSentence.wordBank[index]);
    }

    renderAnswer();
    renderWordBank();
  }

  function clearSelection() {
    state.selectedWords = [];
    state.selectedIndexes = [];
  }

  function animateBuilder(callback) {
    sentenceBuilder.style.transition = 'opacity 0.24s ease, transform 0.24s ease';
    sentenceBuilder.style.opacity = '0';
    sentenceBuilder.style.transform = 'translateX(28px)';

    setTimeout(() => {
      callback();
      sentenceBuilder.style.transition = 'none';
      sentenceBuilder.style.opacity = '0';
      sentenceBuilder.style.transform = 'translateX(-28px)';

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          sentenceBuilder.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          sentenceBuilder.style.opacity = '1';
          sentenceBuilder.style.transform = 'translateX(0)';
        });
      });
    }, 250);
  }
});

function arraysEqual(first, second) {
  if (first.length !== second.length) {
    return false;
  }

  return first.every((item, index) => item === second[index]);
}
