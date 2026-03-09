/**
 * AP CSA Practice Portal – Leaderboard & Progress (localStorage only)
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'apcsaLeaderboard';
  const STREAK_MILESTONES = [5, 10, 15];
  const MILESTONE_MESSAGES = {
    5: "🔥 STREAK x5 – Nice run!",
    10: "🔥 STREAK x10 – You're on fire!",
    15: "🔥 STREAK x15 – AP CSA Master Mode!"
  };

  let currentStudent = null;
  let sessionQuestions = 0;
  let lastMilestoneShown = 0;

  const el = {};

  function getLeaderboard() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveLeaderboard(arr) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch (e) {}
  }

  function createStudent(name) {
    const now = new Date().toISOString();
    return {
      name: name.trim() || 'Anonymous',
      questionsCompleted: 0,
      correctAnswers: 0,
      accuracy: 0,
      streak: 0,
      bestStreak: 0,
      firstActivity: now,
      lastAnswered: now
    };
  }

  function getOrCreateStudent(name) {
    const board = getLeaderboard();
    const trimmed = (name || '').trim() || 'Anonymous';
    const existing = board.find(function (s) {
      return s.name.toLowerCase() === trimmed.toLowerCase();
    });
    if (existing) {
      currentStudent = existing;
      return existing;
    }
    const student = createStudent(trimmed);
    board.push(student);
    saveLeaderboard(board);
    currentStudent = student;
    return student;
  }

  function updateStudentOnAnswer(correct) {
    if (!currentStudent) return;
    const s = currentStudent;
    s.questionsCompleted += 1;
    if (correct) {
      s.correctAnswers += 1;
      s.streak += 1;
      if (s.streak > s.bestStreak) s.bestStreak = s.streak;
    } else {
      s.streak = 0;
    }
    s.lastAnswered = new Date().toISOString();
    s.accuracy = s.questionsCompleted > 0
      ? Math.round((s.correctAnswers / s.questionsCompleted) * 100)
      : 0;
    const board = getLeaderboard();
    const idx = board.findIndex(function (x) { return x.name === s.name; });
    if (idx !== -1) board[idx] = s;
    else board.push(s);
    saveLeaderboard(board);
  }

  function formatTimestamp(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    const opts = { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' };
    return d.toLocaleDateString('en-US', opts).replace(',', ' –');
  }

  function getSortedLeaderboard() {
    const board = getLeaderboard().slice();
    board.sort(function (a, b) {
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      if (b.bestStreak !== a.bestStreak) return b.bestStreak - a.bestStreak;
      return b.questionsCompleted - a.questionsCompleted;
    });
    return board;
  }

  function ensureElements() {
    if (el.panel) return;
    el.nameOverlay = document.getElementById('nameOverlay');
    el.nameInput = document.getElementById('nameInput');
    el.nameSubmit = document.getElementById('nameSubmit');
    el.studentPanel = document.getElementById('studentPanel');
    el.studentName = document.getElementById('studentName');
    el.studentCompleted = document.getElementById('studentCompleted');
    el.studentAccuracy = document.getElementById('studentAccuracy');
    el.studentStreak = document.getElementById('studentStreak');
    el.studentBestStreak = document.getElementById('studentBestStreak');
    el.sessionCount = document.getElementById('sessionCount');
    el.leaderboardTable = document.getElementById('leaderboardTableBody');
    el.milestoneBanner = document.getElementById('milestoneBanner');
  }

  function renderStudentPanel() {
    ensureElements();
    if (!el.studentPanel || !currentStudent) return;
    const s = currentStudent;
    el.studentName.textContent = s.name;
    el.studentCompleted.textContent = s.questionsCompleted;
    el.studentAccuracy.textContent = s.accuracy + '%';
    el.studentStreak.textContent = s.streak;
    el.studentBestStreak.textContent = s.bestStreak;
    el.sessionCount.textContent = sessionQuestions;
  }

  function renderLeaderboardTable() {
    ensureElements();
    if (!el.leaderboardTable) return;
    const sorted = getSortedLeaderboard();
    el.leaderboardTable.innerHTML = '';
    sorted.forEach(function (s, i) {
      const row = document.createElement('tr');
      if (currentStudent && s.name === currentStudent.name) row.classList.add('leaderboard-current');
      row.innerHTML =
        '<td>' + (i + 1) + '</td>' +
        '<td>' + escapeHtml(s.name) + '</td>' +
        '<td>' + s.questionsCompleted + '</td>' +
        '<td>' + s.accuracy + '%</td>' +
        '<td>' + s.streak + '</td>' +
        '<td>' + s.bestStreak + '</td>' +
        '<td>' + formatTimestamp(s.firstActivity) + '</td>' +
        '<td>' + formatTimestamp(s.lastAnswered) + '</td>';
      el.leaderboardTable.appendChild(row);
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function showStreakMilestone(streak) {
    if (!STREAK_MILESTONES.includes(streak) || streak <= lastMilestoneShown) return;
    lastMilestoneShown = streak;
    ensureElements();
    if (!el.milestoneBanner) return;
    const msg = MILESTONE_MESSAGES[streak];
    if (!msg) return;
    el.milestoneBanner.textContent = msg;
    el.milestoneBanner.classList.remove('milestone-fade');
    el.milestoneBanner.classList.add('milestone-show');
    clearTimeout(el.milestoneTimeout);
    el.milestoneTimeout = setTimeout(function () {
      el.milestoneBanner.classList.remove('milestone-show');
      el.milestoneBanner.classList.add('milestone-fade');
    }, 2500);
  }

  function refreshLeaderboard() {
    renderStudentPanel();
    renderLeaderboardTable();
  }

  function incrementSessionCount() {
    sessionQuestions += 1;
    if (el.sessionCount) el.sessionCount.textContent = sessionQuestions;
  }

  function showNamePrompt() {
    return new Promise(function (resolve) {
      ensureElements();
      if (!el.nameOverlay || !el.nameInput || !el.nameSubmit) {
        resolve('Anonymous');
        return;
      }
      el.nameOverlay.classList.remove('hidden');
      el.nameInput.value = '';
      el.nameInput.focus();
      function submit() {
        const name = el.nameInput.value.trim() || 'Anonymous';
        el.nameOverlay.classList.add('hidden');
        resolve(name);
      }
      el.nameSubmit.onclick = submit;
      el.nameInput.onkeydown = function (e) {
        if (e.key === 'Enter') submit();
      };
    });
  }

  function recordAnswer(correct) {
    if (!currentStudent) return;
    updateStudentOnAnswer(correct);
    incrementSessionCount();
    refreshLeaderboard();
    if (correct) showStreakMilestone(currentStudent.streak);
  }

  function getCurrentStudent() {
    return currentStudent;
  }

  function getSessionCount() {
    return sessionQuestions;
  }

  function init(onReady) {
    ensureElements();
    showNamePrompt().then(function (name) {
      getOrCreateStudent(name);
      refreshLeaderboard();
      if (el.studentPanel) el.studentPanel.classList.remove('hidden');
      if (el.leaderboardSection) el.leaderboardSection.classList.remove('hidden');
      if (typeof onReady === 'function') onReady();
    });
  }

  // Expose for app.js and ensure leaderboard section ref
  document.addEventListener('DOMContentLoaded', function () {
    el.leaderboardSection = document.getElementById('leaderboardSection');
  });

  window.Leaderboard = {
    init: init,
    recordAnswer: recordAnswer,
    getCurrentStudent: getCurrentStudent,
    getSessionCount: getSessionCount,
    refreshLeaderboard: refreshLeaderboard,
    incrementSessionCount: incrementSessionCount
  };
})();
