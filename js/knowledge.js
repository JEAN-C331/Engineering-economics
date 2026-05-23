/**
 * Knowledge Hub index — grouped by topic track (not by slide deck).
 * track: "tvm" | "equiv" | "series" | "rates" | "pw"
 * formulaLatex: KaTeX-compatible (no leading/trailing delimiters).
 */
window.KNOWLEDGE_TRACKS = {
  all: "All",
  tvm: "Time value & cash flows",
  equiv: "Equivalence & factors",
  series: "Uniform series & gradients",
  rates: "Nominal & effective rates",
  pw: "Present worth analysis",
  annual: "Annual cash flow",
  irr: "Rate of return analysis",
};

window.KNOWLEDGE_TOPICS = [
  {
    id: "time-value",
    track: "tvm",
    title: "Time Value of Money",
    summary:
      "Money today can earn a return, so funds available now are economically stronger than the same nominal amount later. Compound interest accrues on principal and on accumulated interest from prior periods.",
    formulaLatex: String.raw`F = P(1+i)^n \quad\text{(compound per period)} \qquad F = P(1+ni),\; I=Pni \quad\text{(simple)}`,
    keywords: "compound simple growth principal future present",
  },
  {
    id: "cash-flow-diagram",
    track: "tvm",
    title: "Cash Flow Diagrams",
    summary:
      "A timeline of inflows and outflows anchors the modeling step: identify period length, align i and n to that period, then mark known cash flows before selecting factors.",
    formulaLatex: String.raw`\text{NPW}=\sum_t NCF_t\,(P/F,i,t) \quad\text{(conceptual template)}`,
    keywords: "timeline arrows receipts disbursements diagram",
  },
  {
    id: "fp-factor",
    track: "equiv",
    title: "Single Payment: Future Worth (F/P)",
    summary:
      "Given a present lump sum P, find the equivalent future amount F after n periods at compound rate i per period.",
    formulaLatex: String.raw`F=P(1+i)^n = P(F/P,i,n)`,
    keywords: "lump sum deposit savings growth",
  },
  {
    id: "pf-factor",
    track: "equiv",
    title: "Single Payment: Present Worth (P/F)",
    summary:
      "Discount a future receipt (or disbursement) to an equivalent present amount—used for targets, salvage, and any single future cash flow.",
    formulaLatex: String.raw`P=\frac{F}{(1+i)^n}=F(1+i)^{-n}=F(P/F,i,n) \qquad (P/F,i,n)=\frac{1}{(F/P,i,n)}`,
    keywords: "discount present target goal",
  },
  {
    id: "annuity-fa",
    track: "series",
    title: "Uniform Series: Future Worth of Annuity (F/A)",
    summary:
      "End-of-period deposits A that repeat each period accumulate to F at the same compound rate i for n periods.",
    formulaLatex: String.raw`F=A\left[\frac{(1+i)^n-1}{i}\right]=A(F/A,i,n)`,
    keywords: "annuity uniform series savings end of period",
  },
  {
    id: "annuity-pa",
    track: "series",
    title: "Uniform Series: Present Worth of Annuity (P/A)",
    summary:
      "Convert a level annuity into an equivalent single sum at t{=}0—common for loans, leases, and repeating operating costs.",
    formulaLatex: String.raw`P=A\left[\frac{(1+i)^n-1}{i(1+i)^n}\right]=A(P/A,i,n)`,
    keywords: "loan lease payments series",
  },
  {
    id: "sinking-fund",
    track: "series",
    title: "Sinking Fund (A/F)",
    summary:
      "Find the uniform set-aside A that grows to a stated future sum F—used for replacement reserves and savings targets.",
    formulaLatex: String.raw`A=F\left[\frac{i}{(1+i)^n-1}\right]=F(A/F,i,n)`,
    keywords: "deposit target fund monthly",
  },
  {
    id: "gradient-pg",
    track: "series",
    title: "Arithmetic Gradient (P/G, A/G)",
    summary:
      "When payments increase by a constant G each period, decompose into a base level annuity plus a standardized gradient component, then apply tabulated factors.",
    formulaLatex: String.raw`P = A(P/A,i,n) \pm G(P/G,i,n) \quad\text{(sign depends on increasing vs. decreasing pattern)}`,
    keywords: "maintenance increasing series gradient",
  },
  {
    id: "continuous-compounding",
    track: "rates",
    title: "Continuous Compounding",
    summary:
      "As compounding frequency increases without bound, discrete accrual approaches an exponential limit. Continuous models appear in finance and in theoretical comparisons.",
    formulaLatex: String.raw`\lim_{m\to\infty} P\left(1+\frac{r}{m}\right)^{mt} = Pe^{rt}`,
    keywords: "continuous e exponential limit",
  },
  {
    id: "nominal-effective",
    track: "rates",
    title: "Nominal vs Effective Annual Rate (EAR)",
    summary:
      "The nominal annual rate r ignores intra-year compounding structure; the effective annual rate i_a incorporates compounding frequency m.",
    formulaLatex: String.raw`i_a=\left(1+\frac{r}{m}\right)^m-1 \qquad i_a=e^r-1 \;\text{(continuous case)}`,
    keywords: "EAR APR compounding quarterly monthly",
  },
  {
    id: "compounding-periods",
    track: "rates",
    title: "Compounding Frequency and Future Value",
    summary:
      "Holding the nominal annual r fixed, increasing m raises ending wealth over a year because interest is credited more frequently (interest on interest begins sooner).",
    formulaLatex: String.raw`F_{1\text{ yr}} = P\left(1+\frac{r}{m}\right)^m`,
    keywords: "daily monthly quarterly semiannual",
  },
  {
    id: "npw-npv",
    track: "pw",
    title: "Net Present Worth (NPW / NPV)",
    summary:
      "Translate all benefits and costs to time 0 using MARR as the time value of money for the organization. NPW summarizes economic surplus relative to the hurdle.",
    formulaLatex: String.raw`\mathrm{NPW}=\sum_{t=0}^{n}\frac{NCF_t}{(1+i)^t} \quad\text{with } i=\text{MARR}`,
    keywords: "feasibility decision benefit cost marr",
  },
  {
    id: "marr",
    track: "pw",
    title: "Minimum Attractive Rate of Return (MARR)",
    summary:
      "MARR is the minimum acceptable compound rate for invested capital, reflecting opportunity cost, risk, and capital constraints. It anchors PW and IRR decision tests.",
    formulaLatex: String.raw`\text{Accept if }\mathrm{NPW}(i=\text{MARR})\ge 0 \quad\text{(single project, conventional cash flows)}`,
    keywords: "hurdle discount opportunity cost",
  },
  {
    id: "different-lives",
    track: "pw",
    title: "Comparing Alternatives with Different Lives",
    summary:
      "Align alternatives on a common study period—often via the LCM of useful lives with a repeatability assumption—or use a stated planning horizon consistent with the decision context.",
    formulaLatex: String.raw`\text{Compare NPW at the same } n_{\text{study}} \text{ and consistent replacement assumptions.}`,
    keywords: "LCM repeatability study period lifecycle",
  },
  {
    id: "perpetuity",
    track: "pw",
    title: "Perpetuity (Capitalized Cost)",
    summary:
      "A perpetual end-of-period uniform series has a finite present worth when i{>}0. Used for endowments and long-horizon infrastructure approximations.",
    formulaLatex: String.raw`P=\frac{A}{i} \quad\text{(end-of-period perpetuity)}`,
    keywords: "endowment infinite scholarship",
  },
  {
    id: "euac",
    track: "annual",
    title: "Equivalent Uniform Annual Cost (EUAC)",
    summary:
      "Converts all cash flows to an equivalent uniform annual amount. EUAC combines initial cost, salvage value, and annual operating costs into a single annual figure for comparison.",
    formulaLatex: String.raw`\text{EUAC} = P(A/P,i,n) - S(A/F,i,n) + \text{Annual Costs}`,
    keywords: "annual cost comparison equivalent uniform",
  },
  {
    id: "euab",
    track: "annual",
    title: "Equivalent Uniform Annual Benefit (EUAB)",
    summary:
      "The uniform annual equivalent of all benefits from a project, including revenues and salvage value. EUAB - EUAC gives the annual worth of an alternative.",
    formulaLatex: String.raw`\text{EUAB} = R + S(A/F,i,n) \quad\text{where } R=\text{annual revenue}`,
    keywords: "annual benefit revenue worth",
  },
  {
    id: "capital-recovery",
    track: "annual",
    title: "Capital Recovery Cost",
    summary:
      "The annual cost to recover an initial investment considering salvage value. Three equivalent methods: EUAC = P(A/P,i,n) - S(A/F,i,n), or = (P-S)(A/P,i,n) + Si, or = P(A/P,i,n) + S(A/P,i,n) - S.",
    formulaLatex: String.raw`\text{CR} = P(A/P,i,n) - S(A/F,i,n) = (P-S)(A/P,i,n) + Si`,
    keywords: "capital recovery depreciation investment",
  },
  {
    id: "loan-amortization",
    track: "annual",
    title: "Loan Amortization",
    summary:
      "The process of paying off a loan through regular payments covering both principal and interest. Early payments are mostly interest; later payments are mostly principal.",
    formulaLatex: String.raw`A = P(A/P,i,n) \quad\text{Payment = Interest + Principal}`,
    keywords: "loan payment schedule interest principal",
  },
  {
    id: "annual-worth",
    track: "annual",
    title: "Annual Worth (AW) Analysis",
    summary:
      "Converts all cash flows to an equivalent uniform annual amount. AW = EUAB - EUAC. Positive AW means the alternative is acceptable at MARR.",
    formulaLatex: String.raw`\text{AW} = \text{EUAB} - \text{EUAC} = \text{NPW}(A/P,i,n)`,
    keywords: "annual worth comparison alternative",
  },
  {
    id: "different-lives-annual",
    track: "annual",
    title: "Different Lives with Annual Worth",
    summary:
      "Annual worth analysis eliminates the need for a common study period when alternatives have different lives. Compare AW directly without LCM assumptions.",
    formulaLatex: String.raw`\text{Compare AW at MARR for each alternative's own life.}`,
    keywords: "comparison different lives LCM repeatability",
  },
  {
    id: "irr",
    track: "irr",
    title: "Internal Rate of Return (IRR)",
    summary:
      "The interest rate at which the present worth of benefits equals the present worth of costs (NPW = 0). IRR represents the project's intrinsic rate of return.",
    formulaLatex: String.raw`\text{PW(Benefits)} - \text{PW(Costs)} = 0 \quad\text{at IRR}`,
    keywords: "rate of return internal interest rate",
  },
  {
    id: "irr-decision-rule",
    track: "irr",
    title: "IRR Decision Rule",
    summary:
      "If IRR > MARR, accept the investment (earns more than minimum required). If IRR < MARR, reject. If IRR = MARR, indifferent.",
    formulaLatex: String.raw`\text{Accept if } \text{IRR} > \text{MARR}`,
    keywords: "decision accept reject hurdle rate",
  },
  {
    id: "trial-error-irr",
    track: "irr",
    title: "Trial-and-Error Method for IRR",
    summary:
      "Guess an interest rate, calculate NPW, adjust based on sign: if NPW > 0 try higher rate, if NPW < 0 try lower rate, then interpolate.",
    formulaLatex: String.raw`\text{Interpolate: } i^* = i_L + \frac{|\text{NPW}_L|}{|\text{NPW}_L| + |\text{NPW}_H|}(i_H - i_L)`,
    keywords: "trial error interpolation guess rate",
  },
  {
    id: "incremental-analysis",
    track: "irr",
    title: "Incremental Rate of Return Analysis",
    summary:
      "When comparing mutually exclusive alternatives, analyze the incremental cash flow (higher cost - lower cost). Accept the higher-cost alternative if IRR on increment >= MARR.",
    formulaLatex: String.raw`\Delta\text{IRR} = \text{IRR on } (\text{Alt}_H - \text{Alt}_L)`,
    keywords: "incremental delta analysis alternatives",
  },
  {
    id: "incremental-decision",
    track: "irr",
    title: "Incremental Analysis Decision Rule",
    summary:
      "Compare alternatives by initial cost order. Calculate IRR on the incremental investment. If ΔIRR >= MARR, choose higher-cost alternative; otherwise choose lower-cost.",
    formulaLatex: String.raw`\text{If } \Delta\text{IRR} \ge \text{MARR}, \text{ choose higher-cost alt}`,
    keywords: "mutually exclusive comparison ranking",
  },
  {
    id: "graphical-irr",
    track: "irr",
    title: "Graphical Interpretation of IRR",
    summary:
      "Plot NPW against interest rate. IRR is where the curve crosses the x-axis (NPW=0). For conventional cash flows, the curve slopes downward.",
    formulaLatex: String.raw`\text{IRR is the x-intercept of } \text{NPW}(i) = 0`,
    keywords: "graph npw interest rate curve",
  },
];
