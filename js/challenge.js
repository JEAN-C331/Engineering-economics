(function () {
  const bank = window.CHALLENGE_BANK || { easy: [], medium: [], hard: [] };
  const root = document.getElementById("challenge-root");
  const lbRoot = document.getElementById("leaderboard-root");
  if (!root || !lbRoot) return;
  const $ = (sel, r = document) => r.querySelector(sel);

  const LS_KEY = "econhub_scores_v1";
  const state = {
    phase: "idle",
    difficulty: "easy",
    name: "",
    items: [],
    idx: 0,
    score: 0,
  };

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function katexOrPlain(tex, display) {
    if (!tex) return "";
    if (window.katex) {
      try {
        return window.katex.renderToString(tex, {
          throwOnError: false,
          displayMode: !!display,
          trust: false,
        });
      } catch (_) {
        return `<code>${escapeHtml(tex)}</code>`;
      }
    }
    return `<code>${escapeHtml(tex)}</code>`;
  }

  function loadLocal() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  function saveLocal(entry) {
    const all = loadLocal();
    all.push({ ...entry, id: crypto.randomUUID?.() || String(Date.now()) });
    all.sort((a, b) => b.score - a.score || a.ts - b.ts);
    localStorage.setItem(LS_KEY, JSON.stringify(all.slice(0, 400)));
  }

  function fmtDay(ts) {
    try {
      return new Date(ts).toLocaleString();
    } catch (_) {
      return "";
    }
  }

  /** One row per name + difficulty (best score first in sort order). */
  function bestRowsForDifficulty(difficulty) {
    const local = loadLocal().filter((e) => e.difficulty === difficulty);
    const sorted = [...local].sort((a, b) => b.score - a.score || a.ts - b.ts);
    const seen = new Set();
    const out = [];
    for (const r of sorted) {
      const k = `${String(r.name).toLowerCase()}|${r.difficulty}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(r);
    }
    return out.slice(0, 30);
  }

  function renderLeaderboard(difficulty) {
    const merged = bestRowsForDifficulty(difficulty);

    let rows = "";
    merged.forEach((r, i) => {
      rows += `<tr><td>${i + 1}</td><td>${escapeHtml(r.name)}</td><td>${r.score}/${r.total}</td><td>${fmtDay(r.ts)}</td></tr>`;
    });
    if (!rows) rows = `<tr><td colspan="4" style="text-align:center;color:var(--muted)">No scores yet.</td></tr>`;

    const footHtml = `<p class="lb-footnote">Rankings are saved only in <strong>this browser</strong> (localStorage). Clearing site data removes them.</p>`;

    lbRoot.innerHTML = `
      <div class="lb-toolbar">
        <span class="lb-label">Difficulty</span>
        <div class="lb-tabs" role="tablist">
          ${["easy", "medium", "hard"]
            .map(
              (d) =>
                `<button type="button" role="tab" class="lb-tab${d === difficulty ? " is-on" : ""}" data-diff="${d}">${d}</button>`
            )
            .join("")}
        </div>
      </div>
      <div class="table-scroll">
        <table class="lb-table">
          <thead><tr><th>#</th><th>Name</th><th>Score</th><th>When</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${footHtml}`;

    lbRoot.querySelectorAll(".lb-tab").forEach((btn) => {
      btn.addEventListener("click", () => renderLeaderboard(btn.getAttribute("data-diff") || "easy"));
    });
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function showSetup() {
    state.phase = "setup";
    root.innerHTML = `
      <div class="challenge-card">
        <h3>Challenge mode</h3>
        <p class="muted">12 questions per run. Pick a difficulty, enter your name, then answer step by step. After each question you will see whether you were correct and a worked solution.</p>
        <div class="field-grid">
          <label class="field"><span>Your name</span><input id="ch-name" type="text" maxlength="24" autocomplete="nickname" placeholder="e.g. Alex" /></label>
          <fieldset class="field">
            <legend>Difficulty</legend>
            <label><input type="radio" name="ch-diff" value="easy" checked /> Easy</label>
            <label><input type="radio" name="ch-diff" value="medium" /> Medium</label>
            <label><input type="radio" name="ch-diff" value="hard" /> Hard</label>
          </fieldset>
        </div>
        <button type="button" class="btn btn-primary" id="ch-start">Start challenge</button>
        <p class="err" id="ch-err" role="alert"></p>
      </div>`;

    $("#ch-start", root).addEventListener("click", () => {
      const name = ($("#ch-name", root).value || "").trim();
      const diff = root.querySelector('input[name="ch-diff"]:checked')?.value || "easy";
      const err = $("#ch-err", root);
      err.textContent = "";
      if (name.length < 1) {
        err.textContent = "Please enter your name.";
        return;
      }
      state.name = name.slice(0, 24);
      state.difficulty = diff;
      const pool = bank[diff] || [];
      if (pool.length < 4) {
        err.textContent = "Question bank missing for this difficulty.";
        return;
      }
      state.items = shuffle(pool).slice(0, 12);
      state.idx = 0;
      state.score = 0;
      state.phase = "play";
      showQuestion();
    });
  }

  function shuffleChoiceOrder(labels, correctIndex) {
    const tagged = labels.map((label, i) => ({ label, ok: i === correctIndex }));
    for (let i = tagged.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tagged[i], tagged[j]] = [tagged[j], tagged[i]];
    }
    return {
      labels: tagged.map((x) => x.label),
      correctIndex: tagged.findIndex((x) => x.ok),
    };
  }

  function showQuestion() {
    const q = state.items[state.idx];
    const sh = shuffleChoiceOrder(q.choices, q.correctIndex);
    state.shuffledCorrectIndex = sh.correctIndex;
    const prog = `Question ${state.idx + 1} of ${state.items.length}`;
    const promptMathHtml = q.promptMath ? `<div class="q-math">${katexOrPlain(q.promptMath, true)}</div>` : "";

    root.innerHTML = `
      <div class="challenge-card">
        <div class="ch-progress"><span>${escapeHtml(prog)}</span><span>Score: ${state.score}</span></div>
        <p class="q-text">${escapeHtml(q.prompt)}</p>
        ${promptMathHtml}
        <div class="quiz-options" id="ch-opts"></div>
        <div id="ch-after" class="ch-after hidden"></div>
      </div>`;

    const opts = $("#ch-opts", root);
    sh.labels.forEach((label, idx) => {
      const b = document.createElement("button");
      b.type = "button";
      b.innerHTML = escapeHtml(label);
      b.addEventListener("click", () => answer(idx));
      opts.appendChild(b);
    });
  }

  function answer(choiceIdx) {
    const q = state.items[state.idx];
    const opts = root.querySelectorAll("#ch-opts button");
    opts.forEach((b) => (b.disabled = true));
    const correctIdx = state.shuffledCorrectIndex;
    const ok = choiceIdx === correctIdx;
    if (ok) state.score += 1;
    if (opts[choiceIdx]) opts[choiceIdx].classList.add(ok ? "correct" : "wrong");
    if (!ok && opts[correctIdx]) opts[correctIdx].classList.add("correct");

    const after = $("#ch-after", root);
    after.classList.remove("hidden");
    after.innerHTML = `
      <div class="verdict ${ok ? "ok" : "bad"}">${ok ? "Correct" : "Incorrect"}</div>
      <div class="solution-math">${katexOrPlain(q.solutionMath, true)}</div>
      ${q.solutionText ? `<p class="solution-txt">${escapeHtml(q.solutionText)}</p>` : ""}
      <button type="button" class="btn btn-primary" id="ch-next">${state.idx + 1 < state.items.length ? "Next question" : "See results"}</button>`;

    $("#ch-next", after).addEventListener("click", () => {
      if (state.idx + 1 < state.items.length) {
        state.idx += 1;
        showQuestion();
      } else finishRun();
    });
  }

  function finishRun() {
    const total = state.items.length;
    const entry = {
      name: state.name,
      score: state.score,
      total,
      difficulty: state.difficulty,
      ts: Date.now(),
    };
    saveLocal(entry);

    root.innerHTML = `
      <div class="challenge-card">
        <h3>Run complete</h3>
        <p class="big-score">${entry.score} / ${entry.total}</p>
        <p class="muted">${escapeHtml(entry.name)} · ${escapeHtml(entry.difficulty)} · Saved on this browser.</p>
        <button type="button" class="btn" id="ch-again">Play again</button>
      </div>`;
    $("#ch-again", root).addEventListener("click", () => {
      showSetup();
    });
    renderLeaderboard(state.difficulty);
  }

  showSetup();
  renderLeaderboard("easy");
})();
