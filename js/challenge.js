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
    all.push({ ...entry, id: crypto.randomUUID?.() || String(Date.now()), source: "device" });
    all.sort((a, b) => b.score - a.score || a.ts - b.ts);
    localStorage.setItem(LS_KEY, JSON.stringify(all.slice(0, 400)));
  }

  async function fetchRemote(difficulty) {
    const cfg = window.ECON_REMOTE;
    if (!cfg?.supabaseUrl || !cfg?.supabaseAnonKey || !cfg?.scoresTable) return [];
    const url = `${cfg.supabaseUrl}/rest/v1/${cfg.scoresTable}?difficulty=eq.${encodeURIComponent(
      difficulty
    )}&order=score.desc&limit=30`;
    const res = await fetch(url, {
      headers: {
        apikey: cfg.supabaseAnonKey,
        Authorization: `Bearer ${cfg.supabaseAnonKey}`,
      },
    });
    if (!res.ok) return [];
    const rows = await res.json();
    return rows.map((r) => ({
      name: r.player_name,
      score: r.score,
      total: r.total,
      difficulty: r.difficulty,
      ts: new Date(r.created_at).getTime(),
      source: "online",
    }));
  }

  async function pushRemote(entry) {
    const cfg = window.ECON_REMOTE;
    if (!cfg?.supabaseUrl || !cfg?.supabaseAnonKey || !cfg?.scoresTable) return false;
    const res = await fetch(`${cfg.supabaseUrl}/rest/v1/${cfg.scoresTable}`, {
      method: "POST",
      headers: {
        apikey: cfg.supabaseAnonKey,
        Authorization: `Bearer ${cfg.supabaseAnonKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        player_name: entry.name,
        score: entry.score,
        total: entry.total,
        difficulty: entry.difficulty,
      }),
    });
    return res.ok;
  }

  function fmtDay(ts) {
    try {
      return new Date(ts).toLocaleString();
    } catch (_) {
      return "";
    }
  }

  async function renderLeaderboard(difficulty) {
    const online = await fetchRemote(difficulty).catch(() => []);
    const local = loadLocal().filter((e) => e.difficulty === difficulty);
    const merged = [...online, ...local].sort((a, b) => b.score - a.score || a.ts - b.ts).slice(0, 25);

    let rows = "";
    merged.forEach((r, i) => {
      rows += `<tr><td>${i + 1}</td><td>${escapeHtml(r.name)}</td><td>${r.score}/${r.total}</td><td>${escapeHtml(
        r.source || "device"
      )}</td><td>${fmtDay(r.ts)}</td></tr>`;
    });
    if (!rows) rows = `<tr><td colspan="5" style="text-align:center;color:var(--muted)">No scores yet.</td></tr>`;

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
          <thead><tr><th>#</th><th>Name</th><th>Score</th><th>Source</th><th>When</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p class="lb-footnote">Device rows are stored in each visitor’s browser. Configure <code>js/remote.config.js</code> with Supabase URL + anon key so everyone can load the same online table.</p>`;

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

  function showQuestion() {
    const q = state.items[state.idx];
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
    q.choices.forEach((label, idx) => {
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
    const ok = choiceIdx === q.correctIndex;
    if (ok) state.score += 1;
    if (opts[choiceIdx]) opts[choiceIdx].classList.add(ok ? "correct" : "wrong");
    if (!ok && opts[q.correctIndex]) opts[q.correctIndex].classList.add("correct");

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

  async function finishRun() {
    const total = state.items.length;
    const entry = {
      name: state.name,
      score: state.score,
      total,
      difficulty: state.difficulty,
      ts: Date.now(),
    };
    saveLocal(entry);
    const onlineOk = await pushRemote({
      name: entry.name,
      score: entry.score,
      total: entry.total,
      difficulty: entry.difficulty,
    });

    root.innerHTML = `
      <div class="challenge-card">
        <h3>Run complete</h3>
        <p class="big-score">${entry.score} / ${entry.total}</p>
        <p class="muted">${escapeHtml(entry.name)} · ${escapeHtml(entry.difficulty)} · ${
      onlineOk ? "Submitted to online board." : "Saved on this browser only (Supabase not configured)."
    }</p>
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
