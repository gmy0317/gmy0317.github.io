const defaultWeights = [30, 20, 10, 15, 10, 5, 5, 5];
const HISTORY_KEY = "threeA.material.generation.history.v2";

const scenes = {
  contactor: {
    label: "接触器",
    current: "100",
    voltage: "AC 400",
    frequency: "1200",
    summary: "接触器场景已载入：高频开断 + 盐雾环境，优先平衡抗电弧烧蚀、银节省和供应链稳定性。"
  },
  relay: {
    label: "继电器",
    current: "16",
    voltage: "DC 48",
    frequency: "3600",
    summary: "继电器场景已载入：低电流高动作频率，建议提高接触电阻稳定性和低成本权重。"
  },
  breaker: {
    label: "断路器",
    current: "250",
    voltage: "AC 690",
    frequency: "240",
    summary: "断路器场景已载入：高电流强电弧，建议优先关注耐烧蚀、抗熔焊和温升安全裕度。"
  },
  switch: {
    label: "开关",
    current: "32",
    voltage: "AC 220",
    frequency: "1800",
    summary: "开关场景已载入：成本敏感且寿命要求高，推荐增强 Ag 节省、可制造性与 RoHS 约束。"
  }
};

const candidateProfiles = {
  "Ag-SnO₂": {
    tags: ["成熟体系", "低毒", "抗烧蚀"],
    note: "综合性能稳健，适合做基线配方和快速验证样件。"
  },
  "Ag-SnO₂-Cu": {
    tags: ["节银潜力", "导电增强", "成本优化"],
    note: "在银价上行时更具成本弹性，建议优先做 Cu 梯度掺杂。"
  },
  "Ag-SnO₂-Bi₂O₃": {
    tags: ["抗熔焊", "稳定氧化物", "可靠性"],
    note: "性能空间更均衡，适合腐蚀与高湿工况下的耐久验证。"
  },
  "Ag-C": {
    tags: ["低成本", "低熔焊", "工艺敏感"],
    note: "性价比突出，但高温氧化和磨损风险需要实验确认。"
  },
  "Ag-WC": {
    tags: ["耐磨", "高硬度", "成本压力"],
    note: "机械磨损优势明显，适合高载荷但供应链成本需监控。"
  },
  "Ag-ZnO": {
    tags: ["低毒", "替代体系", "温升可控"],
    note: "可作为 EHS 友好备选，但需补充电弧侵蚀数据。"
  },
  "Ag-CuO": {
    tags: ["低银", "新配方", "风险较高"],
    note: "具备探索价值，建议先进行小样烧结窗口筛选。"
  },
  "Ag-TiO₂": {
    tags: ["高温稳定", "界面强化", "可探索"],
    note: "适合高温稳定性探索，需要优化润湿和界面结合。"
  },
  "Ag-based systems": {
    tags: ["开放搜索", "高创新", "需验证"],
    note: "可交给 Agent 扩展检索 Ag 基复合体系与专利路线。"
  }
};

