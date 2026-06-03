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
  const defaultFlows = [-800, 0, 500, 500, 2000];

  function buildCfdTable(n) {
    const tb = $("#cfd-table tbody");
    if (!tb) return;
    tb.innerHTML = "";
    const prev = [];
    for (let t = 0; t <= n; t++) prev[t] = defaultFlows[t] ?? 0;
    for (let t = 0; t <= n; t++) {
      const tr = document.createElement("tr");
      tr.dataset.t = t;
      tr.innerHTML = `
        <td>${t}</td>
        <td>
          <div class="cfd-cf-group">
            <input type="number" step="any" class="cfd-cf" data-t="${t}" data-idx="0" value="${prev[t]}" aria-label="Cash flow at period ${t}" />
            <button type="button" class="cfd-add-btn" data-t="${t}" aria-label="Add another cash flow at period ${t}">+</button>
          </div>
        </td>
        <td class="cfd-hint">${prev[t] > 0 ? "Inflow" : prev[t] < 0 ? "Outflow" : "—"}</td>`;
      tb.appendChild(tr);
    }
    tb.querySelectorAll(".cfd-cf").forEach((inp) => {
      inp.addEventListener("input", () => {
        updateCfdRow(inp);
        drawCfd();
      });
    });
    tb.querySelectorAll(".cfd-add-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const t = Number(btn.dataset.t);
        const row = btn.closest("tr");
        const group = row.querySelector(".cfd-cf-group");
        const inputs = group.querySelectorAll(".cfd-cf");
        const idx = inputs.length;
        const newInput = document.createElement("div");
        newInput.className = "cfd-cf-row";
        newInput.innerHTML = `
          <input type="number" step="any" class="cfd-cf" data-t="${t}" data-idx="${idx}" value="0" aria-label="Cash flow ${idx + 1} at period ${t}" />
          <button type="button" class="cfd-remove-btn" aria-label="Remove this cash flow">×</button>`;
        group.appendChild(newInput);
        const newInp = newInput.querySelector(".cfd-cf");
        const rmBtn = newInput.querySelector(".cfd-remove-btn");
        newInp.addEventListener("input", () => {
          updateCfdRow(newInp);
          drawCfd();
        });
        rmBtn.addEventListener("click", () => {
          group.removeChild(newInput);
          updateCfdHints();
          drawCfd();
        });
        drawCfd();
      });
    });
  }

  function updateCfdRow(inp) {
    const row = inp.closest("tr");
    const hint = row.querySelector(".cfd-hint");
    const t = Number(row.dataset.t);
    const total = getTotalFlow(t);
    if (hint) hint.textContent = total > 0 ? "Inflow" : total < 0 ? "Outflow" : "—";
  }

  function updateCfdHints() {
    document.querySelectorAll("#cfd-table tbody tr").forEach((row) => {
      const t = Number(row.dataset.t);
      const hint = row.querySelector(".cfd-hint");
      const total = getTotalFlow(t);
      if (hint) hint.textContent = total > 0 ? "Inflow" : total < 0 ? "Outflow" : "—";
    });
  }

  function getTotalFlow(t) {
    const inputs = document.querySelectorAll(`.cfd-cf[data-t="${t}"]`);
    let total = 0;
    inputs.forEach((inp) => {
      total += Number(inp.value) || 0;
    });
    return total;
  }

  function readFlows(n) {
    const arr = [];
    for (let t = 0; t <= n; t++) {
      const inputs = document.querySelectorAll(`.cfd-cf[data-t="${t}"]`);
      const flows = [];
      inputs.forEach((inp) => {
        const v = Number(inp.value);
        if (v !== 0) flows.push(v);
      });
      arr[t] = flows.length > 0 ? flows : 0;
    }
    return arr;
  }

  function drawCfd() {
    const svg = $("#svg-cfd");
    const nEl = $("#cfd-n");
    if (!svg || !nEl) return;
    const n = clamp(Number(nEl.value) || 4, 1, 12);
    const flows = readFlows(n);
    const W = 360;
    const H = 300;
    const padL = 40;
    const padR = 20;
    const padT = 35;
    const padB = 75;
    const baseY = H - padB;
    const x0 = padL;
    const x1 = W - padR;
    const span = Math.max(1, n);
    const gx = (t) => x0 + (t / span) * (x1 - x0);

    let maxAbs = 1;
    flows.forEach((v) => {
      if (Array.isArray(v)) {
        const total = v.reduce((sum, val) => sum + val, 0);
        maxAbs = Math.max(maxAbs, Math.abs(total) || 0);
      } else {
        maxAbs = Math.max(maxAbs, Math.abs(v) || 0);
      }
    });
    const scale = (v) => {
      if (maxAbs === 0) return 20;
      const normalized = Math.abs(v) / maxAbs;
      const length = normalized * 120;
      return Math.max(length, 8);
    };

    const colors = getColors();
    let h = `<title>Cash flow diagram</title>`;
    h += `<rect width="${W}" height="${H}" fill="${colors.bg}"/>`;
    h += `<line x1="${x0}" y1="${baseY}" x2="${x1}" y2="${baseY}" stroke="${colors.line}" stroke-width="2"/>`;
    h += `<polygon points="${x1},${baseY} ${x1 - 8},${baseY - 4} ${x1 - 8},${baseY + 4}" fill="${colors.line}"/>`;
    h += `<text x="${x1 + 2}" y="${baseY + 4}" fill="${colors.muted}" font-size="12">time</text>`;

    for (let t = 0; t <= n; t++) {
      const x = gx(t);
      h += `<text x="${x}" y="${baseY + 22}" text-anchor="middle" fill="${colors.muted}" font-size="12">${t}</text>`;
      const flowData = flows[t];
      if (!flowData) continue;
      
      const total = Array.isArray(flowData) 
        ? flowData.reduce((sum, val) => sum + val, 0) 
        : flowData;
      
      if (total === 0) continue;
      
      const len = scale(total);
      const up = total > 0;
      const y1 = up ? baseY - len : baseY + len;
      const col = up ? colors.positive : colors.negative;
      h += `<line x1="${x}" y1="${baseY}" x2="${x}" y2="${y1}" stroke="${col}" stroke-width="2.5"/>`;
      const ty = up ? y1 - 6 : y1 + 14;
      h += `<text x="${x}" y="${ty}" text-anchor="middle" fill="${col}" font-size="12" font-weight="500">${total}</text>`;
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

    const W = 360;
    const H = 280;
    const padL = 40;
    const padR = 20;
    const padT = 35;
    const padB = 50;
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
    h += `<text x="${W/2}" y="18" text-anchor="middle" fill="${colors.text}" font-size="14">Terminal wealth by year k (discrete points)</text>`;
    h += `<line x1="${x0}" y1="${y0}" x2="${xMax}" y2="${y0}" stroke="${colors.line}" stroke-width="2"/>`;
    h += `<line x1="${x0}" y1="${y0}" x2="${x0}" y2="${padT}" stroke="${colors.line}" stroke-width="2"/>`;
    h += `<polygon points="${xMax},${y0} ${xMax - 6},${y0 - 3} ${xMax - 6},${y0 + 3}" fill="${colors.line}"/>`;
    h += `<polygon points="${x0},${padT} ${x0 - 3},${padT + 6} ${x0 + 3},${padT + 6}" fill="${colors.line}"/>`;
    h += `<text x="${x0 + (xMax - x0)/2}" y="${y0 + 28}" text-anchor="middle" fill="${colors.muted}" font-size="11">Year k</text>`;
    h += `<text x="12" y="${padT + (y0 - padT)/2}" text-anchor="middle" fill="${colors.muted}" font-size="11" transform="rotate(-90, 12, ${padT + (y0 - padT)/2})">Terminal wealth ($)</text>`;
    h += `<path d="${dS.trim()}" fill="none" stroke="${colors.simple}" stroke-width="2.5" stroke-dasharray="7 5"/>`;
    h += `<path d="${dC.trim()}" fill="none" stroke="${colors.compound}" stroke-width="2.5"/>`;
    h += `<text x="${xMax - 200}" y="${padT + 14}" fill="${colors.simple}" font-size="12">Simple: F<tspan baseline-shift="sub" font-size="9">k</tspan> = P(1 + i·k)</text>`;
    h += `<text x="${xMax - 200}" y="${padT + 30}" fill="${colors.compound}" font-size="12">Compound: F<tspan baseline-shift="sub" font-size="9">k</tspan> = P(1+i)<tspan baseline-shift="super" font-size="9">k</tspan></text>`;
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
