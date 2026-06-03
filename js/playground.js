(function() {
  // Tool description data
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

  // Complete 8 Traps Data
  const cases = [
    {
      id: 'lifespan-illusion',
      title: 'Trap 1: Lifespan Illusion – Ignoring Life Cycle Differences',
      narrative: 'Boss\'s Intuition: "Equipment A costs $100,000 and lasts 3 years; Equipment B costs $150,000 and lasts 6 years. Both do the exact same job. Which one is better?"',
      number: '#001',
      cashflows: {
        A: [-100000, 45000, 45000, 45000],
        B: [-150000, 40000, 40000, 40000, 40000, 40000, 40000]
      },
      marr: 0.10,
      question: 'Both do the exact same job. Which one is better?',
      voteOptions: [
        { id: 'A', text: 'Choose Equipment A (cheaper)', isWrong: true },
        { id: 'B', text: 'Choose Equipment B (longer life)', isWrong: false }
      ],
      correctAnswer: 'Equipment B',
      wrongAnswer: 'Equipment A',
      tools: [
        { id: 'npw', name: 'NPV Calculation (Common Period)', isWrong: false },
        { id: 'aw', name: 'Annual Worth (AW) Method', isWrong: false }
      ],
      requiredTool: 'aw',
      revelationText: 'Projects with different lives CANNOT be compared directly by NPV! AW method automatically eliminates lifespan differences.',
      prescription: 'For projects with different lifespans, use Annual Worth (AW) method! No complex repeat assumptions needed.',
      visualType: 'dual',
      knowledge: 'AW spreads costs evenly across years, making lifespan differences irrelevant.',
      chartInfo: {
        type: 'Grouped Bar Chart (Cash Flows Over Time)',
        xAxis: 'Year',
        yAxis: 'Cash Flow ($ thousands)',
        unknown: 'Which equipment has lower annualized cost?'
      },
      explanation: `
<p><strong>⏱️ Solution: EUAC Method</strong></p>

<p><strong>Core Problem:</strong> Different lifespans can't be compared directly. Convert to annual cost.</p>

<p><strong>Formula:</strong><br>
$$EUAC = PV \\times (A/P, i, n)$$<br>
Where $$(A/P, i, n) = \\frac{i(1+i)^n}{(1+i)^n - 1}$$ is the capital recovery factor.</p>

<p><strong>Step-by-Step Calculation:</strong></p>
<ol>
  <li><strong>Find common period:</strong> LCM(3,6) = 6 years</li>
  <li><strong>PV of costs for A:</strong> $$100,000 + \\frac{100,000}{(1.1)^3} = 175,131$$</li>
  <li><strong>PV of costs for B:</strong> $$150,000$$</li>
  <li><strong>Calculate EUAC:</strong><br>
      - $$(A/P, 10\\%, 6) = 0.2296$$<br>
      - $$EUAC_A = 175,131 \\times 0.2296 \\approx 40,211/year$$<br>
      - $$EUAC_B = 150,000 \\times 0.2296 \\approx 34,440/year$$</li>
</ol>

<p><strong>💡 Why Boss Was Wrong:</strong><br>
"100k÷3=33k/year" ignores the time value of money! The $100k in Year 3 is worth only $75k today.</p>

<p><strong>✅ Conclusion:</strong> Choose Equipment B (lower annual cost: $34,440 < $40,211)</p>
`
    },
    {
      id: 'irr-trap',
      title: 'Trap 2: IRR Ranking Illusion – Blind Faith in High IRR',
      narrative: 'Boss\'s Intuition: "Project A has an IRR of 28%, while Project B is only 15%. Which one generates higher returns and more total profit?"',
      number: '#002',
      cashflows: {
        A: [-1000000, 1280000],
        B: [-10000000, 11500000],
        delta: [-9000000, 10220000]
      },
      marr: 0.10,
      question: 'Which project generates higher returns and more total profit?',
      voteOptions: [
        { id: 'A', text: 'Project A (IRR 28%)', isWrong: true },
        { id: 'B', text: 'Project B (IRR 15%)', isWrong: false }
      ],
      correctAnswer: 'Project B',
      wrongAnswer: 'Project A',
      tools: [
        { id: 'npw', name: 'NPV Calculation', isWrong: false },
        { id: 'irr', name: 'IRR Analysis (Misleading!)', isWrong: true },
        { id: 'delta', name: 'Incremental IRR', isWrong: false }
      ],
      requiredTool: 'delta',
      revelationText: 'IRR alone is misleading for mutually exclusive projects! Size matters - B has lower IRR but creates far more wealth!',
      prescription: 'For mutually exclusive projects, use incremental IRR or NPV, NOT standalone IRR!',
      visualType: 'bar',
      knowledge: 'Small projects can have high IRR but low absolute value. Big projects may have lower IRR but create more wealth.',
      chartInfo: {
        type: 'Dual-axis Column Chart (IRR vs NPV)',
        xAxis: 'Project',
        yAxisLeft: 'IRR (%)',
        yAxisRight: 'NPV ($)',
        unknown: 'Which project creates more absolute value?'
      },
      explanation: `
<p><strong>📊 Solution: NPV Comparison</strong></p>

<p><strong>Core Problem:</strong> IRR shows "percentage return", NPV shows "absolute profit". Scale matters!</p>

<p><strong>Formula:</strong><br>
$$NPV = \\sum_{t=0}^{n} \\frac{CF_t}{(1+r)^t}$$<br>
Where $$CF_t$$ = cash flow at time t, $$r$$ = discount rate (MARR).</p>

<p><strong>Step-by-Step Calculation:</strong></p>
<ol>
  <li><strong>Project A:</strong> Invest $1,000 → Year 1: $1,280 (IRR=28%)</li>
  <li><strong>Project B:</strong> Invest $10,000 → Year 1: $11,500 (IRR=15%)</li>
  <li><strong>MARR = 10%</strong></li>
  <li><strong>Calculate NPV:</strong><br>
      - $$NPV_A = -1,000 + \\frac{1,280}{1.1} = 163.64$$<br>
      - $$NPV_B = -10,000 + \\frac{11,500}{1.1} = 454.55$$</li>
</ol>

<p><strong>💡 Why Boss Was Wrong:</strong><br>
"28% > 15%" is misleading! A 28% return on $1k earns $280. A 15% return on $10k earns $1,500.</p>

<p><strong>✅ Conclusion:</strong> Choose Project B (higher NPV: $454.55 > $163.64)</p>
`
    },
    {
      id: 'sunk-cost-ghost',
      title: 'Trap 3: The Sunk Cost Ghost – Unlettable Past',
      narrative: 'Boss\'s Intuition: "We\'ve spent $5 million on this R&D project over the past 3 years! Now there are some issues, but we only need $1 million more to finish. There\'s a brand new alternative Project C that costs $1.2 million but works better. But we CANNOT abandon the original project – otherwise that $5 million goes down the drain!"',
      number: '#003',
      cashflows: {
        original: [-5000000, -1000000, 6000000],
        alternative: [0, -1200000, 8000000],
        marginal: [-1000000, 6000000]
      },
      marr: 0.10,
      question: 'What do you think of the boss\'s decision?',
      voteOptions: [
        { id: 'continue', text: 'Continue original project (can\'t lose $5M)', isWrong: true },
        { id: 'switch', text: 'Switch to Project C (better outcome)', isWrong: false }
      ],
      correctAnswer: 'Switch to Project C',
      wrongAnswer: 'Continue original project',
      tools: [
        { id: 'marginal', name: 'Marginal Cash Flow (Future Only)', isWrong: false },
        { id: 'npw', name: 'Full Cash Flow (Including Sunk Cost)', isWrong: true }
      ],
      requiredTool: 'marginal',
      revelationText: 'Sunk costs are already gone! Decisions should only consider future cash flows!',
      prescription: 'Sunk costs don\'t matter. From now on, only focus on marginal cash flow changes!',
      visualType: 'ghost',
      knowledge: 'Economics looks forward. Spent money is spent - don\'t throw good money after bad!',
      chartInfo: {
        type: 'Side-by-Side Bar Chart (Future Cash Flows)',
        xAxis: 'Option',
        yAxis: 'Future NPV ($ millions)',
        unknown: 'Which option has higher future value?'
      },
      explanation: `
<p><strong>👻 Solution: Marginal Cash Flow Analysis</strong></p>

<p><strong>Core Problem:</strong> Sunk costs ($5M already spent) are irrelevant. Only future cash flows matter!</p>

<p><strong>Formula:</strong><br>
$$NPV = \\sum_{t=0}^{n} \\frac{CF_t}{(1+r)^t}$$</p>

<p><strong>Step-by-Step Calculation (Future Only!):</strong></p>
<ol>
  <li><strong>Original Project:</strong> Invest $1M now → $500k/year for 10 years</li>
  <li><strong>New Project C:</strong> Invest $1.2M now → $550k/year for 10 years</li>
  <li><strong>MARR = 10%</strong>, $$(P/A,10\\%,10) = 6.1446$$</li>
  <li><strong>Calculate NPV:</strong><br>
      - $$NPV_{Original} = -1,000,000 + 500,000 \\times 6.1446 = 2,072,300$$<br>
      - $$NPV_{New\\ C} = -1,200,000 + 550,000 \\times 6.1446 = 2,179,530$$</li>
</ol>

<p><strong>💡 Why Boss Was Wrong:</strong><br>
The $5M is already spent – it's "sunk". Whether you continue or switch, you've already lost that money.</p>

<p><strong>✅ Conclusion:</strong> Choose New Project C (higher future NPV: $2.18M > $2.07M)</p>
`
    },
    {
      id: 'nominal-rate-trap',
      title: 'Trap 4: Nominal Rate Trap – Ignoring Compounding Frequency',
      narrative: 'Boss\'s Intuition: "Lender X offers 12% annual rate, compounded quarterly. Lender Y offers 12.2% annual rate, compounded annually. Which one should I choose?"',
      number: '#004',
      cashflows: {
        X: { rate: 0.12, compounding: 4 },
        Y: { rate: 0.122, compounding: 1 }
      },
      marr: 0.10,
      question: 'Which lender should I choose?',
      voteOptions: [
        { id: 'X', text: 'Choose X (12% sounds lower)', isWrong: true },
        { id: 'Y', text: 'Choose Y (12.2% is actually cheaper)', isWrong: false }
      ],
      correctAnswer: 'Choose Lender Y',
      wrongAnswer: 'Choose Lender X',
      tools: [
        { id: 'npw', name: 'Effective Annual Rate (EAR) Calculation', isWrong: false },
        { id: 'aw', name: 'Annual Payment Comparison', isWrong: false }
      ],
      requiredTool: 'npw',
      revelationText: 'Nominal rates deceive! Always compare Effective Annual Rate (EAR). X has lower nominal rate but higher actual cost!',
      prescription: 'Always compare Effective Annual Rate (EAR), never be fooled by nominal rates!',
      visualType: 'dual',
      knowledge: 'More compounding periods = higher effective rate! EAR = (1 + r/m)^m - 1',
      chartInfo: {
        type: 'Bar Chart (Effective Annual Rate Comparison)',
        xAxis: 'Lender',
        yAxis: 'Effective Annual Rate (%)',
        unknown: 'Which lender has lower effective cost?'
      },
      explanation: `
<p><strong>💹 Solution: Effective Annual Rate (EAR) Calculation</strong></p>

<p><strong>Core Problem:</strong> Nominal rates are misleading when compounding frequencies differ.</p>

<p><strong>Formula:</strong><br>
$$EAR = \\left(1 + \\frac{r_{nominal}}{m}\\right)^m - 1$$<br>
Where $$r_{nominal}$$ = nominal rate, $$m$$ = compounding periods per year.</p>

<p><strong>Step-by-Step Calculation:</strong></p>
<ol>
  <li><strong>Lender X:</strong> 12% annual, compounded quarterly (m=4)</li>
  <li><strong>Lender Y:</strong> 12.2% annual, compounded annually (m=1)</li>
  <li><strong>Calculate EAR:</strong><br>
      - $$EAR_X = \\left(1 + \\frac{0.12}{4}\\right)^4 - 1 = (1.03)^4 - 1 = 12.551\\%$$<br>
      - $$EAR_Y = \\left(1 + \\frac{0.122}{1}\\right)^1 - 1 = 12.2\\%$$</li>
</ol>

<p><strong>💡 Why Boss Was Wrong:</strong><br>
"12% < 12.2%" ignores compounding! X charges 3% per quarter, and interest earns interest.</p>

<p><strong>✅ Conclusion:</strong> Choose Lender Y (lower EAR: 12.2% < 12.55%)</p>
`
    },
    {
      id: 'euac-trap',
      title: 'Trap 5: EUAC Standardized Misery – Misusing Arithmetic Mean',
      narrative: 'Boss\'s Intuition: "We bought this machine for $100,000. It will last 6 years and have a salvage value of $10,000. So the \'capital recovery depreciation\' should be ($100,000 - $10,000)/6 = $15,000 per year, right? Just add operating costs!"',
      number: '#005',
      cashflows: {
        naive: [-100000, 0, 0, 0, 0, 0, 10000],
        correct: [-100000, -21664, -21664, -21664, -21664, -21664, -21664 + 10000]
      },
      marr: 0.10,
      question: 'Do you agree with the boss?',
      voteOptions: [
        { id: 'naive', text: 'Yes, arithmetic average is fine', isWrong: true },
        { id: 'correct', text: 'No, need Capital Recovery Factor', isWrong: false }
      ],
      correctAnswer: 'Use Capital Recovery Factor',
      wrongAnswer: 'Arithmetic average',
      tools: [
        { id: 'npw', name: 'Capital Recovery Factor (CR)', isWrong: false },
        { id: 'aw', name: 'EUAC Calculation', isWrong: false }
      ],
      requiredTool: 'aw',
      revelationText: 'Arithmetic average ignores time value of money! Money has interest cost - early costs are "more expensive"!',
      prescription: 'Use EUAC = P × (A/P, i, n) - S × (A/F, i, n), NOT simple arithmetic average!',
      visualType: 'dual',
      knowledge: 'Time is money! $1 today is worth more than $1 tomorrow - can\'t just average.',
      chartInfo: {
        type: 'Cash Flow Diagram (Initial Cost & Salvage)',
        xAxis: 'Year',
        yAxis: 'Cash Flow ($ thousands)',
        unknown: 'What is the correct annual capital recovery cost?'
      },
      explanation: `
<p><strong>💰 Solution: Capital Recovery (CR) Calculation</strong></p>

<p><strong>Core Problem:</strong> Simple arithmetic mean ignores the time value of money.</p>

<p><strong>Formula:</strong><br>
$$CR = (P - S)(A/P, i, n) + S \\times i$$<br>
Where: $$P$$ = initial cost, $$S$$ = salvage value, $$(A/P, i, n) = \\frac{i(1+i)^n}{(1+i)^n - 1}$$</p>

<p><strong>Step-by-Step Calculation:</strong></p>
<ol>
  <li><strong>Initial cost (P):</strong> $$100,000$$</li>
  <li><strong>Salvage value (S):</strong> $$10,000$$</li>
  <li><strong>MARR (i):</strong> 10%, <strong>Life (n):</strong> 6 years</li>
  <li><strong>$$(A/P, 10\\%, 6) = 0.2296$$</strong></li>
  <li><strong>Calculate CR:</strong><br>
      - $$CR = (100,000 - 10,000) \\times 0.2296 + 10,000 \\times 0.10$$<br>
      - $$CR = 90,000 \\times 0.2296 + 1,000 = 21,664/year$$</li>
</ol>

<p><strong>💡 Why Boss Was Wrong:</strong><br>
"(100k-10k)÷6=15k/year" only calculates depreciation, ignoring the interest cost of capital.</p>

<p><strong>✅ Conclusion:</strong> Correct capital recovery cost = $21,664/year (not $15,000/year)</p>
`
    },
    {
      id: 'arithmetic-gradient-mistake',
      title: 'Trap 6: Arithmetic Gradient Mistake – Wrong Starting Point for G',
      narrative: 'Boss\'s Intuition: "We expect maintenance cost to be $2,000 in Year 1, increasing by $500 each year thereafter ($2,500 in Year 2, $3,000 in Year 3...). Since it increases by $500 each year, the gradient G₁ should equal $500 in Year 1, right?"',
      number: '#006',
      cashflows: {
        wrong: [0, 500, 1000, 1500, 2000],
        correct: [0, 0, 500, 1000, 1500]
      },
      marr: 0.10,
      question: 'Do you agree with the boss?',
      voteOptions: [
        { id: 'wrong', text: 'Yes, G₁ = 500', isWrong: true },
        { id: 'correct', text: 'No, gradient starts in Year 2', isWrong: false }
      ],
      correctAnswer: 'Gradient starts in Year 2',
      wrongAnswer: 'G₁ = 500',
      tools: [
        { id: 'npw', name: 'Arithmetic Gradient Formula Check', isWrong: false },
        { id: 'chart', name: 'Cash Flow Timeline Plot', isWrong: false }
      ],
      requiredTool: 'chart',
      revelationText: 'In arithmetic gradient formula, G₁ is the increment in YEAR 2, NOT Year 1! Boss got the timing wrong!',
      prescription: 'In arithmetic gradient formula, first increment occurs at Period 2, NOT Period 1! Draw a timeline to confirm!',
      visualType: 'ghost',
      knowledge: 'Count the timeline carefully! P = G × (P/G, i, n) starts from Year 2.',
      chartInfo: {
        type: 'Line Chart (Arithmetic Gradient Cash Flow)',
        xAxis: 'Year',
        yAxis: 'Maintenance Cost ($)',
        unknown: 'In which year does the gradient G first appear?'
      },
      explanation: `
<p><strong>📈 Solution: Arithmetic Gradient Analysis</strong></p>

<p><strong>Core Problem:</strong> The gradient G starts in Year 2, NOT Year 1!</p>

<p><strong>Standard Arithmetic Gradient Pattern:</strong><br>
Year 1: $$A$$<br>
Year 2: $$A + G$$<br>
Year 3: $$A + 2G$$<br>
...<br>
Year n: $$A + (n-1)G$$</p>

<p><strong>Present Value Formula:</strong><br>
$$P = A(P/A, i, n) + G(P/G, i, n)$$</p>

<p><strong>Step-by-Step Calculation:</strong></p>
<ol>
  <li><strong>Base cost (A):</strong> $$2,000$$ (Year 1)</li>
  <li><strong>Gradient (G):</strong> $$500$$ (starts Year 2)</li>
  <li><strong>$$(P/A, 10\\%, 5) = 3.7908$$</strong>, <strong>$$(P/G, 10\\%, 5) = 6.8618$$</strong></li>
  <li><strong>Calculate PV:</strong><br>
      - $$PV = 2000 \\times 3.7908 + 500 \\times 6.8618 = 11,013$$</li>
</ol>

<p><strong>💡 Why Boss Was Wrong:</strong><br>
Year 1 has only the base cost A=$2000. The gradient G=$500 first appears in Year 2.</p>

<p><strong>✅ Conclusion:</strong> G starts in Year 2, not Year 1!</p>
`
    },
    {
      id: 'npw-curve-betrayal',
      title: 'Trap 7: NPW Curve Betrayal – Ignoring MARR Reversal',
      narrative: 'Boss\'s Intuition: "At MARR = 5%, Project M has NPV of $500,000, far exceeding Project N\'s $200,000. Now due to market risk, company increased MARR to 15%. Since M crushed N at 5%, M must still win at 15%, right?"',
      number: '#007',
      cashflows: {
        M: [-1000000, 300000, 300000, 300000, 300000, 300000],
        N: [-500000, 200000, 200000, 200000, 200000]
      },
      marr: 0.15,
      question: 'At 15% MARR, does M still win?',
      voteOptions: [
        { id: 'M', text: 'Project M (won at 5%)', isWrong: true },
        { id: 'N', text: 'Project N (overtakes at 15%)', isWrong: false }
      ],
      correctAnswer: 'Project N wins',
      wrongAnswer: 'Project M wins',
      tools: [
        { id: 'chart', name: 'NPV Curve Plot', isWrong: false },
        { id: 'delta', name: 'Incremental IRR at Crossover', isWrong: false }
      ],
      requiredTool: 'chart',
      revelationText: 'NPV curves cross! When MARR changes, the optimal choice can completely reverse! Always plot the curves!',
      prescription: 'For mutually exclusive projects, ALWAYS plot NPV curves, find crossover point, check which side MARR is on!',
      visualType: 'npw-curve',
      knowledge: 'NPV curve crossover = incremental IRR. Optimal choice reverses on either side!',
      chartInfo: {
        type: 'NPV Curve Chart (Cross-over Analysis)',
        xAxis: 'MARR (%)',
        yAxis: 'Net Present Value ($)',
        unknown: 'At what MARR do the projects cross-over?'
      },
      explanation: `
<p><strong>🔀 Solution: NPV Curve Analysis</strong></p>

<p><strong>Core Problem:</strong> Higher MARR penalizes distant cash flows more, potentially reversing the winner.</p>

<p><strong>Formula:</strong><br>
$$NPV = \\sum_{t=0}^{n} \\frac{CF_t}{(1+MARR)^t}$$</p>

<p><strong>Step-by-Step Calculation:</strong></p>
<ol>
  <li><strong>Project M:</strong> $$-1,000$$ → Year 5: $$2,000$$ (delayed payoff)</li>
  <li><strong>Project N:</strong> $$-500$$ → Years 1-4: $$300$$/year (steady returns)</li>
  <li><strong>At MARR = 5%:</strong><br>
      - $$NPV_M = -1000 + \\frac{2000}{(1.05)^5} ≈ 564$$<br>
      - $$NPV_N = -500 + 300 \\times (P/A,5\\%,4) ≈ 564$$</li>
  <li><strong>At MARR = 15%:</strong><br>
      - $$NPV_M = -1000 + \\frac{2000}{(1.15)^5} ≈ 144$$<br>
      - $$NPV_N = -500 + 300 \\times (P/A,15\\%,4) ≈ 356$$</li>
  <li><strong>Crossover Rate ≈ 7%</strong></li>
</ol>

<p><strong>Decision Rule:</strong><br>
- If MARR < 7% → Choose M<br>
- If MARR > 7% → Choose N</p>

<p><strong>💡 Why Boss Was Wrong:</strong><br>
Higher MARR reduces the value of future cash flows. M's big Year 5 payoff gets heavily discounted.</p>

<p><strong>✅ Conclusion:</strong> At MARR=15%, Project N wins!</p>
`
    },
    {
      id: 'simple-compound-trap',
      title: 'Trap 8: Simple vs Compound Terminal Wealth – Underestimating Time',
      narrative: 'Boss\'s Intuition: "We have $1 million to invest for 30 years. One option gives 10% simple interest, another gives 9.5% compound interest. Which one should I choose?"',
      number: '#008',
      cashflows: {
        simple: [-1000000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 4000000],
        compound: [-1000000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15203696]
      },
      marr: 0.095,
      question: 'Which option should I choose?',
      voteOptions: [
        { id: 'simple', text: 'Simple interest 10% (higher rate)', isWrong: true },
        { id: 'compound', text: 'Compound interest 9.5% (better long-term)', isWrong: false }
      ],
      correctAnswer: 'Compound interest 9.5%',
      wrongAnswer: 'Simple interest 10%',
      tools: [
        { id: 'npw', name: 'Terminal Value Calculation', isWrong: false },
        { id: 'chart', name: 'Wealth Growth Plot', isWrong: false }
      ],
      requiredTool: 'chart',
      revelationText: 'Compound interest snowballs over time! Simple may lead short-term, but compound dominates long-term!',
      prescription: 'For long-term investments, ALWAYS choose compound interest! Time amplifies the difference!',
      visualType: 'compound',
      knowledge: 'Simple = linear growth, Compound = exponential explosion! 30 years makes massive difference!',
      chartInfo: {
        type: 'Line Chart (Wealth Growth Comparison)',
        xAxis: 'Year',
        yAxis: 'Total Wealth ($ millions)',
        unknown: 'When does compound interest overtake simple interest?'
      },
      explanation: `
<p><strong>✨ Solution: Terminal Value Comparison</strong></p>

<p><strong>Core Problem:</strong> Compound interest grows exponentially, while simple interest grows linearly. Time amplifies the difference!</p>

<p><strong>Formulas:</strong><br>
Simple Interest: $$F_{simple} = P(1 + r \\times t)$$<br>
Compound Interest: $$F_{compound} = P(1 + r)^t$$<br>
Where $$P$$ = principal, $$r$$ = annual rate, $$t$$ = time in years.</p>

<p><strong>Step-by-Step Calculation:</strong></p>
<ol>
  <li><strong>Principal (P):</strong> $$1,000,000$$</li>
  <li><strong>Simple rate:</strong> 10%, <strong>Compound rate:</strong> 9.5%</li>
  <li><strong>Time:</strong> 30 years</li>
  <li><strong>Calculate Terminal Value:</strong><br>
      - $$F_{simple} = 1,000,000 \\times (1 + 0.10 \\times 30) = 4,000,000$$<br>
      - $$F_{compound} = 1,000,000 \\times (1.095)^{30} ≈ 15,220,000$$</li>
</ol>

<p><strong>💡 Why Boss Was Wrong:</strong><br>
Simple interest only earns on the original principal ($100k/year fixed). Compound interest earns on principal PLUS accumulated interest - it accelerates over time!</p>

<p><strong>✅ Conclusion:</strong> Choose Compound 9.5% ($15.2M > $4M)!</p>
`
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
      const npwsM = [];
      const npwsN = [];
      for (let r = 0; r <= 0.4; r += 0.01) {
        rates.push((r * 100).toFixed(0) + '%');
        npwsM.push(calculateNPW(currentCase.cashflows.M, r));
        npwsN.push(calculateNPW(currentCase.cashflows.N, r));
      }

      config = {
        type: 'line',
        data: {
          labels: rates,
          datasets: [
            {
              label: 'Project M',
              data: npwsM,
              borderColor: '#0ea5e9',
              backgroundColor: 'rgba(14, 165, 233, 0.1)',
              fill: false,
              tension: 0.4,
            },
            {
              label: 'Project N',
              data: npwsN,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              fill: false,
              tension: 0.4,
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
                  return context.dataset.label + ': NPV = ' + formatMoney(context.parsed.y);
                }
              }
            }
          },
          scales: {
            y: {
              title: { display: true, text: 'NPV ($)' }
            },
            x: {
              title: { display: true, text: 'Discount Rate (%)' }
            }
          }
        }
      };
    } else if (currentCase.visualType === 'compound') {
      // 第8关：复利vs单利对比
      const years = [];
      const simpleWealth = [];
      const compoundWealth = [];
      const principal = 1000000;
      const simpleRate = 0.10;
      const compoundRate = 0.095;
      
      for (let y = 0; y <= 30; y += 2) {
        years.push('Year ' + y);
        simpleWealth.push(principal * (1 + simpleRate * y));
        compoundWealth.push(principal * Math.pow(1 + compoundRate, y));
      }

      config = {
        type: 'line',
        data: {
          labels: years,
          datasets: [
            {
              label: 'Simple Interest (10%)',
              data: simpleWealth,
              borderColor: '#f43f5e',
              backgroundColor: 'rgba(244, 63, 94, 0.1)',
              fill: false,
              tension: 0.1,
              borderDash: [5, 5],
            },
            {
              label: 'Compound Interest (9.5%)',
              data: compoundWealth,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              fill: false,
              tension: 0.4,
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
          },
          scales: {
            y: {
              title: { display: true, text: 'Wealth ($)' }
            },
            x: {
              title: { display: true, text: 'Year' }
            }
          }
        }
      };
    } else if (currentCase.visualType === 'marr') {
      // 计算每个项目的NPV随MARR变化
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

    // Hide chart info card (only show solution)
    const chartInfoCard = document.getElementById('chart-info-card');
    if (chartInfoCard) chartInfoCard.style.display = 'none';

    // Display explanation (solution) in revelation stage
    const explanationCard = document.getElementById('explanation-card');
    const explanationContent = document.getElementById('explanation-content');
    if (currentCase.explanation && explanationCard && explanationContent) {
      explanationCard.style.display = 'block';
      explanationContent.innerHTML = currentCase.explanation;
      
      // Render KaTeX formulas
      try {
        if (window.katex && window.renderMathInElement) {
          renderMathInElement(explanationContent, {
            delimiters: [
              {left: "$$", right: "$$", display: true},
              {left: "$", right: "$", display: false}
            ],
            throwOnError: false
          });
        } else if (window.katex) {
          // Fallback: manually parse and render
          const html = explanationContent.innerHTML;
          explanationContent.innerHTML = html.replace(/\$\$([^$]+)\$\$/g, (match, math) => {
            try {
              return '<span class="katex-display">' + katex.renderToString(math, { displayMode: true, throwOnError: false }) + '</span>';
            } catch (e) {
              return match;
            }
          });
        }
      } catch (e) {
        console.error('Error rendering KaTeX:', e);
      }
    } else if (explanationCard) {
      explanationCard.style.display = 'none';
    }
  }

  function updatePrescription() {
    const currentCase = cases[gameState.currentLevel];
    const prescText = document.getElementById('prescription-text');
    if (prescText) prescText.textContent = currentCase.prescription;

    // Hide chart info and explanation in prescription stage (shown in revelation)
    const chartInfoCard = document.getElementById('chart-info-card');
    const explanationCard = document.getElementById('explanation-card');
    if (chartInfoCard) chartInfoCard.style.display = 'none';
    if (explanationCard) explanationCard.style.display = 'none';

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