const materialIdeas = [
  {
    material: "Ag-SnO₂-Cu-Bi₂O₃",
    parents: ["Ag-SnO₂", "Ag-SnO₂-Cu", "Ag-SnO₂-Bi₂O₃"],
    performance: 93,
    cost: 78,
    risk: 18,
    composition: { Ag: 84, "SnO₂": 13, Cu: 1, "Bi₂O₃": 2 },
    tags: ["高性能", "低银", "抗熔焊"],
    note: "Cu 与 Bi₂O₃ 协同改善导电和润湿，适合作为高频接触器的首批验证配方。"
  },
  {
    material: "Ag-SnO₂-Cu-CeO₂",
    parents: ["Ag-SnO₂", "Ag-SnO₂-Cu"],
    performance: 90,
    cost: 76,
    risk: 17,
    composition: { Ag: 83, "SnO₂": 13, Cu: 2, "CeO₂": 2 },
    tags: ["稀土改性", "抗电弧", "寿命提升"],
    note: "CeO₂ 有助于稳定氧化物弥散结构，建议重点观察电弧烧蚀坑形貌。"
  },
  {
    material: "Ag-SnO₂-La₂O₃ gradient",
    parents: ["Ag-SnO₂", "Ag-based systems"],
    performance: 88,
    cost: 73,
    risk: 20,
    composition: { Ag: 82, "SnO₂": 15, "La₂O₃": 3 },
    tags: ["梯度结构", "界面强化", "新颖度高"],
    note: "梯度分布可降低局部热应力，适合探索涂层制备和复合粉体路线。"
  },
  {
    material: "Ag-SnO₂-Bi₂O₃",
    parents: ["Ag-SnO₂", "Ag-SnO₂-Bi₂O₃"],
    performance: 89,
    cost: 72,
    risk: 16,
    composition: { Ag: 84, "SnO₂": 13, "Bi₂O₃": 3 },
    tags: ["性价比优", "可靠性", "EHS 友好"],
    note: "在高湿与盐雾工况下更稳健，适合与 Ag-SnO₂ 基线做并行对比。"
  },
  {
    material: "Ag-SnO₂ nano",
    parents: ["Ag-SnO₂"],
    performance: 87,
    cost: 70,
    risk: 19,
    composition: { Ag: 86, "SnO₂": 14 },
    tags: ["高可靠", "纳米弥散", "工艺可控"],
    note: "纳米 SnO₂ 提升弥散均匀性，但需控制粉体团聚与烧结窗口。"
  },
  {
    material: "Ag-SnO₂ standard",
    parents: ["Ag-SnO₂"],
    performance: 82,
    cost: 66,
    risk: 14,
    composition: { Ag: 86, "SnO₂": 14 },
    tags: ["成熟稳定", "基线样", "低风险"],
    note: "适合作为所有新方案的对照材料，用于校准寿命和接触电阻曲线。"
  },
  {
    material: "Ag-C low-Ag",
    parents: ["Ag-C", "Ag-based systems"],
    performance: 78,
    cost: 86,
    risk: 28,
    composition: { Ag: 72, C: 23, Cu: 5 },
    tags: ["低 Ag 方案", "低成本", "抗熔焊"],
    note: "银节省潜力大，但高温氧化和磨损颗粒脱落需要重点验证。"
  },
  {
    material: "Ag-graphene contact",
    parents: ["Ag-C", "Ag-based systems"],
    performance: 80,
    cost: 83,
    risk: 34,
    composition: { Ag: 76, C: 18, Ni: 3, Graphene: 3 },
    tags: ["高创新", "低银", "需验证"],
    note: "石墨烯可能改善导电网络，但放大制备一致性是主要风险。"
  },
  {
    material: "Ag-WC-Cu",
    parents: ["Ag-WC", "Ag-SnO₂-Cu"],
    performance: 81,
    cost: 68,
    risk: 24,
    composition: { Ag: 78, WC: 17, Cu: 5 },
    tags: ["耐磨优先", "高硬度", "抗粘着"],
    note: "适合高载荷机械磨损场景，需评估接触电阻随循环次数的漂移。"
  },
  {
    material: "Ag-ZnO-Cu",
    parents: ["Ag-ZnO", "Ag-SnO₂-Cu"],
    performance: 79,
    cost: 75,
    risk: 19,
    composition: { Ag: 80, ZnO: 16, Cu: 4 },
    tags: ["低毒", "替代体系", "成本平衡"],
    note: "ZnO 体系 EHS 友好，可作为 SnO₂ 供应波动时的备选路线。"
  },
  {
    material: "Ag-CuO-Ni",
    parents: ["Ag-CuO", "Ag-based systems"],
    performance: 76,
    cost: 79,
    risk: 31,
    composition: { Ag: 78, CuO: 17, Ni: 5 },
    tags: ["探索配方", "低银", "工艺敏感"],
    note: "Ni 可能改善界面结合，但 CuO 热稳定性和电弧产物需谨慎评估。"
  },
  {
    material: "Ag-TiO₂-ZrO₂",
    parents: ["Ag-TiO₂", "Ag-based systems"],
    performance: 77,
    cost: 74,
    risk: 22,
    composition: { Ag: 81, "TiO₂": 13, "ZrO₂": 6 },
    tags: ["高温稳定", "陶瓷增强", "耐烧蚀"],
    note: "适合高温稳定性探索，关键在于改善 Ag 与陶瓷相润湿。"
  }
];

const summaryTemplates = [
  "AI Agent 已完成多目标排序：银价上行时，建议把 Ag 节省目标维持在 30% 以上，并将 Ag-SnO₂-Cu 作为第一批实验验证体系。",
  "外部情报显示供应链短期波动仍在扩大，推荐优先选择低毒、低银且可用粉末冶金放大的体系。",
  "基于性能、EHS 与成本约束，Agent 建议采用“基线 Ag-SnO₂ + 掺杂优化 + 腐蚀环境加速测试”的三阶段路线。"
];

