const TOTAL = 10;

const praise = ["Super!", "Brawo!", "Tak jest!", "Świetnie!", "Mistrz!"];
const retry = ["Prawie!", "Spróbuj zapamiętać", "Następnym razem się uda"];

const state = {
  limit: 20,
  mode: "choice",
  index: 0,
  score: 0,
  locked: false,
  current: null,
  typed: "",
};

const els = {
  menu: document.getElementById("screen-menu"),
  quiz: document.getElementById("screen-quiz"),
  result: document.getElementById("screen-result"),
  question: document.getElementById("question"),
  choices: document.getElementById("choices"),
  inputPanel: document.getElementById("input-panel"),
  typed: document.getElementById("typed-answer"),
  numpad: document.getElementById("numpad"),
  feedback: document.getElementById("feedback"),
  progress: document.getElementById("stat-progress"),
  score: document.getElementById("stat-score"),
  bar: document.getElementById("progress-bar"),
  resultTitle: document.getElementById("result-title"),
  resultScore: document.getElementById("result-score"),
  resultText: document.getElementById("result-text"),
  stars: document.getElementById("stars"),
};

document.querySelectorAll("[data-limit]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-limit]").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    state.limit = Number(btn.dataset.limit);
  });
});

document.querySelectorAll("[data-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-mode]").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    state.mode = btn.dataset.mode;
  });
});

document.getElementById("btn-start").addEventListener("click", startGame);
document.getElementById("btn-again").addEventListener("click", startGame);
document.getElementById("btn-menu").addEventListener("click", showMenu);
document.getElementById("btn-home").addEventListener("click", showMenu);

function show(screen) {
  els.menu.classList.toggle("hidden", screen !== "menu");
  els.quiz.classList.toggle("hidden", screen !== "quiz");
  els.result.classList.toggle("hidden", screen !== "result");
}

function showMenu() {
  show("menu");
}

function startGame() {
  state.index = 0;
  state.score = 0;
  state.typed = "";
  show("quiz");
  els.choices.classList.toggle("hidden", state.mode !== "choice");
  els.inputPanel.classList.toggle("hidden", state.mode !== "input");
  nextQuestion();
}

function maxFactor(limit) {
  if (limit <= 30) return 10;
  if (limit <= 50) return 10;
  if (limit <= 100) return 12;
  return 20;
}

function allPairs(limit) {
  const max = maxFactor(limit);
  const pairs = [];
  for (let a = 2; a <= max; a++) {
    for (let b = 2; b <= max; b++) {
      if (a * b <= limit) pairs.push([a, b]);
    }
  }
  return pairs;
}

function pickQuestion(limit, avoidKey) {
  const pairs = allPairs(limit);
  let pair = pairs[Math.floor(Math.random() * pairs.length)];
  let guard = 0;
  while (`${pair[0]}x${pair[1]}` === avoidKey && guard < 20) {
    pair = pairs[Math.floor(Math.random() * pairs.length)];
    guard += 1;
  }
  const [a, b] = pair;
  const answer = a * b;
  return { a, b, answer, key: `${a}x${b}` };
}

function unique(values) {
  return [...new Set(values.filter((n) => n > 0 && Number.isInteger(n)))];
}

function makeChoices(a, b, answer, limit) {
  const decoys = unique([
    a + b,
    Math.abs(a - b),
    a * (b + 1),
    a * (b - 1),
    (a + 1) * b,
    (a - 1) * b,
    answer + 1,
    answer - 1,
    answer + a,
    answer - b,
    answer + 10,
    Number(String(answer).split("").reverse().join("")) || answer + 2,
  ]).filter((n) => n !== answer && n <= Math.max(limit + 20, 40));

  while (decoys.length < 3) {
    const n = answer + Math.floor(Math.random() * 12) - 5;
    if (n !== answer && n > 0 && !decoys.includes(n)) decoys.push(n);
  }

  const options = [answer, ...decoys.slice(0, 3)];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return options;
}

