(function() {
  // 工具说明数据
  const toolDescriptions = {
    npw: {
      icon: '📊',
      name: 'NPV Calculation',
      description: 'Net Present Worth (NPV) is the present value of cash inflows minus the present value of cash outflows.',
      useCase: 'Suitable for: Evaluating single projects or comparing projects when cash flows are known.',
      formula: 'NPV = Σ CF_t / (1 + r)^t  for t from 0 to n',
      pitfalls: '⚠️ Common mistake: Forgetting that NPV depends on MARR!',
      note: 'Positive NPV means the project is economically attractive at that MARR.'
    },
    irr: {
      icon: '📈',
      name: 'IRR Analysis',
      description: 'Internal Rate of Return (IRR) is the discount rate that makes NPV = 0.',
      useCase: 'Suitable for: Independent projects, understanding return potential.',
      formula: '0 = Σ CF_t / (1 + IRR)^t',
      pitfalls: '⚠️ Common mistake: Using IRR for mutually exclusive projects!',
      note: 'IRR is unreliable with unconventional cash flows (multiple sign changes).'
    },
    delta: {
      icon: '⚖️',
      name: 'Incremental IRR',
      description: 'Compare the difference between two projects\' cash flows.',
      useCase: 'Suitable for: Mutually exclusive projects, especially different sizes.',
      formula: 'Calculate ΔCF = CF_larger - CF_smaller, then find ΔIRR',
      pitfalls: '⚠️ Always compare incrementally! Never just pick higher IRR.',
      note: 'If ΔIRR ≥ MARR, choose the larger project. Otherwise, choose the smaller.'
    },
    chart: {
      icon: '📉',
      name: 'NPV Curve Plot',
      description: 'Plot NPV vs. discount rate to see how sensitive the project is.',
      useCase: 'Suitable for: Understanding project sensitivity, multiple IRR check.',
      formula: 'Plot NPV on Y-axis, discount rate on X-axis.',
      pitfalls: '⚠️ Check for multiple crossings of zero!',
      note: 'Where NPV crosses zero are the project\'s IRR(s).'
    },
    err: {
      icon: '⚡',
      name: 'External Rate of Return',
      description: 'ERR avoids multiple IRR problem by using a reinvestment rate.',
      useCase: 'Suitable for: Projects with unconventional cash flows.',
      formula: 'ERR uses explicit reinvestment rate (usually MARR).',
      pitfalls: '⚠️ Make sure to use appropriate reinvestment assumption.',
      note: 'ERR is unique and avoids multiple IRR problem!'
    },
    aw: {
      icon: '📅',
      name: 'Annual Worth Method',
      description: 'Convert all cash flows into equivalent uniform annual series.',
      useCase: 'Suitable for: Projects with different lives, annual budget comparison.',
      formula: 'AW = NPV × (A/P, i, n)',
      pitfalls: '⚠️ Perfect for comparing different lives! No need for repeat assumptions.',
      note: 'If AW > 0, project is acceptable; higher AW is better!'
    },
    marginal: {
      icon: '🎯',
      name: 'Marginal Cash Flow',
      description: 'Focus only on future cash flows that change with a decision.',
      useCase: 'Suitable for: Sunk cost decisions, project continuation.',
      formula: 'Ignore sunk costs. Analyze only future costs and benefits.',
      pitfalls: '⚠️ Sunk costs are gone forever! Don\'t cry over spilled milk.',
      note: 'Ask: "What changes from this point onward?"'
    }
  };

  // 完整的5个案例数据
  const cases = [
    {
      id: 'irr-trap',
      title: 'The IRR Trap',
      narrative: 'The boss excitedly says: "Project A has IRR 28%, crushing B\'s 15%!"',
      number: '#001',
      cashflows: {
        A: [-100000, 50000, 50000, 50000],
        B: [-500000, 200000, 200000, 200000],
        delta: [-400000, 150000, 150000, 150000]
      },
      marr: 0.10,
      question: 'Which project should you choose?',
      voteOptions: [
        { id: 'A', text: 'Project A (IRR 28%)', isWrong: true },
        { id: 'B', text: 'Project B (IRR 15%)', isWrong: false }
      ],
      correctAnswer: 'Project B',
      wrongAnswer: 'Project A',
      tools: [
        { id: 'npw', name: 'NPV Calculation', isWrong: false },
        { id: 'irr', name: 'IRR Analysis', isWrong: true },
        { id: 'delta', name: 'Incremental IRR', isWrong: false }
      ],
      requiredTool: 'delta',
      revelationText: 'Mutually exclusive projects compare incremental IRR, not just IRR! The scale effect fools your intuition.',
      prescription: 'For mutually exclusive projects, compare incremental cash flows using ΔIRR or NPV, not just individual IRRs!',
      visualType: 'bar',
      knowledge: 'Size matters! Small projects can have high IRR but low absolute value. Large projects with lower IRR may create more wealth.'
    },
    {
      id: 'npw-betrayal',
      title: 'NPW Curve Betrayal',
      narrative: 'NPV is positive at MARR 10%—looks like a sure thing! But there\'s a catch.',
      number: '#002',
      cashflows: [-1000, 500, 500, 500, -800],
      marr: 0.10,
      question: 'What should you do?',
      voteOptions: [
        { id: 'accept', text: 'Accept the project (NPV > 0)', isWrong: true },
        { id: 'reject', text: 'Reject and analyze more carefully', isWrong: false }
      ],
      correctAnswer: 'Analyze carefully',
      wrongAnswer: 'Accept the project',
      tools: [
        { id: 'npw', name: 'NPV Calculation', isWrong: false },
        { id: 'chart', name: 'NPV Curve Plot', isWrong: false },
        { id: 'err', name: 'External Rate of Return', isWrong: false }
      ],
      requiredTool: 'chart',
      revelationText: 'Non-conventional cash flows can have multiple IRR! The decision rule fails in these cases.',
      prescription: 'For non-conventional cash flows, always plot the NPV curve or use External Rate of Return (ERR).',
      visualType: 'npw-curve',
      knowledge: 'Multiple sign changes in cash flows = multiple IRR solutions. NPV curve analysis is your best friend here.'
    },
    {
      id: 'lifespan-illusion',
      title: 'The Lifespan Illusion',
      narrative: 'Machine A: 3 years, Machine B: 6 years. Direct NPV comparison is misleading.',
      number: '#003',
      cashflows: {
        A: [-50000, 20000, 20000, 20000],
        B: [-80000, 25000, 25000, 25000, 25000, 25000, 25000]
      },
      marr: 0.08,
      question: 'How should you compare them?',
      voteOptions: [
        { id: 'direct', text: 'Direct NPV comparison', isWrong: true },
        { id: 'aw', text: 'Annual Worth (AW) method', isWrong: false }
      ],
      correctAnswer: 'Annual Worth method',
      wrongAnswer: 'Direct comparison',
      tools: [
        { id: 'npw', name: 'NPV (Common Period)', isWrong: false },
        { id: 'aw', name: 'Annual Worth Method', isWrong: false }
      ],
      requiredTool: 'aw',
      revelationText: 'Annual Worth naturally eliminates lifespan differences! No need for complicated repeat assumptions.',
      prescription: 'For projects with different lives, Annual Worth (AW) is the cleanest comparison method.',
      visualType: 'dual',
      knowledge: 'AW automatically spreads costs equally over time, making lifespan differences irrelevant.'
    },
    {
      id: 'sunk-cost',
      title: 'The Sunk Cost Ghost',
      narrative: 'Already spent $2M, now NPV looks negative. The boss says: "We can\'t quit now!"',
      number: '#004',
      cashflows: {
        spent: -2000000,
        future: [-1000000, 800000],
        marginal: [-1000000, 800000]
      },
      marr: 0.10,
      question: 'What\'s the right move?',
      voteOptions: [
        { id: 'continue', text: 'Continue to avoid losing $2M', isWrong: true },
        { id: 'stop', text: 'Stop immediately', isWrong: false }
      ],
      correctAnswer: 'Stop immediately',
      wrongAnswer: 'Continue investing',
      tools: [
        { id: 'marginal', name: 'Marginal Cash Flow', isWrong: false },
        { id: 'npw', name: 'Full Cash Flow', isWrong: true }
      ],
      requiredTool: 'marginal',
      revelationText: 'Sunk costs are gone! Only future cash flows matter for decision-making.',
      prescription: 'Sunk costs are irrelevant. Focus only on marginal cash flows from this point forward.',
      visualType: 'ghost',
      knowledge: 'Economics looks forward. What\'s spent is spent—don\'t throw good money after bad!'
    },
    {
      id: 'marr-darkside',
      title: 'MARR\'s Dark Side',
      narrative: 'MARR drops from 12% to 8%—all projects look great! But the optimal choice may flip.',
      number: '#005',
      cashflows: {
        X: [-1000000, 250000, 250000, 250000, 250000, 250000],
        Y: [-2000000, 450000, 450000, 450000, 450000, 450000],
        Z: [-3000000, 650000, 650000, 650000, 650000, 650000]
      },
      marr: 0.08,
      question: 'Which project is best at MARR = 8%?',
      voteOptions: [
        { id: 'X', text: 'Project X', isWrong: true },
        { id: 'Y', text: 'Project Y', isWrong: false },
        { id: 'Z', text: 'Project Z', isWrong: true }
      ],
      correctAnswer: 'Project Y',
      wrongAnswer: 'Any other choice',
      tools: [
        { id: 'npw', name: 'NPV Rank', isWrong: true },
        { id: 'delta', name: 'Incremental Analysis', isWrong: false }
      ],
      requiredTool: 'delta',
      revelationText: 'Highest NPV doesn\'t always mean best choice! Incremental IRR analysis is required.',
      prescription: 'For mutually exclusive alternatives, always use incremental analysis—don\'t just rank by NPV!',
      visualType: 'marr',
      knowledge: 'The MARR is a filter. When it moves, the order of "best" projects can completely flip.'
    }
  ];

  // 游戏状态，带本地存储
  let gameState = loadGameState();

  // 辅助函数：格式化金钱
  function formatMoney(amount) {
    return '$' + Math.round(amount).toLocaleString('en-US');
  }

  // 辅助函数：计算NPV
  function calculateNPW(cashflows, rate) {
    return cashflows.reduce((sum, cf, t) => sum + cf / Math.pow(1 + rate, t), 0);
  }

  // 本地存储保存和加载
  function saveGameState() {
    try {
      localStorage.setItem('bankruptcyDoctorGame', JSON.stringify({
        completedLevels: gameState.completedLevels,
        mistakes: gameState.mistakes,
        totalAttempts: gameState.totalAttempts || 0,
        correctAttempts: gameState.correctAttempts || 0,
        currentLevel: gameState.currentLevel
      }));
    } catch (e) {
      console.log('Could not save game state to localStorage');
    }
  }

  function loadGameState() {
    try {
      const saved = localStorage.getItem('bankruptcyDoctorGame');
      if (saved) {
        const data = JSON.parse(saved);
        return {
          currentLevel: data.currentLevel || 0,
          currentStage: 'intro',
          userVote: null,
          selectedTool: null,
          mistakes: data.mistakes || [],
          completedLevels: data.completedLevels || [],
          totalAttempts: data.totalAttempts || 0,
          correctAttempts: data.correctAttempts || 0,
          timer: null,
          timeLeft: 15,
          chart: null,
          ecgState: 'normal' // 'normal', 'fast', 'erratic'
        };
      }
    } catch (e) {
      console.log('Could not load game state from localStorage');
    }
    return {
      currentLevel: 0,
      currentStage: 'intro',
      userVote: null,
      selectedTool: null,
      mistakes: [],
      completedLevels: [],
      totalAttempts: 0,
      correctAttempts: 0,
      timer: null,
      timeLeft: 15,
      chart: null,
      ecgState: 'normal'
    };
  }

  // 更新进度面板
  function updateProgressDashboard() {
    const completedCount = gameState.completedLevels.length;
    const accuracy = gameState.totalAttempts > 0 
      ? Math.round((gameState.correctAttempts / gameState.totalAttempts) * 100) 
      : 100;
    const mastery = Math.round((completedCount / cases.length) * 100);

    const completedEl = document.getElementById('completed-count');
    const accuracyEl = document.getElementById('accuracy-rate');
    const masteryEl = document.getElementById('mastery-level');

    if (completedEl) completedEl.textContent = completedCount;
    if (accuracyEl) accuracyEl.textContent = accuracy + '%';
    if (masteryEl) masteryEl.textContent = mastery + '%';
  }

  // 初始化游戏
  function initGame() {
    // 确保工具弹窗一开始是隐藏的
    const popup = document.getElementById('tool-popup');
    if (popup) {
      popup.classList.add('hidden');
    }
    
    bindEvents();
    // 监听主题变化，重新绘制心电图
    const body = document.body;
    const themeObserver = new MutationObserver(() => {
      // 主题变化时重新绘制心电图
      if (gameState.currentStage === 'intro') {
        drawECGChart();
      }
    });
    themeObserver.observe(body, { attributes: true, attributeFilter: ['class'] });
    
    loadLevel(gameState.currentLevel);
    drawECGChart();
    updateProgressDashboard();
  }

  function bindEvents() {
    // 关卡选择
    document.querySelectorAll('.level-item').forEach(el => {
      el.addEventListener('click', () => {
        loadLevel(parseInt(el.dataset.level));
      });
    });

    // 开始诊断
    const startBtn = document.getElementById('btn-intro-next');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        showStage('vote');
        startTimer();
      });
    }

    // 工具选择
    const toolNextBtn = document.getElementById('btn-tool-next');
    if (toolNextBtn) {
      toolNextBtn.addEventListener('click', () => {
        if (gameState.selectedTool) {
          // 检查工具是否合适
          const currentCase = cases[gameState.currentLevel];
          const toolConfig = currentCase.tools.find(t => t.id === gameState.selectedTool);
          
          if (toolConfig.isWrong) {
            gameState.ecgState = 'erratic';
            alert('Hmm, that tool may not reveal the full picture... Let\'s try it anyway, but remember the result could be misleading!');
          }
          
          showStage('calculate');
          drawCaseChart();
        }
      });
    }

    // MARR滑块
    const marrSlider = document.getElementById('marr-slider');
    if (marrSlider) {
      marrSlider.addEventListener('input', (e) => {
        document.getElementById('marr-value').textContent = e.target.value;
        drawCaseChart();
      });
    }

    // 显示真相
    const revealBtn = document.getElementById('btn-calc-next');
    if (revealBtn) {
      revealBtn.addEventListener('click', () => {
        showStage('revelation');
        triggerShatter();
      });
    }

    // 处方
    const prescNextBtn = document.getElementById('btn-rev-next');
    if (prescNextBtn) {
      prescNextBtn.addEventListener('click', () => {
        showStage('prescription');
        updatePrescription();
      });
    }

    // 下一关
    const nextBtn = document.getElementById('btn-prev-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (gameState.currentLevel < cases.length - 1) {
          loadLevel(gameState.currentLevel + 1);
        }
      });
    }

    // 重新开始
    const restartBtn = document.getElementById('btn-restart');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        loadLevel(gameState.currentLevel);
      });
    }

    // 工具说明弹窗
    const popupClose = document.getElementById('tool-popup-close');
    if (popupClose) {
      popupClose.addEventListener('click', closeToolPopup);
    }

    const popup = document.getElementById('tool-popup');
    if (popup) {
      popup.addEventListener('click', (e) => {
        if (e.target === popup) {
          closeToolPopup();
        }
      });
    }
  }

  function loadLevel(levelIdx) {
    gameState.currentLevel = levelIdx;
    gameState.currentStage = 'intro';
    gameState.userVote = null;
    gameState.selectedTool = null;
    gameState.ecgState = 'normal';

    const currentCase = cases[levelIdx];

    // 更新UI
    const titleEl = document.getElementById('case-title');
    const narrativeEl = document.getElementById('case-narrative');
    const caseNumEl = document.querySelector('.case-number');
    const voteQEl = document.getElementById('vote-question');

    if (titleEl) titleEl.textContent = currentCase.title;
    if (narrativeEl) narrativeEl.textContent = currentCase.narrative;
    if (caseNumEl) caseNumEl.textContent = currentCase.number;
    if (voteQEl) voteQEl.textContent = currentCase.question;

    // 渲染投票选项
    renderVoteOptions(currentCase);

    // 渲染工具选项
    renderToolOptions(currentCase);

    // 更新关卡选择器
    updateLevelSelector();

    // 重置
    const marrSlider = document.getElementById('marr-slider');
    const marrValue = document.getElementById('marr-value');
    if (marrSlider) marrSlider.value = currentCase.marr * 100;
    if (marrValue) marrValue.textContent = Math.round(currentCase.marr * 100);

    // 显示第一阶段
    showStage('intro');
    updateProgressDashboard();
  }

  function renderVoteOptions(caseData) {
    const container = document.getElementById('vote-options');
    if (!container) return;
    container.innerHTML = caseData.voteOptions.map(opt => `
      <div class="vote-option" data-option="${opt.id}" data-iswrong="${opt.isWrong}">
        ${opt.text}
      </div>
    `).join('');

    container.querySelectorAll('.vote-option').forEach(el => {
      el.addEventListener('click', () => {
        const isWrong = el.dataset.iswrong === 'true';
        gameState.userVote = {
          id: el.dataset.option,
          text: el.textContent.trim(),
          isWrong
        };
        gameState.totalAttempts++;
        if (!isWrong) {
          gameState.correctAttempts++;
          gameState.ecgState = 'normal';
        } else {
          gameState.ecgState = 'erratic';
        }

        container.querySelectorAll('.vote-option').forEach(e => e.classList.remove('selected'));
        el.classList.add('selected');

        clearInterval(gameState.timer);
        setTimeout(() => showStage('tool'), 600);
      });
    });
  }

  function renderToolOptions(caseData) {
    const container = document.getElementById('tool-options');
    if (!container) return;
    container.innerHTML = caseData.tools.map(tool => {
      const desc = toolDescriptions[tool.id];
      return `
        <div class="tool-option" data-tool="${tool.id}" data-iswrong="${tool.isWrong}">
          <button class="tool-info-btn" data-toolid="${tool.id}">?</button>
          <span class="tool-icon">${desc?.icon || '🔧'}</span>
          <span class="tool-name">${tool.name}</span>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.tool-option').forEach(el => {
      el.addEventListener('click', () => {
        gameState.selectedTool = el.dataset.tool;
        container.querySelectorAll('.tool-option').forEach(e => e.classList.remove('selected'));
        el.classList.add('selected');
      });
    });

    container.querySelectorAll('.tool-info-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openToolPopup(btn.dataset.toolid);
      });
    });
  }

  function openToolPopup(toolId) {
    const desc = toolDescriptions[toolId];
    if (!desc) return;

    const popup = document.getElementById('tool-popup');
    const titleEl = document.getElementById('tool-popup-title');
    const detailsEl = document.getElementById('tool-popup-details');

    if (titleEl) titleEl.textContent = desc.icon + ' ' + desc.name;
    if (detailsEl) {
      detailsEl.innerHTML = `
        <p>${desc.description}</p>
        <dl>
          <dt>Use Case</dt>
          <dd>${desc.useCase}</dd>
          <dt>Formula</dt>
          <dd style="padding: var(--space-md); background: rgba(15,23,42,0.8); border-radius: 8px; margin: var(--space-sm) 0;">
            <span id="katex-formula" style="color: #00ff88; font-size: 1.2rem; font-family: 'KaTeX_Main', 'Times New Roman', serif;"></span>
          </dd>
          <dt>Common Pitfall</dt>
          <dd>${desc.pitfalls}</dd>
        </dl>
        <p style="margin-top:var(--space-md);color:#94a3b8;font-size:var(--text-sm);">${desc.note}</p>
      `;
      
      // 使用KaTeX渲染公式
      const formulaEl = document.getElementById('katex-formula');
      if (formulaEl && window.katex) {
        try {
          // 把公式字符串转换为KaTeX格式
          let katexFormula = '';
          if (toolId === 'npw') {
            katexFormula = 'NPV = \\sum_{t=0}^{n} \\frac{CF_t}{(1+r)^t}';
          } else if (toolId === 'irr') {
            katexFormula = '0 = \\sum_{t=0}^{n} \\frac{CF_t}{(1+IRR)^t}';
          } else if (toolId === 'delta') {
            katexFormula = '0 = \\sum_{t=0}^{n} \\frac{\\Delta CF_t}{(1+\\Delta IRR)^t}';
          } else if (toolId === 'aw') {
            katexFormula = 'AW = NPV \\times (A/P, i, n)';
          } else if (toolId === 'marginal') {
            katexFormula = 'NPV_{new} = NPV_{without sunk}';
          } else {
            // 默认公式
            katexFormula = 'NPV = \\sum_{t=0}^{n} \\frac{CF_t}{(1+r)^t}';
          }
          
          katex.render(katexFormula, formulaEl, {
            throwOnError: false,
            displayMode: false
          });
        } catch (e) {
          formulaEl.innerHTML = '<code style="color:#00ff88;">' + desc.formula + '</code>';
        }
      } else if (formulaEl) {
        formulaEl.innerHTML = '<code style="color:#00ff88;">' + desc.formula + '</code>';
      }
    }

    if (popup) popup.classList.remove('hidden');
  }

  function closeToolPopup() {
    const popup = document.getElementById('tool-popup');
    if (popup) popup.classList.add('hidden');
  }

  function showStage(stage) {
    ['case-intro', 'intuition-vote', 'tool-select', 'calculate', 'revelation', 'prescription'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });

    const stageMap = {
      intro: 'case-intro',
      vote: 'intuition-vote',
      tool: 'tool-select',
      calculate: 'calculate',
      revelation: 'revelation',
      prescription: 'prescription'
    };

    const target = stageMap[stage];
    const el = document.getElementById(target);
    if (el) el.classList.remove('hidden');

    gameState.currentStage = stage;
  }

  function startTimer() {
    gameState.timeLeft = 15;
    const timerFill = document.getElementById('timer-fill');

    gameState.timer = setInterval(() => {
      gameState.timeLeft -= 0.1;
      if (timerFill) timerFill.style.width = (gameState.timeLeft / 15 * 100) + '%';

      if (gameState.timeLeft <= 5) {
        gameState.ecgState = 'fast';
      }

      if (gameState.timeLeft <= 0) {
        clearInterval(gameState.timer);
        if (!gameState.userVote) {
          gameState.userVote = { isWrong: true, text: 'No choice made' };
          gameState.totalAttempts++;
        }
        showStage('tool');
      }
    }, 100);
  }

  function drawECGChart() {
    const canvas = document.getElementById('ecg-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = 400;
    canvas.height = 120;

    let t = 0;

    function animate() {
      // 根据主题设置背景色
      const isDarkMode = document.body.classList.contains('theme-dark');
      if (isDarkMode) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      } else {
        ctx.fillStyle = 'rgba(240, 249, 255, 0.95)';
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let baseColor = isDarkMode ? '#00ff88' : '#059669';
      if (gameState.ecgState === 'fast') baseColor = isDarkMode ? '#fbbf24' : '#d97706';
      if (gameState.ecgState === 'erratic') baseColor = isDarkMode ? '#f43f5e' : '#dc2626';

      // 添加柔和的阴影效果
      ctx.shadowColor = baseColor;
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      ctx.strokeStyle = baseColor;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 0.9;
      ctx.beginPath();

      const speed = gameState.ecgState === 'fast' ? 0.15 : 
                   gameState.ecgState === 'erratic' ? 0.12 + Math.random() * 0.05 : 0.1;

      // 平滑绘制心电图 - 使用贝塞尔曲线和平滑函数
      const points = [];
      
      // 首先收集所有点
      for (let i = 0; i < canvas.width; i++) {
        let localT = t + i / 30;
        let y = canvas.height / 2;

        if (gameState.ecgState === 'erratic') {
          y += (Math.random() - 0.5) * 40;
          const phase = localT % 3;
          if (phase < 0.3) {
            y -= 25 * Math.sin(phase / 0.3 * Math.PI / 2);
          } else if (phase < 0.6) {
            y += 35 * Math.sin((phase - 0.3) / 0.3 * Math.PI);
          }
        } else {
          const period = gameState.ecgState === 'fast' ? 2 : 4;
          const phase = localT % period;
          if (phase < 0.2) {
            y += 20 * Math.sin(phase / 0.2 * Math.PI * 2);
          } else if (phase < 0.4) {
            y -= 30 * Math.sin((phase - 0.2) / 0.2 * Math.PI / 2);
          } else if (phase < 0.6) {
            y -= 30 * Math.cos((phase - 0.4) / 0.2 * Math.PI / 2);
            y += 25 * Math.sin((phase - 0.4) / 0.2 * Math.PI / 2);
          } else if (phase < 0.8) {
            y += 25 * Math.cos((phase - 0.6) / 0.2 * Math.PI / 2);
          }
        }

        points.push({ x: i, y: y });
      }

      // 使用平滑曲线连接所有点
      if (points.length > 0) {
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length - 1; i++) {
          const xc = (points[i].x + points[i + 1].x) / 2;
          const yc = (points[i].y + points[i + 1].y) / 2;
          ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        if (points.length > 1) {
          ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        }
      }

      ctx.stroke();
      t += speed;
      requestAnimationFrame(animate);
    }

    animate();
  }

  function drawCaseChart() {
    const canvas = document.getElementById('case-chart');
    if (!canvas || !window.Chart) return;

    if (gameState.chart) {
      gameState.chart.destroy();
    }

    // 设置 canvas 高度以获得更好的宽高比
    canvas.style.height = '380px';

    const currentCase = cases[gameState.currentLevel];
    const marr = parseFloat(document.getElementById('marr-slider').value) / 100;

    let config;

    if (currentCase.visualType === 'bar') {
      // 第1关：显示不同项目在当前MARR下的NPV
      const npvA = calculateNPW(currentCase.cashflows.A, marr);
      const npvB = calculateNPW(currentCase.cashflows.B, marr);
      const npvDelta = calculateNPW(currentCase.cashflows.delta, marr);
      
      config = {
        type: 'bar',
        data: {
          labels: ['Project A (NPV)', 'Project B (NPV)', 'Incremental (NPV)'],
          datasets: [
            {
              label: 'NPV at MARR = ' + (marr*100).toFixed(0) + '%',
              data: [npvA, npvB, npvDelta],
              backgroundColor: [
                npvA >=0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(244, 63, 94, 0.8)',
                npvB >=0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(244, 63, 94, 0.8)',
                npvDelta >=0 ? 'rgba(251, 191, 36, 0.8)' : 'rgba(244, 63, 94, 0.8)'
              ],
              borderColor: '#0ea5e9',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  return 'NPV: ' + formatMoney(context.parsed.y);
                }
              }
            }
          },
          scales: {
            y: {
              title: { display: true, text: 'NPV Value' }
            }
          }
        }
      };
    } else if (currentCase.visualType === 'npw-curve') {
      const rates = [];
      const npws = [];
      for (let r = 0; r <= 0.4; r += 0.01) {
        rates.push((r * 100).toFixed(0) + '%');
        npws.push(calculateNPW(currentCase.cashflows, r));
      }

      config = {
        type: 'line',
        data: {
          labels: rates,
          datasets: [
            {
              label: 'NPV Curve',
              data: npws,
              borderColor: '#0ea5e9',
              backgroundColor: 'rgba(14, 165, 233, 0.1)',
              fill: true,
              tension: 0.4,
              pointRadius: rates.indexOf((marr*100).toFixed(0) + '%') >=0 ? 5 : 1,
              pointBackgroundColor: 'rgba(251, 191, 36, 1)',
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  return 'NPV: ' + formatMoney(context.parsed.y);
                }
              }
            }
          },
          scales: {
            y: {
              title: { display: true, text: 'NPV' }
            }
          }
        }
      };
    } else if (currentCase.visualType === 'marr') {
      // 第5关：计算每个项目的NPV随MARR变化
      const npvX = calculateNPW(currentCase.cashflows.X, marr);
      const npvY = calculateNPW(currentCase.cashflows.Y, marr);
      const npvZ = calculateNPW(currentCase.cashflows.Z, marr);
      
      config = {
        type: 'bar',
        data: {
          labels: ['Project X', 'Project Y', 'Project Z'],
          datasets: [
            {
              label: 'NPV at MARR = ' + (marr*100).toFixed(0) + '%',
              data: [npvX, npvY, npvZ],
              backgroundColor: [
                npvX >=0 ? 'rgba(14, 165, 233, 0.8)' : 'rgba(244, 63, 94, 0.8)',
                npvY >=0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(244, 63, 94, 0.8)',
                npvZ >=0 ? 'rgba(251, 191, 36, 0.8)' : 'rgba(244, 63, 94, 0.8)'
              ]
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  return 'NPV: ' + formatMoney(context.parsed.y);
                }
              }
            }
          }
        }
      };
    } else {
      config = {
        type: 'bar',
        data: {
          labels: ['Project X', 'Project Y', 'Project Z'],
          datasets: [
            {
              label: 'NPV at MARR',
              data: [100000, 200000, 150000],
              backgroundColor: ['#0ea5e9', '#10b981', '#fbbf24']
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  return context.dataset.label + ': ' + formatMoney(context.parsed.y);
                }
              }
            }
          }
        }
      };
    }

    gameState.chart = new Chart(canvas, config);
  }

  function triggerShatter() {
    // 暂时禁用玻璃粉碎效果，避免画面变暗
    const overlay = document.getElementById('shatter-overlay');
    if (overlay) {
      // 移除可能造成一直暗的active类
      overlay.classList.remove('active');
    }

    const currentCase = cases[gameState.currentLevel];
    const revText = document.getElementById('revelation-text');
    const userChoice = document.getElementById('user-choice');
    const correctChoice = document.getElementById('correct-choice');

    if (revText) revText.textContent = currentCase.revelationText;
    if (userChoice) userChoice.textContent = 'You chose: ' + (gameState.userVote?.text || 'nothing');
    if (correctChoice) correctChoice.textContent = 'Correct: ' + currentCase.correctAnswer;
  }

  function updatePrescription() {
    const currentCase = cases[gameState.currentLevel];
    const prescText = document.getElementById('prescription-text');
    if (prescText) prescText.textContent = currentCase.prescription;

    if (gameState.userVote?.isWrong) {
      if (!gameState.mistakes.find(m => m.case === currentCase.title)) {
        gameState.mistakes.push({
          case: currentCase.title,
          error: gameState.userVote.text
        });
      }
    }

    const mistakeList = document.getElementById('mistake-list');
    if (mistakeList) {
      if (gameState.mistakes.length > 0) {
        mistakeList.innerHTML = gameState.mistakes.map(m => `
          <div class="mistake-item" style="background:rgba(244,63,94,0.1);border:1px solid #f43f5e;border-radius:8px;padding:var(--space-md);">
            <strong style="color:#f43f5e;">❌ ${m.case}</strong>
            <p style="color:#fecdd3;margin:0;">Your answer: ${m.error}</p>
          </div>
        `).join('');
      } else {
        mistakeList.innerHTML = '<p style="color:#10b981;">✅ Perfect record so far! No mistakes yet.</p>';
      }
    }

    if (!gameState.completedLevels.includes(gameState.currentLevel)) {
      gameState.completedLevels.push(gameState.currentLevel);
    }

    updateLevelSelector();
    updateProgressDashboard();
    saveGameState();
  }

  function updateLevelSelector() {
    document.querySelectorAll('.level-item').forEach((el, idx) => {
      if (gameState.completedLevels.includes(idx)) {
        el.classList.add('level-completed');
      } else {
        el.classList.remove('level-completed');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', initGame);
})();