const sliders = [...document.querySelectorAll(".weight-row input[type='range']")];
const weightTotal = document.querySelector("#weightTotal");
const radarGrid = document.querySelector("#radarGrid");
const radarPolygon = document.querySelector("#radarPolygon");
const radarDots = document.querySelector("#radarDots");
const candidateGrid = document.querySelector("#candidateGrid");
const recommendationRack = document.querySelector("#recommendationRack");
const generateBtn = document.querySelector("#generateBtn");
const saveBtn = document.querySelector("#saveBtn");
const selectSmart = document.querySelector("#selectSmart");
const resetWeights = document.querySelector("#resetWeights");
const runStateText = document.querySelector("#runStateText");
const agentSummary = document.querySelector("#agentSummary");
const refreshAgent = document.querySelector("#refreshAgent");
const toast = document.querySelector("#toast");
const priceChart = document.querySelector("#priceChart");
const sceneTabs = [...document.querySelectorAll(".scene-tab")];
const inputs = [...document.querySelectorAll(".field-grid input, .field-grid select")];
const designView = document.querySelector("#designView");
const analysisView = document.querySelector("#analysisView");
const historyList = document.querySelector("#historyList");
const clearHistoryBtn = document.querySelector("#clearHistoryBtn");
const backToDesignBtn = document.querySelector("#backToDesignBtn");
const regenerateBtn = document.querySelector("#regenerateBtn");
const analysisTitle = document.querySelector("#analysisTitle");
const analysisSubtitle = document.querySelector("#analysisSubtitle");
const analysisTime = document.querySelector("#analysisTime");
const analysisRequirement = document.querySelector("#analysisRequirement");
const analysisRecommendation = document.querySelector("#analysisRecommendation");
const candidateCountBadge = document.querySelector("#candidateCountBadge");
const analysisTopList = document.querySelector("#analysisTopList");
const analysisBestTitle = document.querySelector("#analysisBestTitle");
const compositionChips = document.querySelector("#compositionChips");
const benchmarkChips = document.querySelector("#benchmarkChips");
const analysisRadar = document.querySelector("#analysisRadar");
const predictorBars = document.querySelector("#predictorBars");
const mechanismList = document.querySelector("#mechanismList");
const comparisonTable = document.querySelector("#comparisonTable");
const analysisSummary = document.querySelector("#analysisSummary");
const riskTiles = document.querySelector("#riskTiles");
const constraintCards = document.querySelector("#constraintCards");
const navItems = [...document.querySelectorAll(".top-nav .nav-item")];

let historyRecords = loadHistory();
let activeRecordId = historyRecords[0]?.id || null;