function nextQuestion() {
  state.locked = false;
  state.typed = "";
  const prev = state.current?.key;
  state.current = pickQuestion(state.limit, prev);
  const { a, b, answer } = state.current;

  els.question.textContent = `${a} × ${b} = ?`;
  els.feedback.textContent = "";
  els.feedback.className = "feedback";
  els.progress.textContent = `${state.index + 1} / ${TOTAL}`;
  els.score.textContent = `★ ${state.score}`;
  els.bar.style.width = `${((state.index + 1) / TOTAL) * 100}%`;
  els.typed.textContent = "?";
  els.typed.className = "typed-answer";

  if (state.mode === "choice") {
    const options = makeChoices(a, b, answer, state.limit);
    els.choices.innerHTML = "";
    options.forEach((value) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice";
      btn.textContent = String(value);
      btn.addEventListener("click", () => submit(value, btn));
      els.choices.appendChild(btn);
    });
  }
}

function submit(value, btn) {
  if (state.locked) return;
  state.locked = true;
  const ok = Number(value) === state.current.answer;

  if (ok) {
    state.score += 1;
    els.feedback.textContent = praise[Math.floor(Math.random() * praise.length)];
    els.feedback.className = "feedback good";
    els.typed.classList.add("good");
    if (btn) btn.classList.add("correct");
    ding(true);
  } else {
    els.feedback.textContent = `${retry[Math.floor(Math.random() * retry.length)]} — to ${state.current.answer}`;
    els.feedback.className = "feedback bad";
    els.typed.classList.add("bad");
    if (btn) btn.classList.add("wrong");
    [...els.choices.children].forEach((child) => {
      if (Number(child.textContent) === state.current.answer) child.classList.add("correct");
    });
    ding(false);
  }

  els.score.textContent = `★ ${state.score}`;
  [...els.choices.children].forEach((child) => {
    child.disabled = true;
  });

  window.setTimeout(() => {
    state.index += 1;
    if (state.index >= TOTAL) finish();
    else nextQuestion();
  }, ok ? 850 : 1400);
}

function finish() {
  show("result");
  const ratio = state.score / TOTAL;
  els.resultScore.textContent = `${state.score} / ${TOTAL}`;
  if (ratio === 1) {
    els.resultTitle.textContent = "Mistrz tabliczki!";
    els.resultText.textContent = "Wszystko dobrze. Jesteś gwiazdą!";
    els.stars.textContent = "⭐⭐⭐";
  } else if (ratio >= 0.7) {
    els.resultTitle.textContent = "Świetna robota!";
    els.resultText.textContent = "Już prawie wszystko pamiętasz.";
    els.stars.textContent = "⭐⭐✨";
  } else if (ratio >= 0.4) {
    els.resultTitle.textContent = "Dobry start!";
    els.resultText.textContent = "Jeszcze trochę ćwiczeń i będzie super.";
    els.stars.textContent = "⭐✨✨";
  } else {
    els.resultTitle.textContent = "Ćwiczymy dalej!";
    els.resultText.textContent = "Każda runda robi Cię silniejszym.";
    els.stars.textContent = "✨✨✨";
  }
}

function buildNumpad() {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "OK"];
  els.numpad.innerHTML = "";
  keys.forEach((label) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "key";
    btn.textContent = label;
    if (label === "OK") btn.classList.add("ok");
    btn.addEventListener("click", () => onKey(label));
    els.numpad.appendChild(btn);
  });
}

function onKey(label) {
  if (state.locked || els.quiz.classList.contains("hidden")) return;
  if (label === "⌫") {
    state.typed = state.typed.slice(0, -1);
  } else if (label === "OK") {
    if (state.typed === "") return;
    submit(Number(state.typed));
    return;
  } else if (state.typed.length < 4) {
    state.typed += label;
  }
  els.typed.textContent = state.typed || "?";
}

document.addEventListener("keydown", (event) => {
  if (els.quiz.classList.contains("hidden") || state.mode !== "input") return;
  if (event.key >= "0" && event.key <= "9") onKey(event.key);
  if (event.key === "Backspace") onKey("⌫");
  if (event.key === "Enter") onKey("OK");
});

function ding(good) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = good ? 660 : 220;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  } catch {
    /* autoplay / headless */
  }
}

buildNumpad();
