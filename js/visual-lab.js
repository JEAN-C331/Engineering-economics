/**
 * Interactive cash-flow timeline + simple vs compound wealth plot.
 * Expects DOM: #svg-cfd, #cfd-table tbody, #cfd-n, #cfd-reset
 *             #svg-sc, #sc-p, #sc-i, #sc-n
 */
(function () {
  const $ = (sel, r = document) => r.querySelector(sel);

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function isLightMode() {
    return !document.body.classList.contains('theme-dark');
  }

  function getColors() {
    if (isLightMode()) {
      return {
        bg: '#ffffff',
        text: '#1e293b',
        muted: '#64748b',
        line: '#cbd5e1',
        positive: '#059669',
        negative: '#dc2626',
        simple: '#64748b',
        compound: '#2563eb'
      };
    }
    return {
      bg: '#1e293b',
      text: '#ffffff',
      muted: '#e2e8f0',
      line: '#64748b',
      positive: '#22d3ee',
      negative: '#f87171',
      simple: '#cbd5e1',
      compound: '#38bdf8'
    };
  }

  /* ---------- Cash flow diagram ---------- */
  const defaultFlows = [-1000, 0, 500, 500, 2000];

  function buildCfdTable(n) {
    const tb = $("#cfd-table tbody");
    if (!tb) return;
    tb.innerHTML = "";
    const prev = [];
    for (let t = 0; t <= n; t++) prev[t] = defaultFlows[t] ?? 0;
    for (let t = 0; t <= n; t++) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${t}</td>
        <td><input type="number" step="any" class="cfd-cf" data-t="${t}" value="${prev[t]}" aria-label="Cash flow at period ${t}" /></td>
        <td class="cfd-hint">${prev[t] > 0 ? "Inflow" : prev[t] < 0 ? "Outflow" : "—"}</td>`;
      tb.appendChild(tr);
    }
    tb.querySelectorAll(".cfd-cf").forEach((inp) => {
      inp.addEventListener("input", () => {
        const row = inp.closest("tr");
        const hint = row && row.querySelector(".cfd-hint");
        const v = Number(inp.value);
        if (hint) hint.textContent = v > 0 ? "Inflow" : v < 0 ? "Outflow" : "—";
        drawCfd();
      });
    });
  }

  function readFlows(n) {
    const arr = [];
    for (let t = 0; t <= n; t++) {
      const inp = document.querySelector(`.cfd-cf[data-t="${t}"]`);
      arr[t] = inp ? Number(inp.value) : 0;
    }
    return arr;
  }

  function drawCfd() {
    const svg = $("#svg-cfd");
    const nEl = $("#cfd-n");
    if (!svg || !nEl) return;
    const n = clamp(Number(nEl.value) || 4, 1, 12);
    const flows = readFlows(n);
    const W = 640;
    const H = 260;
    const padL = 55;
    const padR = 30;
    const padT = 45;
    const padB = 80;
    const baseY = H - padB;
    const x0 = padL;
    const x1 = W - padR;
    const span = Math.max(1, n);
    const gx = (t) => x0 + (t / span) * (x1 - x0);

    let maxAbs = 1;
    flows.forEach((v) => (maxAbs = Math.max(maxAbs, Math.abs(v) || 0)));
    const scale = (v) => clamp(18 + (Math.log10(1 + (Math.abs(v) / maxAbs) * 9) / Math.log10(10)) * 55, 16, 85);

    const colors = getColors();
    let h = `<title>Cash flow diagram</title>`;
    h += `<rect width="${W}" height="${H}" fill="${colors.bg}"/>`;
    h += `<text x="${padL}" y="22" fill="${colors.text}" font-size="14">Signed cash flows (edit table) →</text>`;
    h += `<line x1="${x0}" y1="${baseY}" x2="${x1}" y2="${baseY}" stroke="${colors.line}" stroke-width="2"/>`;
    h += `<polygon points="${x1},${baseY} ${x1 - 8},${baseY - 4} ${x1 - 8},${baseY + 4}" fill="${colors.line}"/>`;
    h += `<text x="${x1 + 2}" y="${baseY + 4}" fill="${colors.muted}" font-size="12">time</text>`;

    for (let t = 0; t <= n; t++) {
      const x = gx(t);
      h += `<text x="${x}" y="${baseY + 22}" text-anchor="middle" fill="${colors.muted}" font-size="12">${t}</text>`;
      const v = flows[t];
      if (!v) continue;
      const len = scale(v);
      const up = v > 0;
      const y1 = up ? baseY - len : baseY + len;
      const col = up ? colors.positive : colors.negative;
      h += `<line x1="${x}" y1="${baseY}" x2="${x}" y2="${y1}" stroke="${col}" stroke-width="3"/>`;
      const ty = up ? y1 - 6 : y1 + 14;
      h += `<text x="${x}" y="${ty}" text-anchor="middle" fill="${col}" font-size="12">${v}</text>`;
    }
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("role", "img");
    svg.innerHTML = h;
  }

  const nEl = $("#cfd-n");
  const resetBtn = $("#cfd-reset");
  if (nEl) {
    ["change", "input"].forEach((ev) =>
      nEl.addEventListener(ev, () => {
        const n = clamp(Number(nEl.value) || 4, 1, 12);
        nEl.value = String(n);
        buildCfdTable(n);
        drawCfd();
      })
    );
  }
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (nEl) nEl.value = "4";
      buildCfdTable(4);
      const inps = document.querySelectorAll(".cfd-cf");
      defaultFlows.forEach((v, i) => {
        if (inps[i]) {
          inps[i].value = String(v);
          inps[i].dispatchEvent(new Event("input"));
        }
      });
      drawCfd();
    });
  }

  const initN = nEl ? clamp(Number(nEl.value) || 4, 1, 12) : 4;
  if (nEl) nEl.value = String(initN);
  buildCfdTable(initN);
  drawCfd();

  /* ---------- Simple vs compound ---------- */
  function drawSc() {
    const svg = $("#svg-sc");
    const pEl = $("#sc-p");
    const iEl = $("#sc-i");
    const nEl2 = $("#sc-n");
    if (!svg || !pEl || !iEl || !nEl2) return;
    const P = Math.max(1, Number(pEl.value) || 1000);
    const i = Math.max(0, Number(iEl.value) / 100 || 0.08);
    const n = clamp(Math.round(Number(nEl2.value) || 5), 1, 25);

    const W = 640;
    const H = 240;
    const padL = 50;
    const padR = 20;
    const padT = 28;
    const padB = 40;
    const x0 = padL;
    const y0 = H - padB;
    const xMax = W - padR;
    const fSimple = (k) => P * (1 + i * k);
    const fComp = (k) => P * Math.pow(1 + i, k);
    let fMax = P;
    for (let k = 0; k <= n; k++) {
      fMax = Math.max(fMax, fSimple(k), fComp(k));
    }
    const fMin = P;
    const gy = (F) => y0 - ((F - fMin) / (fMax - fMin || 1)) * (y0 - padT);

    let dS = "";
    let dC = "";
    for (let k = 0; k <= n; k++) {
      const x = x0 + (k / n) * (xMax - x0);
      const ys = gy(fSimple(k));
      const yc = gy(fComp(k));
      dS += (k === 0 ? "M" : "L") + ` ${x.toFixed(1)} ${ys.toFixed(1)} `;
      dC += (k === 0 ? "M" : "L") + ` ${x.toFixed(1)} ${yc.toFixed(1)} `;
    }

    const colors = getColors();
    let h = `<rect width="${W}" height="${H}" fill="${colors.bg}"/>`;
    h += `<text x="${padL}" y="18" fill="${colors.text}" font-size="14">Terminal wealth by year k (discrete points)</text>`;
    h += `<line x1="${x0}" y1="${y0}" x2="${xMax}" y2="${y0}" stroke="${colors.line}" stroke-width="2"/>`;
    h += `<line x1="${x0}" y1="${y0}" x2="${x0}" y2="${padT}" stroke="${colors.line}" stroke-width="2"/>`;
    h += `<path d="${dS.trim()}" fill="none" stroke="${colors.simple}" stroke-width="2.5" stroke-dasharray="7 5"/>`;
    h += `<path d="${dC.trim()}" fill="none" stroke="${colors.compound}" stroke-width="2.5"/>`;
    h += `<text x="${xMax - 200}" y="${padT + 14}" fill="${colors.simple}" font-size="12">Simple: Fk = P(1 + i·k)</text>`;
    h += `<text x="${xMax - 200}" y="${padT + 30}" fill="${colors.compound}" font-size="12">Compound: Fk = P(1+i)^k</text>`;
    h += `<text x="${x0}" y="${H - 10}" fill="${colors.muted}" font-size="11">k = 0…${n}</text>`;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.innerHTML = h;
  }

  ["#sc-p", "#sc-i", "#sc-n"].forEach((sel) => {
    const el = $(sel);
    if (el) el.addEventListener("input", drawSc);
  });
  drawSc();

  // Redraw charts when theme changes
  function initThemeObserver() {
    const body = document.body;
    if (body) {
      const themeObserver = new MutationObserver(() => {
        drawCfd();
        drawSc();
      });
      themeObserver.observe(body, { attributes: true, attributeFilter: ['class'] });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeObserver);
  } else {
    initThemeObserver();
  }
})();