function polarToPoint(center, radius, angle) {
  const radians = (Math.PI / 180) * angle;
  return {
    x: center + radius * Math.cos(radians),
    y: center + radius * Math.sin(radians)
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function sample(items, count) {
  return shuffle(items).slice(0, count);
}

function formatDate(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function drawRadarGrid() {
  const center = 130;
  const maxRadius = 92;
  const labels = sliders.map((slider) => slider.dataset.weight);
  const step = 360 / labels.length;
  const grid = [];

  for (let ring = 1; ring <= 4; ring += 1) {
    const radius = (maxRadius / 4) * ring;
    const points = labels
      .map((_, index) => {
        const point = polarToPoint(center, radius, -90 + step * index);
        return `${point.x},${point.y}`;
      })
      .join(" ");
    grid.push(`<polygon points="${points}" fill="none" stroke="rgba(120, 185, 220, 0.18)" stroke-width="1" />`);
  }

  labels.forEach((label, index) => {
    const axis = polarToPoint(center, maxRadius, -90 + step * index);
    const text = polarToPoint(center, maxRadius + 24, -90 + step * index);
    grid.push(`<line x1="${center}" y1="${center}" x2="${axis.x}" y2="${axis.y}" stroke="rgba(120, 185, 220, 0.16)" />`);
    grid.push(`<text class="radar-label" x="${text.x}" y="${text.y}" text-anchor="middle" dominant-baseline="middle">${label}</text>`);
  });

  radarGrid.innerHTML = grid.join("");
}

function updateSliders() {
  let total = 0;
  sliders.forEach((slider) => {
    const max = Number(slider.max);
    const value = Number(slider.value);
    const percent = Math.round((value / max) * 100);
    slider.style.setProperty("--fill", `${percent}%`);
    slider.nextElementSibling.value = `${value}%`;
    total += value;
  });

  weightTotal.textContent = `总和：${total}%`;
  weightTotal.style.color = total === 100 ? "var(--muted)" : "var(--amber)";
  updateRadar();
}

function updateRadar() {
  const center = 130;
  const maxRadius = 92;
  const values = sliders.map((slider) => Number(slider.value) / Number(slider.max));
  const step = 360 / values.length;
  const points = values.map((value, index) => polarToPoint(center, 24 + value * maxRadius, -90 + step * index));

  radarPolygon.setAttribute("points", points.map((point) => `${point.x},${point.y}`).join(" "));
  radarDots.innerHTML = points
    .map((point) => `<circle cx="${point.x}" cy="${point.y}" r="4" fill="#68fff0" stroke="#03121d" stroke-width="2" />`)
    .join("");
}

function drawPriceChart() {
  const series = [
    { color: "#42f4df", values: [610, 725, 700, 760, 815, 790, 720, 690, 780, 740, 810, 792, 835, 865, 842, 905, 925] },
    { color: "#5e9fff", values: [230, 270, 245, 280, 310, 305, 340, 360, 350, 365, 355, 370, 388, 405, 430, 485, 505] },
    { color: "#ba84ff", values: [125, 140, 132, 128, 121, 118, 126, 133, 129, 122, 119, 124, 130, 136, 127, 138, 148] }
  ];

  const width = 360;
  const height = 170;
  const padX = 28;
  const padY = 22;
  const allValues = series.flatMap((item) => item.values);
  const min = Math.min(...allValues) * 0.85;
  const max = Math.max(...allValues) * 1.05;
  const toX = (index, length) => padX + (index / (length - 1)) * (width - padX * 1.6);
  const toY = (value) => height - padY - ((value - min) / (max - min)) * (height - padY * 2);
  const gridLines = [0, 1, 2, 3].map((line) => {
    const y = padY + line * 34;
    return `<line x1="${padX}" y1="${y}" x2="${width - 16}" y2="${y}" stroke="rgba(120,185,220,.12)" />`;
  });

  const paths = series.map((item) => {
    const d = item.values
      .map((value, index) => `${index === 0 ? "M" : "L"} ${toX(index, item.values.length).toFixed(1)} ${toY(value).toFixed(1)}`)
      .join(" ");
    const dots = item.values
      .filter((_, index) => index % 2 === 0)
      .map((value, index) => {
        const realIndex = index * 2;
        return `<circle cx="${toX(realIndex, item.values.length)}" cy="${toY(value)}" r="2.7" fill="${item.color}" />`;
      })
      .join("");
    return `<path d="${d}" fill="none" stroke="${item.color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />${dots}`;
  });

  const labels = ["04-20", "04-27", "05-04", "05-11", "05-18"].map((label, index) => {
    const x = padX + index * 74;
    return `<text x="${x}" y="${height - 4}" fill="#8ca7bb" font-size="10" text-anchor="middle">${label}</text>`;
  });

  priceChart.innerHTML = [`<rect x="0" y="0" width="${width}" height="${height}" fill="transparent" />`, ...gridLines, ...paths, ...labels].join("");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2400);
}

function selectedCandidates() {
  return [...candidateGrid.querySelectorAll(".candidate-card.selected")];
}

function getWeightMap() {
  return sliders.reduce((acc, slider) => {
    acc[slider.dataset.weight] = Number(slider.value);
    return acc;
  }, {});
}

function selectedBaseProfiles() {
  return selectedCandidates().map((card) => ({
    material: card.dataset.material,
    cost: Number(card.dataset.cost),
    performance: Number(card.dataset.performance),
    risk: Number(card.dataset.risk)
  }));
}

function scoreIdea(idea, weights) {
  const ehsBoost = 100 - idea.risk;
  const supply = 82 - idea.risk / 3;
  const innovation = idea.material.includes("gradient") || idea.material.includes("graphene") ? 90 : 68 + idea.risk / 2;
  const weighted =
    idea.performance * weights["性能"] +
    idea.cost * weights["性价比"] +
    (idea.performance - idea.risk / 3) * weights["耐磨损"] +
    idea.cost * weights["材料价格"] +
    innovation * weights["创新性"] +
    innovation * weights["新颖度"] +
    ehsBoost * weights["EHS / 毒性"] +
    supply * weights["供应链稳定性"];
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0) || 1;
  return Math.round(weighted / total);
}

function buildScores(idea, score) {
  return {
    性能: clamp(score + randomInt(-4, 5), 55, 98),
    成本: clamp(idea.cost + randomInt(-3, 6), 50, 98),
    可制造性: clamp(84 - idea.risk / 2 + randomInt(-4, 5), 45, 96),
    寿命: clamp(idea.performance + randomInt(-6, 6), 50, 98),
    可靠性: clamp(88 - idea.risk / 3 + randomInt(-5, 4), 50, 96),
    EHS: clamp(100 - idea.risk + randomInt(-4, 5), 45, 98),
    供应链: clamp(82 - idea.risk / 3 + randomInt(-5, 5), 50, 96),
    新颖度: clamp(idea.material.includes("standard") ? 58 : 76 + randomInt(-8, 12), 45, 98)
  };
}

function buildMetrics(idea, score) {
  const scoreBoost = Math.round((score - 74) / 2);
  return [
    { label: "导电率", delta: clamp(8 + scoreBoost + randomInt(-3, 5), -12, 26), unit: "%" },
    { label: "接触电阻", delta: -clamp(5 + Math.round((100 - idea.risk) / 14) + randomInt(-2, 4), 2, 18), unit: "%" },
    { label: "润湿性", delta: clamp(9 + scoreBoost + randomInt(-4, 6), -8, 28), unit: "%" },
    { label: "抗电弧", delta: clamp(10 + Math.round(idea.performance / 12) + randomInt(-4, 6), 2, 30), unit: "%" },
    { label: "质量损失", delta: -clamp(7 + Math.round(score / 16) + randomInt(-2, 5), 2, 22), unit: "%" },
    { label: "寿命", delta: clamp(12 + scoreBoost + randomInt(-3, 7), 3, 34), unit: "%" },
    { label: "Ag 节省", delta: -clamp(2 + Math.max(0, 86 - (idea.composition.Ag || 84)) + randomInt(0, 4), 1, 18), unit: "%" }
  ];
}

function buildMechanisms(idea) {
  const library = [
    ["润湿角", idea.material.includes("Bi") || idea.material.includes("Cu") ? "下降" : "小幅下降", "↓"],
    ["电弧烧蚀坑", idea.performance > 86 ? "变浅" : "需观察", "↓"],
    ["团聚风险", idea.material.includes("nano") ? "上升" : "下降", idea.material.includes("nano") ? "↑" : "↓"],
    ["迁移风险", idea.material.includes("Cu") ? "可控" : "下降", "↓"],
    ["Ag 流失", (idea.composition.Ag || 86) < 84 ? "下降" : "持平", "↓"],
    ["宏观寿命", idea.performance > 84 ? "提升" : "待验证", "↑"]
  ];
  return sample(library, 5).map(([label, status, arrow]) => ({ label, status, arrow }));
}

function buildRisks(idea) {
  const processLevel = idea.risk > 28 ? "高" : idea.risk > 20 ? "中" : "低";
  const supplyLevel = idea.material.includes("Bi") || idea.material.includes("WC") ? "中" : "低";
  return [
    { title: "工艺风险", level: processLevel, text: idea.risk > 24 ? "烧结窗口与相分散均匀性需要小样预筛。" : "可沿用成熟粉末冶金路线做快速验证。" },
    { title: "数据置信度", level: idea.material.includes("graphene") || idea.material.includes("gradient") ? "中" : "高", text: "历史实验数据可覆盖核心性能，但新掺杂比例仍需补充验证。" },
    { title: "供应链风险", level: supplyLevel, text: supplyLevel === "中" ? "Bi₂O₃ 或 WC 原料价格波动需进入成本敏感性模型。" : "关键原料供应稳定，短期无明显替代压力。" },
    { title: "EHS 风险", level: idea.risk > 30 ? "中" : "低", text: "当前候选满足 RoHS/REACH 约束，需保留批次级检测记录。" }
  ];
}

function buildConstraints(idea) {
  return [
    { title: "银价走势", value: `${randomInt(858, 889)}.${randomInt(0, 9)} 元/kg`, text: `较上周 ${randomInt(1, 4)}.${randomInt(0, 9)}%，低银方案成本优势扩大。` },
    { title: "国标 / 法规", value: "GB/T 14814", text: "最新版 2024，可直接映射触头材料验证条目。" },
    { title: "行业新闻", value: "银浆需求回暖", text: `${randomInt(2, 5)} 条新动态，关注电子浆料对银价的传导。` },
    { title: "毒性 / EHS", value: idea.risk > 30 ? "需复核" : "无限制物质", text: "符合当前环保约束，建议保留 EHS 审查节点。" }
  ];
}

function buildCandidate(idea, weights) {
  const score = clamp(scoreIdea(idea, weights) + randomInt(-5, 7), 66, 96);
  const profile = candidateProfiles[idea.material] || { tags: idea.tags, note: idea.note };
  return {
    material: idea.material,
    score,
    costIndex: idea.cost,
    risk: idea.risk,
    tags: sample([...idea.tags, ...profile.tags].filter(Boolean), 3),
    note: idea.note || profile.note,
    composition: { ...idea.composition },
    benchmark: { Ag: 86, "SnO₂": 14 },
    metrics: buildMetrics(idea, score),
    scores: buildScores(idea, score),
    mechanisms: buildMechanisms(idea),
    risks: buildRisks(idea),
    constraints: buildConstraints(idea),
    costYuan: randomInt(1680, 2060),
    resistance: randomInt(96, 121),
    lifeFactor: (1 + randomInt(8, 28) / 100).toFixed(2),
    reliability: clamp(76 + Math.round(score / 7) + randomInt(-3, 4), 70, 96)
  };
}

function generateCandidateSet() {
  const selected = selectedBaseProfiles();
  if (!selected.length) return [];

  const weights = getWeightMap();
  const selectedNames = selected.map((item) => item.material);
  const directIdeas = selected.map((item) => ({
    material: item.material,
    parents: [item.material],
    performance: item.performance,
    cost: item.cost,
    risk: item.risk,
    composition: item.material === "Ag-C" ? { Ag: 78, C: 22 } : item.material === "Ag-WC" ? { Ag: 80, WC: 20 } : { Ag: 86, "SnO₂": 14 },
    tags: candidateProfiles[item.material]?.tags || ["候选体系", "待验证", "AI 推荐"],
    note: candidateProfiles[item.material]?.note || "开放候选体系，适合交给 Agent 做专利与实验数据扩展检索。"
  }));

  const expandedIdeas = materialIdeas.filter((idea) => idea.parents.some((parent) => selectedNames.includes(parent)) || selectedNames.includes(idea.material));
  const fallbackIdeas = shuffle(materialIdeas).filter((idea) => !expandedIdeas.some((item) => item.material === idea.material));
  const pool = [...directIdeas, ...expandedIdeas, ...fallbackIdeas]
    .filter((idea, index, list) => list.findIndex((item) => item.material === idea.material) === index)
    .slice(0, 12);

  return shuffle(pool)
    .map((idea) => buildCandidate(idea, weights))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

function collectRequirements() {
  const activeScene = document.querySelector(".scene-tab.active")?.textContent.trim() || "未选择场景";
  const current = inputs[0]?.value || "--";
  const voltage = inputs[1]?.value || "--";
  const frequency = inputs[2]?.value || "--";
  const life = inputs[3]?.value || "--";
  const temp = inputs[4]?.value || "--";
  const mode = document.querySelector(".toggle-option.active")?.textContent.trim() || "AC";
  const constraintSelects = [...document.querySelectorAll(".constraint-stack select")];
  const costTarget = constraintSelects[0]?.value || "≤ 800";
  const agTarget = constraintSelects[1]?.value || "≥ 30%";
  const activeSwitches = [...document.querySelectorAll(".binary-switch")]
    .map((group) => group.querySelector(".active")?.textContent.trim())
    .join(" / ");
  const short = `${activeScene} | ${current}A / ${voltage} / ${mode} | ${frequency}次/小时 | ${temp}°C`;
  return {
    short,
    full: `${short} | 寿命 ${life} | 成本 ${costTarget} | Ag节省 ${agTarget} | 环境约束 ${activeSwitches}`,
    scene: activeScene,
    current,
    voltage,
    mode,
    frequency,
    life,
    temp,
    costTarget,
    agTarget
  };
}

function createGenerationRecord(candidates) {
  const now = new Date();
  const requirements = collectRequirements();
  const best = candidates[0];
  return {
    id: `gen-${now.getTime()}-${randomInt(100, 999)}`,
    createdAt: now.toISOString(),
    createdAtText: formatDate(now),
    title: `${formatDate(now)} 生成的新材料`,
    requirements,
    recommendation: best.material,
    candidates,
    summary: [
      `综合权重与外部行情后，${best.material} 暂列第一，综合评分 ${best.score}。`,
      `${best.material} 的主要优势是 ${best.tags.join("、")}，适合先做 3 组掺杂比例小样。`,
      `在当前银价与 ${requirements.costTarget} 成本约束下，建议优先验证 Ag 含量 ${best.composition.Ag || 84} wt% 附近的窗口。`,
      "下一步建议：基准 Ag-SnO₂ 对照样、候选样同步做接触电阻、润湿角、烧蚀坑形貌与盐雾老化。"
    ]
  };
}

function saveHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(historyRecords.slice(0, 20)));
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function renderHistoryList() {
  if (!historyRecords.length) {
    historyList.innerHTML = `<div class="history-empty">暂无记录，生成一次新材料后自动归档。</div>`;
    return;
  }

  historyList.innerHTML = historyRecords
    .map(
      (record) => `
        <button class="history-record ${record.id === activeRecordId ? "active" : ""}" data-id="${record.id}" type="button">
          <strong>${record.title}</strong>
          <span>初始要求：${record.requirements.short}</span>
          <small>推荐材料：${record.recommendation}</small>
        </button>
      `
    )
    .join("");
}

function renderRecommendations(candidates) {
  recommendationRack.innerHTML = `
    <div class="recommendation-list">
      ${candidates
        .slice(0, 3)
        .map(
          (item, index) => `
          <article class="result-card" data-rank="#${index + 1}" style="animation-delay: ${index * 90}ms">
            <h4>${item.material}</h4>
            <div class="score-ring" style="--score: ${item.score}">${item.score}</div>
            <p>${item.note}</p>
            <div class="result-tags">${item.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>
          </article>
        `
        )
        .join("")}
    </div>
  `;
}

function setView(view) {
  const isAnalysis = view === "analysis";
  designView.classList.toggle("active-view", !isAnalysis);
  analysisView.classList.toggle("active-view", isAnalysis);
  designView.setAttribute("aria-hidden", String(isAnalysis));
  analysisView.setAttribute("aria-hidden", String(!isAnalysis));
  navItems.forEach((item, index) => item.classList.toggle("active", isAnalysis ? index === 3 : index === 0));
}

function renderAnalysis(record, selectedIndex = 0) {
  const candidate = record.candidates[selectedIndex] || record.candidates[0];
  activeRecordId = record.id;
  analysisTitle.textContent = record.title;
  analysisSubtitle.textContent = `基于初始要求「${record.requirements.full}」生成，推荐材料为 ${record.recommendation}。`;
  analysisTime.textContent = record.createdAtText;
  analysisRequirement.textContent = record.requirements.short;
  analysisRecommendation.textContent = record.recommendation;
  candidateCountBadge.textContent = `${record.candidates.length} 个候选`;

  analysisTopList.innerHTML = record.candidates
    .map(
      (item, index) => `
        <button class="analysis-candidate ${index === selectedIndex ? "active" : ""}" data-index="${index}" type="button">
          <span class="rank-pill ${index === 0 ? "top" : ""}">${index + 1}</span>
          <span class="mini-lattice"></span>
          <span>
            <h3>${item.material}</h3>
            <small>${item.tags.join(" · ")}</small>
          </span>
          <span class="score-badge">${item.score}</span>
        </button>
      `
    )
    .join("");

  renderCandidateDetail(record, candidate, selectedIndex);
  renderHistoryList();
  setView("analysis");
}

function renderCandidateDetail(record, candidate, selectedIndex) {
  analysisBestTitle.textContent = `候选 #${selectedIndex + 1}  ${candidate.material}`;
  compositionChips.innerHTML = Object.entries(candidate.composition)
    .map(([key, value]) => `<span class="metric-chip">${key} <b>${value}</b></span>`)
    .join("");
  benchmarkChips.innerHTML = Object.entries(candidate.benchmark)
    .map(([key, value]) => `<span class="metric-chip">${key} <b>${value}</b></span>`)
    .join("");

  drawAnalysisRadar(candidate.scores);
  predictorBars.innerHTML = candidate.metrics
    .map((metric) => {
      const width = clamp(50 + metric.delta * 1.8, 16, 96);
      return `
        <div class="predictor-row">
          <span>${metric.label}</span>
          <span class="predictor-track"><span class="predictor-fill" style="width: ${width}%"></span></span>
          <em>${metric.delta > 0 ? "+" : ""}${metric.delta}${metric.unit}</em>
        </div>
      `;
    })
    .join("");

  mechanismList.innerHTML = candidate.mechanisms
    .map(
      (item) => `
        <div class="mechanism-item">
          <span class="mechanism-icon">${item.label.slice(0, 2)}</span>
          <span>${item.label}</span>
          <em>${item.status} ${item.arrow}</em>
        </div>
      `
    )
    .join("");

  const comparisonRows = [
    { name: "基准 Ag-SnO₂", score: 74.8, cost: 1850, resistance: 100, life: "1.00x", ag: 86, reliability: "★★★☆☆" },
    ...record.candidates.slice(0, 4).map((item) => ({
      name: item.material,
      score: item.score,
      cost: item.costYuan,
      resistance: item.resistance,
      life: `${item.lifeFactor}x`,
      ag: item.composition.Ag || 84,
      reliability: "★★★★★".slice(0, Math.round(item.reliability / 20)) + "☆☆☆☆☆".slice(0, 5 - Math.round(item.reliability / 20))
    }))
  ];

  comparisonTable.innerHTML = `
    <div class="comparison-row header">
      <span>材料</span><span>综合评分 ↑</span><span>成本 (元/kg) ↓</span><span>抗电弧 (%) ↑</span><span>寿命 (相对) ↑</span><span>Ag 含量 ↓</span>
    </div>
    ${comparisonRows
      .map(
        (row, index) => `
          <div class="comparison-row">
            <span>${index === 0 ? "基准" : `候选 #${index}`} ${row.name}</span>
            <span class="${index > 0 ? "up-value" : ""}">${row.score}</span>
            <span class="${row.cost > 1900 ? "down-value" : ""}">${row.cost.toLocaleString()}</span>
            <span>${row.resistance}</span>
            <span class="${index > 0 ? "up-value" : ""}">${row.life}</span>
            <span>${row.ag}</span>
          </div>
        `
      )
      .join("")}
  `;

  analysisSummary.innerHTML = record.summary.map((item) => `<li>${item}</li>`).join("");
  riskTiles.innerHTML = candidate.risks
    .map((risk) => {
      const cls = risk.level === "低" ? "low" : risk.level === "高" ? "high" : "";
      return `<div class="risk-tile"><strong>${risk.title}<b class="${cls}">${risk.level}</b></strong><span>${risk.text}</span></div>`;
    })
    .join("");
  constraintCards.innerHTML = candidate.constraints
    .map((item) => `<div class="constraint-card"><strong>${item.title}<em>${item.value}</em></strong><span>${item.text}</span></div>`)
    .join("");
}

function drawAnalysisRadar(scores) {
  const labels = Object.keys(scores);
  const values = Object.values(scores);
  const center = 130;
  const maxRadius = 78;
  const step = 360 / labels.length;
  const grid = [];

  for (let ring = 1; ring <= 4; ring += 1) {
    const radius = (maxRadius / 4) * ring;
    const points = labels.map((_, index) => {
      const point = polarToPoint(center, radius, -90 + step * index);
      return `${point.x},${point.y}`;
    });
    grid.push(`<polygon points="${points.join(" ")}" fill="none" stroke="rgba(120,185,220,.18)" />`);
  }

  labels.forEach((label, index) => {
    const axis = polarToPoint(center, maxRadius, -90 + step * index);
    const text = polarToPoint(center, maxRadius + 18, -90 + step * index);
    grid.push(`<line x1="${center}" y1="${center}" x2="${axis.x}" y2="${axis.y}" stroke="rgba(120,185,220,.14)" />`);
    grid.push(`<text x="${text.x}" y="${text.y}" text-anchor="middle" dominant-baseline="middle" fill="#9fb7c9" font-size="10">${label}</text>`);
  });

  const points = values.map((value, index) => {
    const point = polarToPoint(center, (value / 100) * maxRadius, -90 + step * index);
    return `${point.x},${point.y}`;
  });
  analysisRadar.innerHTML = `
    <defs>
      <radialGradient id="analysisFill" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stop-color="#42f4df" stop-opacity=".72" />
        <stop offset="100%" stop-color="#12a7ff" stop-opacity=".14" />
      </radialGradient>
    </defs>
    ${grid.join("")}
    <polygon points="${points.join(" ")}" fill="url(#analysisFill)" stroke="#59ffe6" stroke-width="2"></polygon>
    ${points
      .map((point) => {
        const [x, y] = point.split(",");
        return `<circle cx="${x}" cy="${y}" r="3.6" fill="#68fff0" stroke="#03121d" stroke-width="1.6" />`;
      })
      .join("")}
  `;
}

function runGeneration() {
  const candidates = generateCandidateSet();
  if (!candidates.length) {
    showToast("至少选择一个候选材料体系。");
    return;
  }

  generateBtn.disabled = true;
  document.body.classList.add("loading");
  runStateText.textContent = "Agent 运行中：正在检索标准、行情、历史实验与候选配方...";
  recommendationRack.innerHTML = `
    <div class="rack-empty">
      <span class="scanner"></span>
      <strong>AI Agent 正在融合多源数据</strong>
      <p>执行材料知识检索、成本敏感性分析、EHS 过滤、随机候选扩展和实验可行性排序。</p>
    </div>
  `;

  window.setTimeout(() => {
    const record = createGenerationRecord(candidates);
    historyRecords = [record, ...historyRecords].slice(0, 20);
    activeRecordId = record.id;
    saveHistory();
    renderHistoryList();
    renderRecommendations(candidates);
    runStateText.textContent = `推荐完成：${record.recommendation} 当前综合评分 ${candidates[0].score}`;
    agentSummary.textContent = `AI Agent 推荐优先验证 ${record.recommendation}。本次结果已归档为「${record.title}」，可在左侧生成历史中回看。`;
    generateBtn.disabled = false;
    document.body.classList.remove("loading");
    renderAnalysis(record);
    showToast("已生成新材料结果分析页，并写入历史记录。");
  }, 900);
}

function smartSelect() {
  [...candidateGrid.querySelectorAll(".candidate-card")].forEach((card) => {
    const risk = Number(card.dataset.risk);
    const performance = Number(card.dataset.performance);
    const cost = Number(card.dataset.cost);
    card.classList.toggle("selected", performance >= 76 && risk <= 24 && cost >= 62);
  });
  showToast("已按低毒、节银潜力和性能阈值完成智能筛选。");
}

function resetAllWeights() {
  sliders.forEach((slider, index) => {
    slider.value = defaultWeights[index];
  });
  updateSliders();
  showToast("权重已恢复为默认多目标配置。");
}

function switchScene(tab) {
  sceneTabs.forEach((item) => item.classList.toggle("active", item === tab));
  const scene = scenes[tab.dataset.scene];
  const [currentInput, voltageSelect, frequencyInput] = [inputs[0], inputs[1], inputs[2]];
  currentInput.value = scene.current;
  voltageSelect.value = scene.voltage;
  frequencyInput.value = scene.frequency;
  runStateText.textContent = `当前场景：${scene.label}，Agent 已刷新约束模板`;
  showToast(scene.summary);
}

function cycleSummary() {
  const currentIndex = summaryTemplates.findIndex((item) => item === agentSummary.textContent);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % summaryTemplates.length;
  agentSummary.textContent = summaryTemplates[nextIndex];
  showToast("Agent 摘要已刷新。");
}

function wireInteractions() {
  sliders.forEach((slider) => slider.addEventListener("input", updateSliders));
  candidateGrid.addEventListener("click", (event) => {
    const card = event.target.closest(".candidate-card");
    if (!card) return;
    card.classList.toggle("selected");
  });

  analysisTopList.addEventListener("click", (event) => {
    const button = event.target.closest(".analysis-candidate");
    if (!button) return;
    const record = historyRecords.find((item) => item.id === activeRecordId);
    if (record) renderAnalysis(record, Number(button.dataset.index));
  });

  historyList.addEventListener("click", (event) => {
    const button = event.target.closest(".history-record");
    if (!button) return;
    const record = historyRecords.find((item) => item.id === button.dataset.id);
    if (!record) return;
    renderAnalysis(record);
    showToast(`已回看历史记录：${record.recommendation}`);
  });

  document.querySelectorAll(".toggle-option").forEach((button) => {
    button.addEventListener("click", () => {
      button.parentElement.querySelectorAll(".toggle-option").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
    });
  });

  document.querySelectorAll(".binary-switch button").forEach((button) => {
    button.addEventListener("click", () => {
      button.parentElement.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
    });
  });

  sceneTabs.forEach((tab) => tab.addEventListener("click", () => switchScene(tab)));
  generateBtn.addEventListener("click", runGeneration);
  saveBtn.addEventListener("click", () => showToast("场景已保存为 Demo_Project_Contact_0526。"));
  selectSmart.addEventListener("click", smartSelect);
  resetWeights.addEventListener("click", resetAllWeights);
  refreshAgent.addEventListener("click", cycleSummary);
  backToDesignBtn.addEventListener("click", () => {
    setView("design");
    showToast("已返回需求输入页。");
  });
  regenerateBtn.addEventListener("click", runGeneration);
  clearHistoryBtn.addEventListener("click", () => {
    historyRecords = [];
    activeRecordId = null;
    saveHistory();
    renderHistoryList();
    setView("design");
    showToast("生成历史已清空。");
  });
}

drawRadarGrid();
drawPriceChart();
updateSliders();
renderHistoryList();
wireInteractions();
