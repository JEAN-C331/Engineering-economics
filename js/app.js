(function () {
  const topics = window.KNOWLEDGE_TOPICS || [];
  const tracks = window.KNOWLEDGE_TRACKS || { all: "All" };
  const $ = (sel, root = document) => root.querySelector(sel);
  const listEl = $("#topic-list");
  const searchEl = $("#topic-search");
  const countEl = $("#topic-count");

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function renderFormula(tex, displayMode = true) {
    if (!tex) return "";
    if (window.katex) {
      try {
        return window.katex.renderToString(tex, { throwOnError: false, displayMode: displayMode, trust: false });
      } catch (_) {
        return `<code>${escapeHtml(tex)}</code>`;
      }
    }
    return `<code>${escapeHtml(tex)}</code>`;
  }

  const trackLabel = (k) => tracks[k] || k;

  /* ----- Knowledge hub ----- */
  const chipHost = $("#hub-chips");
  let activeTrack = "all";

  function buildChips() {
    if (!chipHost) return;
    chipHost.innerHTML = "";
    Object.keys(tracks).forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip" + (key === "all" ? " is-on" : "");
      btn.setAttribute("data-track", key);
      btn.textContent = tracks[key];
      btn.addEventListener("click", () => {
        chipHost.querySelectorAll(".chip").forEach((b) => b.classList.remove("is-on"));
        btn.classList.add("is-on");
        activeTrack = key;
        renderTopics();
      });
      chipHost.appendChild(btn);
    });
  }

  function matchesTopic(t, q) {
    if (!q) return true;
    const blob = `${t.title} ${t.summary} ${t.formulaLatex || ""} ${t.keywords}`.toLowerCase();
    return q.split(/\s+/).every((word) => word.length === 0 || blob.includes(word));
  }

  function renderTopics() {
    const q = (searchEl.value || "").trim().toLowerCase();
    listEl.innerHTML = "";
    let n = 0;
    for (const t of topics) {
      if (activeTrack !== "all" && t.track !== activeTrack) continue;
      if (!matchesTopic(t, q)) continue;
      n++;
      const details = document.createElement("details");
      details.className = "topic-card";
      details.dataset.topicId = t.id;
      details.innerHTML = `
        <summary>
          <span>${escapeHtml(t.title)}</span>
          <span class="topic-meta">${escapeHtml(trackLabel(t.track))}</span>
        </summary>
        <div class="topic-body">
          <p>${escapeHtml(t.summary)}</p>
          <div class="formula-box formula-sheet js-katex-formula"></div>
          <p style="font-size:0.82rem;color:var(--muted)">Keywords: ${escapeHtml(t.keywords)}</p>
        </div>
      `;
      const box = details.querySelector(".js-katex-formula");
      if (box) box.innerHTML = renderFormula(t.formulaLatex || "");
      listEl.appendChild(details);
    }
    countEl.textContent = String(n);
  }

  buildChips();
  if (searchEl && listEl && countEl) {
    searchEl.addEventListener("input", renderTopics);
    renderTopics();
  }

  function openFromHash() {
    const id = new URLSearchParams(location.hash.replace(/^#/, "")).get("topic");
    if (!id) return;
    const esc = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(id) : id.replace(/[^a-zA-Z0-9_-]/g, "");
    const el = listEl.querySelector(`[data-topic-id="${esc}"]`);
    if (el) {
      el.open = true;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
  window.addEventListener("hashchange", openFromHash);
  openFromHash();

  /* ----- Hero: key ideas carousel ----- */
  const HERO_SLIDES = [
    {
      title: "Time value of money",
      body: "Money available now can earn compound interest, so it is economically stronger than the same nominal sum later. End-of-period compounding follows F = P(1+i)^n when i is expressed per period.",
      tex: String.raw`F=P(1+i)^n`,
    },
    {
      title: "Nominal vs effective annual rate",
      body: "The quoted annual rate r ignores how often interest is credited within the year. The effective annual rate i_a includes intra-year compounding—use it to compare loans or savings on equal footing.",
      tex: String.raw`i_a=\left(1+\frac{r}{m}\right)^m-1`,
    },
    {
      title: "Net present worth (NPW)",
      body: "Discount every net cash flow to time 0 at the MARR. If NPW ≥ 0, the alternative meets or beats the hurdle in present-worth terms for the study period you modeled.",
      tex: String.raw`\mathrm{NPW}=\sum_t \frac{\mathrm{NCF}_t}{(1+i)^t}`,
    },
    {
      title: "Minimum attractive rate of return (MARR)",
      body: "MARR is the organization’s hurdle rate reflecting opportunity cost and risk. It is the discount rate used in NPW tests unless your instructor specifies otherwise.",
      tex: String.raw`\text{Accept if }\mathrm{NPW}(i=\text{MARR})\ge 0`,
    },
    {
      title: "Uniform series factors",
      body: "Level end-of-period receipts or payments link to P and F through (P/A,i,n) and (F/A,i,n). Always align i and n with the payment period before applying tabulated factors.",
      tex: String.raw`F=A\left[\frac{(1+i)^n-1}{i}\right],\quad P=A\left[\frac{(1+i)^n-1}{i(1+i)^n}\right]`,
    },
    {
      title: "Cash-flow diagrams first",
      body: "Sketch inflows (+) and outflows (−) on a timeline before choosing factors. Timing mistakes are expensive—and the interactive cash-flow lab lets you rescale arrows as you edit the table.",
      tex: null,
    },
  ];

  function initHeroCarousel() {
    const viewport = $("#hero-viewport");
    const dotsHost = $("#hero-dots");
    const prev = $("#hero-prev");
    const next = $("#hero-next");
    if (!viewport || !dotsHost || !prev || !next) return;

    let idx = 0;
    let timer = null;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    function renderSlide() {
      const s = HERO_SLIDES[idx];
      const mathHtml = s.tex
        ? `<div class="hero-slide-math formula-sheet">${renderFormula(s.tex, true)}</div>`
        : "";
      viewport.innerHTML = `
      <div class="hero-slide is-active" role="group" aria-roledescription="slide" aria-label="Slide ${idx + 1} of ${HERO_SLIDES.length}">
        <h4>${escapeHtml(s.title)}</h4>
        <p>${escapeHtml(s.body)}</p>
        ${mathHtml}
      </div>`;
      dotsHost.querySelectorAll(".hero-dot").forEach((d, i) => {
        d.classList.toggle("is-on", i === idx);
        d.setAttribute("aria-selected", i === idx ? "true" : "false");
      });
    }

    function go(delta) {
      idx = (idx + delta + HERO_SLIDES.length) % HERO_SLIDES.length;
      renderSlide();
    }

    function armTimer() {
      if (reduceMotion) return;
      clearInterval(timer);
      timer = setInterval(() => go(1), 7000);
    }

    HERO_SLIDES.forEach((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "hero-dot" + (i === 0 ? " is-on" : "");
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", i === 0 ? "true" : "false");
      b.setAttribute("aria-label", `Slide ${i + 1}`);
      b.addEventListener("click", () => {
        idx = i;
        renderSlide();
        armTimer();
      });
      dotsHost.appendChild(b);
    });

    prev.addEventListener("click", () => {
      go(-1);
      armTimer();
    });
    next.addEventListener("click", () => {
      go(1);
      armTimer();
    });

    const aside = viewport.closest(".hero-spotlight");
    aside?.addEventListener("mouseenter", () => clearInterval(timer));
    aside?.addEventListener("mouseleave", () => armTimer());

    renderSlide();
    armTimer();
    window.__econHeroRender = renderSlide;
  }

  initHeroCarousel();

  /* ----- FV + EAR calculator ----- */
  const inPNum = $("#in-p-num");
  const inRNum = $("#in-r-num");
  const inTNum = $("#in-t-num");
  const inMNum = $("#in-m-num");
  const labP = $("#lab-p");
  const labR = $("#lab-r");
  const labT = $("#lab-t");
  const labM = $("#lab-m");
  const outF = $("#out-f");
  const outIa = $("#out-ia");

  function fmtMoney(x) {
    return x.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  }

  function fmtPct(x) {
    return (100 * x).toLocaleString(undefined, { maximumFractionDigits: 3 }) + "%";
  }

  function clampNum(val, min, max, step, roundM) {
    let x = Number(val);
    if (!Number.isFinite(x)) x = min;
    x = Math.min(max, Math.max(min, x));
    if (roundM) return Math.round(x);
    return Math.round(x / step) * step;
  }

  function recalcFv() {
    if (!inPNum || !inRNum || !inTNum || !inMNum || !labP || !outF) return;
    const P = clampNum(inPNum.value, 100, 10000, 100, false);
    const r = clampNum(inRNum.value, 0, 20, 0.5, false) / 100;
    const t = clampNum(inTNum.value, 1, 20, 1, true);
    const m = clampNum(inMNum.value, 1, 365, 1, true);
    inPNum.value = String(P);
    inRNum.value = String(r * 100);
    inTNum.value = String(t);
    inMNum.value = String(m);
    labP.textContent = fmtMoney(P);
    labR.textContent = `${(r * 100).toFixed(1)}%`;
    labT.textContent = String(t);
    labM.textContent = String(m);
    const F = P * Math.pow(1 + r / m, m * t);
    const ia = Math.pow(1 + r / m, m) - 1;
    outF.textContent = "$" + fmtMoney(F);
    outIa.textContent = fmtPct(ia);
  }

  [inPNum, inRNum, inTNum, inMNum].forEach((el) => {
    if (el) el.addEventListener("input", recalcFv);
  });

  recalcFv();

  const fvFormulaEl = $("#fv-formula-katex");
  if (fvFormulaEl) {
    fvFormulaEl.innerHTML = renderFormula(String.raw`F=P\left(1+\frac{r}{m}\right)^{mt},\qquad i_a=\left(1+\frac{r}{m}\right)^m-1`);
  }

  function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ----- Loan EAR mini-game ----- */
  const scenarios = [
    {
      text: "Loan A: 11.8% nominal, compounded monthly. Loan B: 12.0% nominal, compounded quarterly. Which has the lower effective annual cost?",
      options: [
        { label: "A is cheaper (lower EAR)", ok: true },
        { label: "B is cheaper (lower EAR)", ok: false },
        { label: "They are exactly equal", ok: false },
      ],
      tex: String.raw`i_a = \left(1 + \frac{r}{m}\right)^m - 1`,
      explain:
        "Compute effective annual rate for each. Monthly compounding on A increases its effective rate more than the smaller nominal suggests.",
    },
    {
      text: "Loan A: 9.0% nominal, compounded daily (365). Loan B: 9.2% nominal, compounded annually. Which is cheaper?",
      options: [
        { label: "A is cheaper", ok: false },
        { label: "B is cheaper", ok: true },
        { label: "Impossible without P and n", ok: false },
      ],
      explain:
        "Compare EAR: daily compounding lifts A to about 9.42%, while B stays at 9.20%. For borrowing, lower EAR is cheaper, so B wins.",
    },
    {
      text: "Continuous compounding: if a continuous nominal rate r is quoted, a common effective annual form is:",
      options: [
        { label: `${renderFormula(String.raw`i_a = e^r - 1`)}`, ok: true },
        { label: `${renderFormula(String.raw`i_a = r`)}`, ok: false },
        { label: `${renderFormula(String.raw`i_a = \ln(r)`)}`, ok: false },
      ],
      tex: String.raw`i_a = e^r - 1`,
      explain: "Pair continuous compounding with the textbook's definition of r; many texts use",
      explainTex: String.raw`i_a = e^r - 1`,
      explainAfter: "for the annual effective analogue.",
    },
  ];
  let scenIdx = 0;

  function renderLoanGame() {
    const boxQ = $("#loan-scenario");
    const boxO = $("#loan-options");
    const fb = $("#loan-feedback");
    const s = scenarios[scenIdx % scenarios.length];
    const mathHtml = s.tex ? `<div class="quiz-math">${renderFormula(s.tex, true)}</div>` : "";
    boxQ.innerHTML = `${escapeHtml(s.text)}${mathHtml}`;
    boxO.innerHTML = "";
    fb.innerHTML = "";
    shuffleArray(s.options).forEach((opt) => {
      const b = document.createElement("button");
      b.type = "button";
      b.innerHTML = opt.label;
      b.addEventListener("click", () => {
        [...boxO.children].forEach((c) => (c.disabled = true));
        b.classList.add(opt.ok ? "correct" : "wrong");
        
        if (s.explainTex) {
          fb.innerHTML = `${opt.ok ? "Nice — " : "Not quite — "}${escapeHtml(s.explain)} <span class="quiz-math-inline">${renderFormula(s.explainTex, false)}</span> ${escapeHtml(s.explainAfter || "")}`;
        } else {
          fb.textContent = opt.ok ? "Nice — " + s.explain : "Not quite — " + s.explain;
        }
      });
      boxO.appendChild(b);
    });
  }
  $("#loan-next")?.addEventListener("click", () => {
    scenIdx++;
    renderLoanGame();
  });
  renderLoanGame();

  /* ----- NPW multiple choice ----- */
  const mcBank = [
    {
      q: "You evaluate a project at MARR = 10%. Its NPW is +$250. What is the usual decision?",
      opts: [
        { t: "Accept (meets/exceeds the hurdle in PW terms)", ok: true },
        { t: "Reject because positive NPW is bad", ok: false },
        { t: "Accept only if IRR is exactly 10%", ok: false },
      ],
      fb: "Positive NPW means the cash flow pattern earns more than the MARR in present-worth terms (for the chosen study period).",
    },
    {
      q: "Two mutually exclusive alternatives both have NPW > 0 at the same MARR and same study period. How do you choose?",
      opts: [
        { t: "Pick the larger NPW", ok: true },
        { t: "Pick the smaller NPW", ok: false },
        { t: "Pick the longer-lived project automatically", ok: false },
      ],
      fb: "With a common study period and consistent assumptions, maximize NPW among feasible options.",
    },
    {
      q: "NPW analysis needs a discount rate. Which parameter commonly plays that role?",
      opts: [
        { t: "MARR", ok: true },
        { t: "Simple interest rate only", ok: false },
        { t: "Inflation rate only", ok: false },
      ],
      fb: "MARR anchors present-worth tests for many classroom and practice settings.",
    },
  ];
  let mcIdx = 0;

  function renderMc() {
    const qEl = $("#mc-q");
    const oEl = $("#mc-opts");
    const fEl = $("#mc-fb");
    const item = mcBank[mcIdx % mcBank.length];
    qEl.textContent = item.q;
    fEl.textContent = "";
    oEl.innerHTML = "";
    shuffleArray(item.opts).forEach((o) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = o.t;
      b.addEventListener("click", () => {
        [...oEl.children].forEach((c) => (c.disabled = true));
        b.classList.add(o.ok ? "correct" : "wrong");
        fEl.textContent = item.fb;
      });
      oEl.appendChild(b);
    });
  }
  $("#mc-next")?.addEventListener("click", () => {
    mcIdx++;
    renderMc();
  });
  renderMc();

  /* ----- Flashcards ----- */
  const cards = [
    { front: "Future worth of a lump sum", tex: String.raw`F=P(1+i)^n` },
    { front: "Present worth of a lump sum", tex: String.raw`P=F(1+i)^{-n}` },
    { front: "Effective annual rate", tex: String.raw`i_a=\left(1+\frac{r}{m}\right)^m-1` },
    { front: "NPW", tex: String.raw`\begin{aligned}\mathrm{NPW}&=\mathrm{PW}_{\text{benefits}}\\&\quad-\mathrm{PW}_{\text{costs}}\end{aligned}` },
    { front: "End-of-period perpetuity", tex: String.raw`P=\frac{A}{i}` },
    { front: "Future worth of ordinary annuity", tex: String.raw`F=A\left[\frac{(1+i)^n-1}{i}\right]` },
  ];
  function mountFlashCards() {
    const fg = $("#flash-grid");
    if (!fg) return;
    fg.innerHTML = "";
    cards.forEach((c) => {
      const wrap = document.createElement("div");
      wrap.className = "flash";
      wrap.tabIndex = 0;
      wrap.setAttribute("role", "button");
      wrap.setAttribute("aria-pressed", "false");
      wrap.innerHTML = `
      <div class="flash-inner">
        <div class="flash-face flash-front">${escapeHtml(c.front)}</div>
        <div class="flash-face flash-back formula-sheet">${renderFormula(c.tex, true)}</div>
      </div>`;
      const flip = () => {
        wrap.classList.toggle("is-flipped");
        wrap.setAttribute("aria-pressed", wrap.classList.contains("is-flipped") ? "true" : "false");
      };
      wrap.addEventListener("click", flip);
      wrap.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          flip();
        }
      });
      fg.appendChild(wrap);
    });
  }

  mountFlashCards();

  function typesetAllStaticMath() {
    renderTopics();
    mountFlashCards();
    const fvFormulaEl = $("#fv-formula-katex");
    if (fvFormulaEl) {
      fvFormulaEl.innerHTML = renderFormula(
        String.raw`F=P\left(1+\frac{r}{m}\right)^{mt},\qquad i_a=\left(1+\frac{r}{m}\right)^m-1`
      );
    }
    recalcFv();
    if (typeof window.__econHeroRender === "function") window.__econHeroRender();
  }

  window.addEventListener("load", () => {
    if (window.katex) typesetAllStaticMath();
  });

  /* Nav highlight on scroll */
  const navLinks = [...document.querySelectorAll('nav a[href^="#"]')];
  const sections = navLinks.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);

  const obs = new IntersectionObserver(
    (entries) => {
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!vis) return;
      const id = vis.target.getAttribute("id");
      navLinks.forEach((a) => {
        const on = a.getAttribute("href") === `#${id}`;
        if (on) a.setAttribute("aria-current", "page");
        else a.removeAttribute("aria-current");
      });
    },
    { rootMargin: "-45% 0px -45% 0px", threshold: [0.01, 0.25, 0.6] }
  );
  sections.forEach((s) => obs.observe(s));

  /* ========== DARK/LIGHT THEME TOGGLE ========== */
  const themeToggleBtn = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('ee-theme') || 'light';
  
  function applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('theme-dark');
      themeToggleBtn.textContent = '☀️';
    } else {
      document.body.classList.remove('theme-dark');
      themeToggleBtn.textContent = '🌙';
    }
  }
  
  applyTheme(savedTheme);
  
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.body.classList.contains('theme-dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('ee-theme', newTheme);
    applyTheme(newTheme);
  });

  /* ========== QUICK FORMULAS SECTION ========== */
  function renderQuickFormulas() {
    const formulas = [
      { formula: 'F = P(1+i)^n', label: 'Future Worth', track: 'time-value' },
      { formula: 'P = F/(1+i)^n', label: 'Present Worth', track: 'time-value' },
      { formula: 'F = A[(1+i)^n-1]/i', label: 'Future Value of Annuity', track: 'annuities' },
      { formula: 'P = A[(1+i)^n-1]/[i(1+i)^n]', label: 'Present Value of Annuity', track: 'annuities' },
      { formula: 'A = P[i(1+i)^n]/[(1+i)^n-1]', label: 'Capital Recovery Factor', track: 'annual' },
      { formula: 'NPW = ∑NCF_t/(1+i)^t', label: 'Net Present Worth', track: 'present-worth' },
      { formula: 'AW = NPW(A/P,i,n)', label: 'Annual Worth', track: 'annual' },
      { formula: 'i_a = (1+r/m)^m - 1', label: 'Effective Annual Rate', track: 'nominal' },
      { formula: '0 = ∑NCF_t/(1+IRR)^t', label: 'Internal Rate of Return', track: 'return' }
    ];
    
    const grid = document.getElementById('quick-formulas-grid');
    if (!grid) return;
    
    grid.innerHTML = formulas.map(f => `
      <div class="quick-formula-card" onclick="document.getElementById('hub').scrollIntoView({behavior:'smooth'})">
        <div>${renderFormula(f.formula, false)}</div>
        <small>${f.label}</small>
      </div>
    `).join('');
  }
  renderQuickFormulas();

  /* ========== LEARNING PATH RECOMMENDATIONS ========== */
  const learningPaths = {
    beginner: {
      title: "Beginner Learning Path",
      description: "Start with the fundamentals and build a strong foundation.",
      topics: [
        "Time value of money basics",
        "Simple vs compound interest",
        "Present and future worth factors",
        "Annuities (P/A, F/A, A/P, A/F)",
        "Cash flow diagrams"
      ]
    },
    review: {
      title: "Quick Review Path",
      description: "Focus on key topics for exams and quick reference.",
      topics: [
        "Nominal vs effective rates",
        "Net present worth (NPW) analysis",
        "Annual worth (AW) method",
        "Internal rate of return (IRR)",
        "Common pitfalls to avoid"
      ]
    },
    advanced: {
      title: "Advanced Learning Path",
      description: "Deepen your understanding with decision-making and risk analysis.",
      topics: [
        "Incremental IRR analysis",
        "Equipment replacement analysis",
        "Depreciation methods",
        "Risk and sensitivity analysis",
        "Real-world project evaluation"
      ]
    }
  };

  function renderPathRecommendation(pathKey) {
    const container = document.getElementById('path-recommendations');
    if (!container) return;
    const path = learningPaths[pathKey];
    
    container.innerHTML = `
      <h3 style="margin:0 0 10px">${path.title}</h3>
      <p style="margin:0 0 14px;color:var(--muted)">${path.description}</p>
      <ul>
        ${path.topics.map(t => `<li style="margin:6px 0"><strong>${t}</strong></li>`).join('')}
      </ul>
    `;
  }

  const pathBtns = document.querySelectorAll('.path-btn');
  if (pathBtns.length > 0) {
    pathBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        pathBtns.forEach(b => b.classList.remove('is-on'));
        btn.classList.add('is-on');
        renderPathRecommendation(btn.dataset.path);
      });
    });
    renderPathRecommendation('beginner');
  }

  /* ========== CALCULATOR TABS ========== */
  const calcTabs = document.querySelectorAll('.calc-tab');
  const calcPanels = document.querySelectorAll('.calc-panel');

  if (calcTabs.length > 0 && calcPanels.length > 0) {
    calcTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.calc;
        calcTabs.forEach(t => t.classList.remove('is-on'));
        tab.classList.add('is-on');
        calcPanels.forEach(p => {
          p.classList.remove('is-visible');
          if (p.id === `calc-${target}`) p.classList.add('is-visible');
        });
      });
    });
  }

  /* ========== PRESENT WORTH CALCULATOR ========== */
  function calculatePW() {
    const F = Number(document.getElementById('pw-calc-f').value);
    const i = Number(document.getElementById('pw-calc-i').value) / 100;
    const n = Number(document.getElementById('pw-calc-n').value);
    
    const factor = 1 / Math.pow(1 + i, n);
    const P = F * factor;
    
    document.getElementById('pw-calc-result').innerHTML = `
      <strong>Present Worth P ≈ $${P.toFixed(2)}</strong><br>
      (P/F, ${(i*100).toFixed(1)}%, ${n}) = ${factor.toFixed(6)}
    `;
    
    const steps = document.getElementById('pw-calc-steps');
    steps.style.display = 'block';
    steps.innerHTML = `
      <ol>
        <li>Use the present worth factor: (P/F, i, n) = 1/(1+i)<sup>n</sup></li>
        <li>Calculate factor: 1/(1+${i})<sup>${n}</sup> = ${factor.toFixed(6)}</li>
        <li>Compute PW: P = F × Factor = ${F} × ${factor.toFixed(6)} = $${P.toFixed(2)}</li>
      </ol>
    `;
  }

  const pwBtn = document.getElementById('pw-calc-btn');
  if (pwBtn) {
    pwBtn.addEventListener('click', calculatePW);
    calculatePW();
  }

  /* ========== ANNUAL WORTH CALCULATOR ========== */
  function calculateAW() {
    const P = Number(document.getElementById('aw-calc-p').value);
    const S = Number(document.getElementById('aw-calc-s').value);
    const i = Number(document.getElementById('aw-calc-i').value) / 100;
    const n = Number(document.getElementById('aw-calc-n').value);
    
    const apFactor = (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
    const afFactor = i / (Math.pow(1 + i, n) - 1);
    const CR = P * apFactor - S * afFactor;
    
    document.getElementById('aw-calc-result').innerHTML = `
      <strong>Capital Recovery ≈ $${CR.toFixed(2)}</strong><br>
      Annual worth calculation complete
    `;
    
    const steps = document.getElementById('aw-calc-steps');
    steps.style.display = 'block';
    steps.innerHTML = `
      <ol>
        <li>Capital Recovery: CR = P×(A/P,i,n) - S×(A/F,i,n)</li>
        <li>(A/P, ${(i*100).toFixed(1)}%, ${n}) = ${apFactor.toFixed(6)}</li>
        <li>(A/F, ${(i*100).toFixed(1)}%, ${n}) = ${afFactor.toFixed(6)}</li>
        <li>CR = ${P}×${apFactor.toFixed(6)} - ${S}×${afFactor.toFixed(6)} = $${CR.toFixed(2)}</li>
      </ol>
    `;
  }

  const awBtn = document.getElementById('aw-calc-btn');
  if (awBtn) {
    awBtn.addEventListener('click', calculateAW);
    calculateAW();
  }

  /* ========== IRR CALCULATOR ========== */
  function calculateIRR() {
    const cashFlows = [
      Number(document.getElementById('irr-calc-0').value),
      Number(document.getElementById('irr-calc-1').value),
      Number(document.getElementById('irr-calc-2').value),
      Number(document.getElementById('irr-calc-3').value),
      Number(document.getElementById('irr-calc-4').value)
    ];
    
    function npw(rate) {
      let npv = 0;
      for (let t = 0; t < cashFlows.length; t++) {
        npv += cashFlows[t] / Math.pow(1 + rate, t);
      }
      return npv;
    }
    
    let irr = 0.1;
    for (let iter = 0; iter < 100; iter++) {
      const npv = npw(irr);
      const derivative = (npw(irr + 0.001) - npw(irr)) / 0.001;
      if (Math.abs(npv) < 1e-8) break;
      if (Math.abs(derivative) < 1e-12) break;
      irr = irr - npv / derivative;
      if (irr < -0.9) irr = 0;
      if (irr > 2) irr = 0.5;
    }
    
    const irrPercent = irr * 100;
    
    document.getElementById('irr-calc-result').innerHTML = `
      <strong>Internal Rate of Return ≈ ${irrPercent.toFixed(2)}%</strong><br>
      NPW at this rate ≈ $${npw(irr).toFixed(2)}
    `;
    
    const steps = document.getElementById('irr-calc-steps');
    if (steps) {
      steps.style.display = 'block';
      steps.innerHTML = `
        <ol>
          <li>Cash flows: [${cashFlows.join(', ')}]</li>
          <li>Find rate where NPW ≈ 0</li>
          <li>IRR ≈ ${irrPercent.toFixed(2)}% (accept if IRR > MARR)</li>
        </ol>
      `;
    }
  }

  const irrBtn = document.getElementById('irr-calc-btn');
  if (irrBtn) {
    irrBtn.addEventListener('click', calculateIRR);
    calculateIRR();
  }

  /* ========== EUAC CALCULATOR ========== */
  function calculateEUAC() {
    const P = Number(document.getElementById('euac-calc-p').value);
    const A = Number(document.getElementById('euac-calc-a').value);
    const S = Number(document.getElementById('euac-calc-s').value);
    const i = Number(document.getElementById('euac-calc-i').value) / 100;
    const n = Number(document.getElementById('euac-calc-n').value);
    
    const apFactor = (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
    const afFactor = i / (Math.pow(1 + i, n) - 1);
    const CR = P * apFactor - S * afFactor;
    const EUAC = CR + A;
    
    const resultEl = document.getElementById('euac-calc-result');
    if (resultEl) {
      resultEl.innerHTML = `
        <strong>Equivalent Uniform Annual Cost ≈ $${EUAC.toFixed(2)}</strong><br>
        Capital Recovery: $${CR.toFixed(2)} + Annual Costs: $${A}
      `;
    }
    
    const steps = document.getElementById('euac-calc-steps');
    if (steps) {
      steps.style.display = 'block';
      steps.innerHTML = `
        <ol>
          <li>EUAC = Capital Recovery + Annual Operating Cost</li>
          <li>CR = ${P}×${apFactor.toFixed(6)} - ${S}×${afFactor.toFixed(6)} = $${CR.toFixed(2)}</li>
          <li>EUAC = $${CR.toFixed(2)} + $${A} = $${EUAC.toFixed(2)}</li>
        </ol>
      `;
    }
  }

  const euacBtn = document.getElementById('euac-calc-btn');
  if (euacBtn) {
    euacBtn.addEventListener('click', calculateEUAC);
    calculateEUAC();
  }

  /* ========== INTEREST FACTORS CALCULATOR ========== */
  function calculateFactors() {
    const i = Number(document.getElementById('factors-calc-i').value) / 100;
    const n = Number(document.getElementById('factors-calc-n').value);
    
    const pf = 1 / Math.pow(1 + i, n);
    const fp = Math.pow(1 + i, n);
    const pa = (Math.pow(1 + i, n) - 1) / (i * Math.pow(1 + i, n));
    const fa = (Math.pow(1 + i, n) - 1) / i;
    const ap = (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
    const af = i / (Math.pow(1 + i, n) - 1);
    
    const resultEl = document.getElementById('factors-calc-result');
    if (resultEl) {
      resultEl.innerHTML = `
        <table style="width:100%;border-collapse:collapse">
          <tr style="background:var(--surface)">
            <th style="padding:8px;text-align:left;border:1px solid var(--border)">Factor</th>
            <th style="padding:8px;text-align:right;border:1px solid var(--border)">Value</th>
          </tr>
          <tr><td style="padding:8px;border:1px solid var(--border)">(P/F, ${(i*100).toFixed(1)}%, ${n})</td><td style="padding:8px;text-align:right;border:1px solid var(--border)">${pf.toFixed(6)}</td></tr>
          <tr><td style="padding:8px;border:1px solid var(--border)">(F/P, ${(i*100).toFixed(1)}%, ${n})</td><td style="padding:8px;text-align:right;border:1px solid var(--border)">${fp.toFixed(6)}</td></tr>
          <tr><td style="padding:8px;border:1px solid var(--border)">(P/A, ${(i*100).toFixed(1)}%, ${n})</td><td style="padding:8px;text-align:right;border:1px solid var(--border)">${pa.toFixed(6)}</td></tr>
          <tr><td style="padding:8px;border:1px solid var(--border)">(F/A, ${(i*100).toFixed(1)}%, ${n})</td><td style="padding:8px;text-align:right;border:1px solid var(--border)">${fa.toFixed(6)}</td></tr>
          <tr><td style="padding:8px;border:1px solid var(--border)">(A/P, ${(i*100).toFixed(1)}%, ${n})</td><td style="padding:8px;text-align:right;border:1px solid var(--border)">${ap.toFixed(6)}</td></tr>
          <tr><td style="padding:8px;border:1px solid var(--border)">(A/F, ${(i*100).toFixed(1)}%, ${n})</td><td style="padding:8px;text-align:right;border:1px solid var(--border)">${af.toFixed(6)}</td></tr>
        </table>
      `;
    }
  }

  const factorsBtn = document.getElementById('factors-calc-btn');
  if (factorsBtn) {
    factorsBtn.addEventListener('click', calculateFactors);
    calculateFactors();
  }

  /* ========== EXAMPLE FORMULAS ========== */
  function renderExampleFormulas() {
    const e1 = document.getElementById('example-formula-1');
    const e2 = document.getElementById('example-formula-2');
    const e3 = document.getElementById('example-formula-3');
    const e4 = document.getElementById('example-formula-4');
    const e5 = document.getElementById('example-formula-5');
    const e6 = document.getElementById('example-formula-6');
    
    if (e1) e1.innerHTML = renderFormula('P = F \\times (P/F, i, n)', true);
    if (e2) e2.innerHTML = renderFormula('(P/F, 10\\%, 5) = 1/(1+0.10)^5 = 0.6209', true);
    if (e3) e3.innerHTML = renderFormula('P = 20000 \\times 0.6209 = 12418.43', true);
    if (e4) e4.innerHTML = renderFormula('CR = P \\times (A/P,i,n) - S \\times (A/F,i,n)', true);
    if (e5) e5.innerHTML = renderFormula('EUAC = CR + Annual Costs', true);
    if (e6) e6.innerHTML = renderFormula('EUAC \\approx 9280', true);
  }
  renderExampleFormulas();

  /* ========== GLOSSARY SEARCH ========== */
  const glossarySearch = document.getElementById('glossary-search');
  if (glossarySearch) {
    glossarySearch.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const categories = document.querySelectorAll('.glossary-category');
      let firstMatch = null;
      
      categories.forEach(category => {
        const rows = category.querySelectorAll('.glossary-table tbody tr');
        let hasVisible = false;
        
        rows.forEach(row => {
          const searchText = row.dataset.searchText?.toLowerCase() || '';
          const allText = row.textContent.toLowerCase();
          const matches = query === '' || searchText.includes(query) || allText.includes(query);
          
          row.classList.remove('highlighted');
          if (matches) {
            row.classList.remove('hidden');
            row.classList.add('highlighted');
            hasVisible = true;
            if (!firstMatch) firstMatch = row;
          } else {
            row.classList.add('hidden');
          }
        });
        
        if (hasVisible || query === '') {
          category.classList.remove('hidden');
        } else {
          category.classList.add('hidden');
        }
      });
      
      if (query.length >= 2 && firstMatch) {
        firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  /* ========== GLOBAL SEARCH ========== */
  const globalSearchInput = document.getElementById('global-search-input');
  if (globalSearchInput) {
    globalSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      
      if (query.length >= 2) {
        const knowledgeSearch = document.getElementById('topic-search');
        if (knowledgeSearch) {
          knowledgeSearch.value = query;
          knowledgeSearch.dispatchEvent(new Event('input'));
        }
        
        document.getElementById('hub').scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
})();
