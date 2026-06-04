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

  function fmtDay(ts) {
    try {
      return new Date(ts).toLocaleString();
    } catch (_) {
      return "";
    }
  }

  // Save score to Firebase
  function saveScore(name, score, difficulty) {
    console.log('[saveScore] Called with:', { name, score, difficulty });
    
    // Debug alert to verify it's being called
    alert('准备保存分数：名字=' + name + ' 分数=' + score + ' 难度=' + difficulty);
    
    // Check if name is empty
    if (!name || name.trim() === '') {
      alert('错误：名字为空，无法保存');
      console.error('[saveScore] Name is empty, cannot save');
      return;
    }
    
    if (window.firebaseDB) {
      const total = 12;
      const scoresRef = window.firebaseDB.ref('leaderboard/' + difficulty);
      const newScoreRef = scoresRef.push();
      
      const entry = {
        name: name,
        score: score,
        total: total,
        difficulty: difficulty,
        timestamp: Date.now(),
        date: new Date().toLocaleString()
      };
      
      console.log('[saveScore] Writing entry to Firebase:', entry);
      
      newScoreRef.set(entry)
      .then(() => {
        console.log('[saveScore] Successfully saved to Firebase!');
        alert('保存成功！');
      })
      .catch((error) => {
        console.error("[saveScore] Error saving score:", error);
        alert('保存失败：' + (error.message || error));
      });
    } else {
      console.warn('[saveScore] FirebaseDB not available');
      alert('Firebase 未加载，无法保存');
    }
  }

  // Load leaderboard from Firebase and render
  function renderLeaderboard(difficulty) {
    console.log('[renderLeaderboard] Called for difficulty:', difficulty);
    
    let rows = `<tr><td colspan="4" style="text-align:center;color:var(--muted)">Loading...</td></tr>`;
    
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
        <div class="leaderboard-scroll">
          <table class="lb-table">
            <thead><tr><th>#</th><th>Name</th><th>Score</th><th>When</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;

    lbRoot.querySelectorAll(".lb-tab").forEach((btn) => {
      btn.addEventListener("click", () => renderLeaderboard(btn.getAttribute("data-diff") || "easy"));
    });

    // Load from Firebase with real-time listener
    if (window.firebaseDB) {
      console.log('[renderLeaderboard] Setting up Firebase real-time listener');
      const scoresRef = window.firebaseDB.ref('leaderboard/' + difficulty);
      const topScoresQuery = scoresRef.orderByChild('score').limitToLast(30);
      
      // Remove any existing listeners first
      scoresRef.off();
      
      topScoresQuery.on('value', (snapshot) => {
        console.log('[renderLeaderboard] Received Firebase data update');
        const data = snapshot.val();
        const allScores = [];
        if (data) {
          Object.keys(data).forEach(key => {
            allScores.push({ ...data[key], id: key });
          });
        }
        
        // Process and sort
        const seen = new Set();
        const merged = [];
        allScores.sort((a, b) => b.score - a.score || a.timestamp - b.timestamp);
        
        for (const r of allScores) {
          const k = `${String(r.name).toLowerCase()}|${r.difficulty}`;
          if (seen.has(k)) continue;
          seen.add(k);
          merged.push(r);
        }
        const finalScores = merged.slice(0, 30);

        // Render with proper ranking (same score = same rank)
        rows = "";
        let currentRank = 0;
        let currentScore = null;
        let scoreCount = 0;
        
        finalScores.forEach((r, i) => {
          // 如果分数和上一个不同，重置排名
          if (r.score !== currentScore) {
            currentScore = r.score;
            currentRank = scoreCount + 1;
          }
          scoreCount++;
          rows += `<tr><td>${currentRank}</td><td>${escapeHtml(r.name)}</td><td>${r.score}/${r.total}</td><td>${fmtDay(r.timestamp)}</td></tr>`;
        });
        if (!rows) rows = `<tr><td colspan="4" style="text-align:center;color:var(--muted)">No scores yet.</td></tr>`;

        const tableBody = lbRoot.querySelector('tbody');
        if (tableBody) tableBody.innerHTML = rows;
        console.log('[renderLeaderboard] Leaderboard updated with', finalScores.length, 'scores');
      }, (error) => {
        console.error('[renderLeaderboard] Firebase listener error:', error);
      });
    }
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
    console.log('[showSetup] Called');
    state.phase = "setup";
    
    // Get last used name from localStorage
    let lastUsedName = "";
    try {
      lastUsedName = localStorage.getItem('econhub_last_name') || "";
      console.log('[showSetup] Loaded last name:', lastUsedName);
    } catch (e) {
      console.warn('[showSetup] Error reading last name from localStorage');
    }
    
    root.innerHTML = `
      <div class="challenge-card">
        <h3>Challenge mode</h3>
        <p class="muted">12 questions per run. Pick a difficulty, enter your name, then answer step by step. After each question you will see whether you were correct and a worked solution.</p>
        <div class="field-grid">
          <label class="field"><span>Your name</span><input id="ch-name" type="text" maxlength="24" autocomplete="nickname" placeholder="e.g. Alex" value="${escapeHtml(lastUsedName)}" /></label>
          <fieldset class="field">
            <legend>Difficulty</legend>
            <label><input type="radio" name="ch-diff" value="easy" ${state.difficulty === "easy" ? "checked" : ""} /> Easy</label>
            <label><input type="radio" name="ch-diff" value="medium" ${state.difficulty === "medium" ? "checked" : ""} /> Medium</label>
            <label><input type="radio" name="ch-diff" value="hard" ${state.difficulty === "hard" ? "checked" : ""} /> Hard</label>
          </fieldset>
        </div>
        <button type="button" class="btn btn-primary" id="ch-start">Start challenge</button>
        <p class="err" id="ch-err" role="alert"></p>
      </div>`;

    $("#ch-start", root).addEventListener("click", () => {
      console.log('[showSetup] Start button clicked');
      const nameInput = $("#ch-name", root);
      const name = (nameInput.value || "").trim();
      const diff = root.querySelector('input[name="ch-diff"]:checked')?.value || "easy";
      const err = $("#ch-err", root);
      err.textContent = "";
      
      if (name.length < 1) {
        err.textContent = "Please enter your name.";
        return;
      }
      
      // Save name to localStorage
      try {
        localStorage.setItem('econhub_last_name', name);
        console.log('[showSetup] Saved name to localStorage:', name);
      } catch (e) {
        console.warn('[showSetup] Error saving name to localStorage');
      }
      
      state.name = name.slice(0, 24);
      state.difficulty = diff;
      console.log('[showSetup] Starting challenge with:', { name: state.name, difficulty: state.difficulty });
      
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
    const prog = `Question ${state.idx + 1} of ${state.items.length}`;
    const promptMathHtml = q.promptMath ? `<div class="q-math">${katexOrPlain(q.promptMath, true)}</div>` : "";
    
    // 获取题型，默认是 choice
    const questionType = q.type || 'choice';
    
    root.innerHTML = `
      <div class="challenge-card">
        <div class="ch-progress"><span>${escapeHtml(prog)}</span><span>Score: ${state.score}</span></div>
        <p class="q-text">${escapeHtml(q.prompt)}</p>
        ${promptMathHtml}
        <div class="quiz-options" id="ch-opts"></div>
        <div id="ch-after" class="ch-after hidden"></div>
      </div>`;

    const opts = $("#ch-opts", root);

    // 根据题型渲染不同的 UI
    if (questionType === 'truefalse') {
      // 判断题：只有 True 和 False 两个按钮
      ['True', 'False'].forEach((label, idx) => {
        const b = document.createElement("button");
        b.type = "button";
        b.innerHTML = escapeHtml(label);
        b.addEventListener("click", () => answer(idx));
        opts.appendChild(b);
      });
      // 保存正确答案索引（True=0, False=1）
      state.shuffledCorrectIndex = q.correctIndex;
      
    } else if (questionType === 'fillblank') {
      // 填空题：显示输入框
      const inputHtml = `
        <div class="fillblank-container">
          <input type="text" id="ch-fillblank-input" class="fillblank-input" placeholder="Enter your answer..." autocomplete="off" />
          <button type="button" class="btn btn-primary" id="ch-fillblank-submit">Submit</button>
        </div>
      `;
      opts.innerHTML = inputHtml;
      
      // 添加提交事件
      const submitBtn = $("#ch-fillblank-submit", root);
      const inputField = $("#ch-fillblank-input", root);
      
      submitBtn.addEventListener("click", () => {
        const userAnswer = (inputField.value || "").trim();
        checkFillBlankAnswer(userAnswer, q.correctAnswer);
      });
      
      // 回车也能提交
      inputField.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          const userAnswer = (inputField.value || "").trim();
          checkFillBlankAnswer(userAnswer, q.correctAnswer);
        }
      });
      
    } else {
      // 默认选择题
      const sh = shuffleChoiceOrder(q.choices, q.correctIndex);
      state.shuffledCorrectIndex = sh.correctIndex;
      
      sh.labels.forEach((label, idx) => {
        const b = document.createElement("button");
        b.type = "button";
        
        // SUPER SIMPLE: if it has any English words of 2 or more letters, it's TEXT
        const hasRealWords = /[a-z]{2,}/i.test(label);
        
        // What is a formula?
        const isFormula = (
          // Short math patterns that don't have real words
          /^r\/\d+$/.test(label) ||
          /^\([A-Z]\/[A-Z]/.test(label) ||
          /\^\{?\d+/.test(label) && !hasRealWords ||
          /^ln/.test(label) ||
          /^e\^/.test(label) ||
          /^NPW\s*\=/.test(label)
        ) && !hasRealWords;
        
        let renderedContent;
        if (isFormula) {
          // Math
          try {
            let mathLabel = label
              .replace(/\$/g, '')
              .replace(/\^/g, '^')
              .replace(/\^/g, '^');
            renderedContent = katexOrPlain(mathLabel, false);
          } catch (e) {
            renderedContent = escapeHtml(label);
          }
        } else {
          // 99% of the time it's just TEXT!
          renderedContent = escapeHtml(label);
        }
        
        b.innerHTML = renderedContent;
        b.addEventListener("click", () => answer(idx));
        opts.appendChild(b);
      });
    }
  }

  // 处理填空题答案检查
  function checkFillBlankAnswer(userAnswer, correctAnswer) {
    const q = state.items[state.idx];
    const inputField = $("#ch-fillblank-input", root);
    const submitBtn = $("#ch-fillblank-submit", root);
    
    // 禁用输入和按钮
    if (inputField) inputField.disabled = true;
    if (submitBtn) submitBtn.disabled = true;
    
    // 检查答案（不区分大小写，去除空格）
    const normalizedUser = userAnswer.toLowerCase().replace(/\s+/g, '').replace(/[.,%$\\]/g, '');
    const normalizedCorrect = correctAnswer.toLowerCase().replace(/\s+/g, '').replace(/[.,%$\\]/g, '');
    const ok = normalizedUser === normalizedCorrect;
    
    if (ok) state.score += 1;
    
    // 显示反馈
    const after = $("#ch-after", root);
    after.classList.remove("hidden");
    
    let feedbackClass = ok ? "ok" : "bad";
    let feedbackText = ok ? "Correct!" : `Incorrect. The correct answer is: ${correctAnswer}`;
    
    after.innerHTML = `
      <div class="verdict ${feedbackClass}">${feedbackText}</div>
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
    console.log('[finishRun] Called');
    const total = state.items.length;
    
    // ALWAYS get name from localStorage to avoid it being lost
    let nameToSave = state.name;
    try {
      if (!nameToSave || nameToSave.trim() === '') {
        nameToSave = localStorage.getItem('econhub_last_name') || '';
        console.log('[finishRun] Got name from localStorage:', nameToSave);
      }
    } catch (e) {
      console.warn('[finishRun] Could not get name from localStorage');
    }
    
    const entry = {
      name: nameToSave,
      score: state.score,
      total: total,
      difficulty: state.difficulty,
      ts: Date.now(),
    };
    
    console.log('[finishRun] Final score:', entry.score, '/', total);
    console.log('[finishRun] Player data:', { name: entry.name, difficulty: entry.difficulty });
    
    // Save to Firebase
    saveScore(nameToSave, state.score, state.difficulty);

    root.innerHTML = `
      <div class="challenge-card">
        <h3>Run complete</h3>
        <p class="big-score">${entry.score} / ${entry.total}</p>
        <p class="muted">${escapeHtml(entry.name)} · ${escapeHtml(entry.difficulty)} · Saved to leaderboard.</p>
        <button type="button" class="btn" id="ch-again">Play again</button>
      </div>`;
      
    $("#ch-again", root).addEventListener("click", () => {
      console.log('[finishRun] Play again button clicked');
      playAgain();
    });
    
    console.log('[finishRun] Refreshing leaderboard');
    renderLeaderboard(state.difficulty);
  }

  function playAgain() {
    console.log('[playAgain] Called');
    showSetup();
  }

  showSetup();
  renderLeaderboard("easy");
})();
