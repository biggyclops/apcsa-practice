(function () {
  'use strict';

  const state = {
    questions: [],
    order: [],
    index: 0,
    score: 0,
    answered: false
  };

  const el = {
    loading: document.getElementById('loading'),
    quiz: document.getElementById('quiz'),
    complete: document.getElementById('complete'),
    questionNumber: document.getElementById('questionNumber'),
    questionText: document.getElementById('questionText'),
    codeBlock: document.getElementById('codeBlock'),
    codeContent: document.getElementById('codeContent'),
    choices: document.getElementById('choices'),
    answerForm: document.getElementById('answerForm'),
    submitBtn: document.getElementById('submitBtn'),
    nextBtn: document.getElementById('nextBtn'),
    feedback: document.getElementById('feedback'),
    feedbackMessage: document.getElementById('feedbackMessage'),
    explanationText: document.getElementById('explanationText'),
    scoreEl: document.getElementById('score'),
    totalEl: document.getElementById('total'),
    finalScore: document.getElementById('finalScore'),
    restartBtn: document.getElementById('restartBtn')
  };

  function shuffle(array) {
    const a = array.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function showScreen(screen) {
    el.loading.classList.add('hidden');
    el.quiz.classList.add('hidden');
    el.complete.classList.add('hidden');
    if (screen === 'loading') el.loading.classList.remove('hidden');
    if (screen === 'quiz') el.quiz.classList.remove('hidden');
    if (screen === 'complete') el.complete.classList.remove('hidden');
  }

  function renderQuestion() {
    const q = state.questions[state.order[state.index]];
    const num = state.index + 1;
    const total = state.questions.length;

    el.questionNumber.textContent = 'Question ' + num + ' of ' + total;
    el.questionText.textContent = q.question;

    if (q.code && q.code.trim()) {
      el.codeContent.textContent = q.code;
      el.codeBlock.style.display = 'block';
    } else {
      el.codeContent.textContent = '';
      el.codeBlock.style.display = 'none';
    }

    el.choices.innerHTML = '';
    (q.options || []).forEach((choice, i) => {
      const label = document.createElement('label');
      label.className = 'choice';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'answer';
      radio.value = String(i);
      radio.id = 'choice' + i;
      radio.addEventListener('change', function () {
        el.choices.querySelectorAll('label').forEach(function (l) { l.classList.remove('selected'); });
        label.classList.add('selected');
      });
      label.appendChild(radio);
      label.appendChild(document.createTextNode(choice));
      label.htmlFor = 'choice' + i;
      el.choices.appendChild(label);
    });

    el.submitBtn.classList.remove('hidden');
    el.submitBtn.disabled = false;
    el.nextBtn.classList.add('hidden');
    el.feedback.classList.add('hidden');
    state.answered = false;
  }

  function updateScoreDisplay() {
    el.scoreEl.textContent = state.score;
    el.totalEl.textContent = state.questions.length;
  }

  function showFeedback(correct, explanation) {
    state.answered = true;
    const q = state.questions[state.order[state.index]];
    const correctIndex = (q.options || []).indexOf(q.answer);
    const labels = el.choices.querySelectorAll('label');
    labels.forEach((label, i) => {
      const radio = label.querySelector('input');
      radio.disabled = true;
      if (i === correctIndex) label.classList.add('correct');
      else if (radio.checked && !correct) label.classList.add('incorrect');
    });
    el.feedbackMessage.textContent = correct ? 'Correct!' : 'Incorrect.';
    el.feedback.className = 'feedback ' + (correct ? 'correct' : 'incorrect');
    el.explanationText.textContent = explanation || '';
    el.feedback.classList.remove('hidden');
    el.submitBtn.classList.add('hidden');
    el.nextBtn.classList.remove('hidden');
  }

  function nextOrComplete() {
    state.index++;
    if (state.index >= state.questions.length) {
      el.finalScore.textContent = 'You got ' + state.score + ' out of ' + state.questions.length + ' correct.';
      showScreen('complete');
    } else {
      renderQuestion();
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (state.answered) return;
    const selected = el.answerForm.querySelector('input[name="answer"]:checked');
    if (!selected) return;
    const q = state.questions[state.order[state.index]];
    const choiceIndex = parseInt(selected.value, 10);
    const correctIndex = (q.options || []).indexOf(q.answer);
    const correct = choiceIndex === correctIndex;
    if (correct) state.score++;
    updateScoreDisplay();
    showFeedback(correct, q.explanation);
  }

  function handleNext() {
    nextOrComplete();
  }

  function handleRestart() {
    state.index = 0;
    state.score = 0;
    state.order = shuffle(state.questions.map((_, i) => i));
    updateScoreDisplay();
    renderQuestion();
    showScreen('quiz');
  }

  function init() {
    el.answerForm.addEventListener('submit', handleSubmit);
    el.nextBtn.addEventListener('click', handleNext);
    if (el.restartBtn) el.restartBtn.addEventListener('click', handleRestart);

    fetch('questions.json')
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load questions');
        return res.json();
      })
      .then(function (data) {
        state.questions = Array.isArray(data) ? data : [];
        if (state.questions.length === 0) {
          el.loading.textContent = 'No questions found in questions.json.';
          return;
        }
        state.order = shuffle(state.questions.map((_, i) => i));
        state.index = 0;
        state.score = 0;
        updateScoreDisplay();
        renderQuestion();
        showScreen('quiz');
      })
      .catch(function (err) {
        el.loading.textContent = 'Error loading questions: ' + err.message;
      });
  }

  init();
})();
