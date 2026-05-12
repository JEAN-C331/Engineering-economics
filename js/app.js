(function () {
  const topics = window.KNOWLEDGE_TOPICS || [];
  const tracks = window.KNOWLEDGE_TRACKS || { all: "All" };
  const $ = (sel, root = document) => root.querySelector(sel);
  const listEl = $("#topic-list");
  const searchEl = $("#topic-search");
  const countEl = $("#topic-count");
  if (!listEl || !searchEl || !countEl) return;

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
  searchEl.addEventListener("input", renderTopics);
  renderTopics();

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
  const inP = $("#in-p");
  const inR = $("#in-r");
  const inT = $("#in-t");
  const inM = $("#in-m");
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

  function recalcFv() {
    if (!inP || !inR || !inT || !inM || !labP || !outF) return;
    const P = Number(inP.value);
    const r = Number(inR.value) / 100;
    const t = Number(inT.value);
    const m = Math.max(1, Math.round(Number(inM.value)));
    labP.textContent = fmtMoney(P);
    labR.textContent = `${Number(inR.value).toFixed(1)}%`;
    labT.textContent = String(t);
    labM.textContent = String(m);
    const F = P * Math.pow(1 + r / m, m * t);
    const ia = Math.pow(1 + r / m, m) - 1;
    outF.textContent = "$" + fmtMoney(F);
    outIa.textContent = fmtPct(ia);
  }

  [inP, inR, inT, inM].forEach((el) => el && el.addEventListener("input", recalcFv));
  recalcFv();

  const fvFormulaEl = $("#fv-formula-katex");
  if (fvFormulaEl) {
    fvFormulaEl.innerHTML = renderFormula(String.raw`F=P\left(1+\frac{r}{m}\right)^{mt},\qquad i_a=\left(1+\frac{r}{m}\right)^m-1`);
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
      explain:
        "Compute i_a = (1 + r/m)^m − 1 for each. Monthly compounding on A increases its effective rate more than the smaller nominal suggests.",
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
        { label: "i_a = e^r − 1 (verify notation in your text)", ok: true },
        { label: "i_a = r always", ok: false },
        { label: "i_a = ln(r)", ok: false },
      ],
      explain: "Pair continuous compounding with the textbook’s definition of r; many texts use i_a = e^r − 1 for the annual effective analogue.",
    },
  ];
  let scenIdx = 0;

  function renderLoanGame() {
    const boxQ = $("#loan-scenario");
    const boxO = $("#loan-options");
    const fb = $("#loan-feedback");
    const s = scenarios[scenIdx % scenarios.length];
    boxQ.textContent = s.text;
    boxO.innerHTML = "";
    fb.textContent = "";
    s.options.forEach((opt) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = opt.label;
      b.addEventListener("click", () => {
        [...boxO.children].forEach((c) => (c.disabled = true));
        b.classList.add(opt.ok ? "correct" : "wrong");
        fb.textContent = opt.ok ? "Nice — " + s.explain : "Not quite — " + s.explain;
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
    item.opts.forEach((o) => {
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
    { front: "NPW (word form)", tex: String.raw`\begin{aligned}\mathrm{NPW}&=\mathrm{PW}_{\text{benefits}}\\&\quad-\mathrm{PW}_{\text{costs}}\end{aligned}` },
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
        <div class="flash-face flash-back katex-mini formula-sheet">${renderFormula(c.tex, true)}</div>
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
})();
