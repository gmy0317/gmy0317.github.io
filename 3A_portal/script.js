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

const DEFAULT_AGENT_SUMMARY =
  "当前银价处于上升趋势，建议提高“Ag 节省目标”和“性价比”权重；Ag-SnO₂-Cu 与 Ag-SnO₂-Bi₂O₃ 适合作为优先候选体系。";

const EN_TEXT = {
  "3A 电接触材料智能设计平台 Demo": "3A Electrical Contact Material AI Design Platform Demo",
  "3A 电接触材料智能设计平台": "3A Electrical Contact Material AI Design Platform",
  "项目库": "Projects",
  "材料库": "Materials",
  "实验数据": "Experimental Data",
  "Agent 分析": "Agent Analysis",
  "设置": "Settings",
  "张工程师 ▾": "Engineer Zhang ▾",
  "需求输入": "Requirements",
  "场景与工况": "Scenario & Conditions",
  "体系选择": "System Selection",
  "候选体系筛选": "Candidate Screening",
  "权重设置": "Weights",
  "多维权重配置": "Multi-objective Weights",
  "实时情报": "Live Intel",
  "外部信息监控": "External Monitoring",
  "推荐结果": "Recommendations",
  "智能推荐方案": "AI Recommended Plans",
  "实验计划": "Experiment Plan",
  "验证计划生成": "Validation Planning",
  "报告输出": "Reports",
  "报告与导出": "Report & Export",
  "生成历史": "Generation History",
  "清空": "Clear",
  "暂无记录，生成一次新材料后自动归档。": "No records yet. New material generations will be archived here.",
  "应用场景与工况输入": "Application Scenario & Operating Conditions",
  "接触器": "Contactor",
  "继电器": "Relay",
  "断路器": "Circuit Breaker",
  "开关": "Switch",
  "额定电流 (A)": "Rated Current (A)",
  "额定电压 (V)": "Rated Voltage (V)",
  "电流类型": "Current Type",
  "开断频率 (次/小时)": "Switching Frequency (cycles/hour)",
  "寿命要求 (次)": "Lifetime Requirement (cycles)",
  "温度环境 (°C)": "Temperature Range (°C)",
  "是否腐蚀环境": "Corrosive Environment",
  "是否高湿 / 盐雾": "High Humidity / Salt Fog",
  "是否 RoHS / EHS 敏感": "RoHS / EHS Sensitive",
  "否": "No",
  "是": "Yes",
  "成本目标 (元/kg 接点材料)": "Cost Target (CNY/kg contact material)",
  "Ag 节省目标 (%)": "Ag Saving Target (%)",
  "提示：完整填写可获得更精准的多目标推荐与实验验证计划。": "Tip: Complete inputs improve multi-objective recommendations and validation plans.",
  "权重与候选体系": "Weights & Candidate Systems",
  "重置": "Reset",
  "多维权重设置": "Multi-objective Weights",
  "目标空间投影": "Objective-space Projection",
  "实时更新": "Live Update",
  "性能": "Performance",
  "性价比": "Cost Performance",
  "耐磨损": "Wear Resistance",
  "材料价格": "Material Price",
  "创新性": "Innovation",
  "新颖度": "Novelty",
  "EHS / 毒性": "EHS / Toxicity",
  "供应链稳定性": "Supply Chain Stability",
  "候选材料体系": "Candidate Material Systems",
  "可多选": "Multi-select",
  "智能筛选": "Smart Filter",
  "其他 Ag-based systems": "Other Ag-based systems",
  "高级约束": "Advanced Constraints",
  "允许掺杂元素": "Allowed Dopants",
  "禁止毒性元素": "Forbidden Toxic Elements",
  "最大银含量 (wt%)": "Maximum Ag Content (wt%)",
  "可接受工艺": "Acceptable Processes",
  "固相烧结、涂层制备、复合粉体": "Solid-state sintering, coating, composite powder",
  "粉末冶金、热压烧结": "Powder metallurgy, hot-press sintering",
  "增材制造、表面改性": "Additive manufacturing, surface modification",
  "等待 AI Agent 生成推荐": "Waiting for AI Agent recommendations",
  "选择候选体系并点击底部按钮，系统将输出排序、风险、实验路线和成本建议。":
    "Select candidate systems and click the bottom action. The system will output ranking, risk, experiment route and cost advice.",
  "实时外部信息与 AI 检索": "Live External Intelligence & AI Search",
  "近30天": "Last 30 days",
  "近7天": "Last 7 days",
  "近90天": "Last 90 days",
  "银价 / 氧化物原料价格波动": "Silver / Oxide Raw Material Price Volatility",
  "元/kg": "CNY/kg",
  "银价": "Silver",
  "新闻监控": "News Monitor",
  "地缘政治": "Geopolitics",
  "供应链": "Supply Chain",
  "电接触材料": "Contact Materials",
  "国标 / 标准监控": "National / Standard Monitor",
  "材料知识库": "Material Knowledge Base",
  "已连接": "Connected",
  "AI Agent 分析摘要": "AI Agent Analysis Summary",
  "刷新": "Refresh",
  "Agent 就绪：等待生成候选方案": "Agent ready: waiting to generate candidates",
  "生成候选方案 / 开始智能推荐": "Generate Candidates / Start AI Recommendation",
  "保存场景": "Save Scenario",
  "候选材料推荐结果 / 多维分析": "Candidate Material Recommendations / Multi-dimensional Analysis",
  "生成后将在这里展示 Top 候选材料、说明、风险、外部约束与后续实验建议。":
    "After generation, this view shows top candidates, rationale, risks, external constraints and next-step experiment suggestions.",
  "生成时间": "Generation Time",
  "初始要求": "Initial Requirements",
  "推荐材料": "Recommended Material",
  "← 返回需求页": "← Back to Requirements",
  "重新生成推荐": "Regenerate",
  "Top 10 推荐候选": "Top 10 Recommended Candidates",
  "候选 #1": "Candidate #1",
  "材料组成 (wt%)": "Composition (wt%)",
  "对比基准 (wt%)": "Benchmark (wt%)",
  "多维综合能力": "Multi-dimensional Capability",
  "关键预测指标": "Key Predicted Metrics",
  "微观机制解释": "Micro-mechanism Explanation",
  "与基准材料对比": "Comparison with Benchmark",
  "基准：Ag-SnO₂ standard": "Benchmark: Ag-SnO₂ standard",
  "AI 大模型分析摘要": "AI Model Analysis Summary",
  "已生成": "Generated",
  "风险与注意事项": "Risks & Notes",
  "外部实时约束": "Live External Constraints",
  "动态影响排名": "Dynamic Impact Ranking",
  "推荐后动作": "Next Actions",
  "查看详细报告": "View Detailed Report",
  "加入实验计划": "Add to Experiment Plan",
  "导出 PPT": "Export PPT",
  "生成 Agent 解读": "Generate Agent Brief",
  "从推荐到验证": "From Recommendation to Validation",
  "可在实验计划中查看当前进度与任务详情": "Progress and task details are available in Experiment Plan",
  "推荐候选": "Recommended Candidate",
  "已完成": "Completed",
  "专家复核": "Expert Review",
  "待开始": "Pending",
  "润湿角实验": "Wetting-angle Test",
  "基础表征": "Basic Characterization",
  "台架验证": "Bench Validation",
  "总和": "Total",
  "个候选": "candidates",
  "材料": "Material",
  "综合评分 ↑": "Score ↑",
  "成本 (元/kg) ↓": "Cost (CNY/kg) ↓",
  "抗电弧 (%) ↑": "Arc Resistance (%) ↑",
  "寿命 (相对) ↑": "Lifetime (relative) ↑",
  "Ag 含量 ↓": "Ag Content ↓",
  "基准": "Benchmark",
  "候选": "Candidate",
  "成熟体系": "Mature System",
  "低毒": "Low Toxicity",
  "抗烧蚀": "Arc Erosion Resistance",
  "节银潜力": "Ag Saving Potential",
  "导电增强": "Conductivity Boost",
  "成本优化": "Cost Optimized",
  "抗熔焊": "Anti-welding",
  "稳定氧化物": "Stable Oxide",
  "可靠性": "Reliability",
  "低成本": "Low Cost",
  "低熔焊": "Low Welding Risk",
  "工艺敏感": "Process Sensitive",
  "耐磨": "Wear Resistant",
  "高硬度": "High Hardness",
  "成本压力": "Cost Pressure",
  "替代体系": "Alternative System",
  "温升可控": "Temperature-rise Controlled",
  "低银": "Low Ag",
  "新配方": "New Formulation",
  "风险较高": "Higher Risk",
  "高温稳定": "High-temperature Stable",
  "界面强化": "Interface Strengthened",
  "可探索": "Exploratory",
  "开放搜索": "Open Search",
  "高创新": "High Innovation",
  "需验证": "Needs Validation",
  "高性能": "High Performance",
  "稀土改性": "Rare-earth Modified",
  "抗电弧": "Arc Resistant",
  "寿命提升": "Lifetime Boost",
  "梯度结构": "Gradient Structure",
  "新颖度高": "High Novelty",
  "性价比优": "Cost-effective",
  "EHS 友好": "EHS Friendly",
  "高可靠": "High Reliability",
  "纳米弥散": "Nano-dispersed",
  "工艺可控": "Process Controllable",
  "成熟稳定": "Mature & Stable",
  "基线样": "Baseline Sample",
  "低风险": "Low Risk",
  "低 Ag 方案": "Low-Ag Scheme",
  "抗粘着": "Anti-adhesion",
  "耐磨优先": "Wear-first",
  "成本平衡": "Cost Balanced",
  "探索配方": "Exploratory Formula",
  "陶瓷增强": "Ceramic Reinforced",
  "候选体系": "Candidate System",
  "待验证": "To Validate",
  "AI 推荐": "AI Recommended",
  "导电率": "Conductivity",
  "接触电阻": "Contact Resistance",
  "润湿性": "Wettability",
  "质量损失": "Mass Loss",
  "寿命": "Lifetime",
  "Ag 节省": "Ag Saving",
  "成本": "Cost",
  "可制造性": "Manufacturability",
  "EHS": "EHS",
  "团聚风险": "Agglomeration Risk",
  "润湿角": "Wetting Angle",
  "电弧烧蚀坑": "Arc Erosion Pit",
  "迁移风险": "Migration Risk",
  "Ag 流失": "Ag Loss",
  "宏观寿命": "Macroscopic Lifetime",
  "下降": "Lower",
  "小幅下降": "Slightly Lower",
  "变浅": "Shallower",
  "需观察": "Needs Observation",
  "上升": "Higher",
  "可控": "Controlled",
  "持平": "Stable",
  "提升": "Improved",
  "待验证": "To Validate",
  "工艺风险": "Process Risk",
  "数据置信度": "Data Confidence",
  "供应链风险": "Supply Risk",
  "EHS 风险": "EHS Risk",
  "低": "Low",
  "中": "Medium",
  "高": "High",
  "银价走势": "Silver Price Trend",
  "国标 / 法规": "Standards / Regulations",
  "行业新闻": "Industry News",
  "毒性 / EHS": "Toxicity / EHS",
  "无限制物质": "No restricted substances",
  "需复核": "Review Required"
};

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
const languageSwitch = document.querySelector("#languageSwitch");
const languageSwitchText = document.querySelector("#languageSwitchText");

let historyRecords = loadHistory();
let activeRecordId = historyRecords[0]?.id || null;
let currentLang = "zh";
let summaryTemplateIndex = 0;
const originalTextNodes = new WeakMap();

function isEnglish() {
  return currentLang === "en";
}

function tx(text) {
  if (!isEnglish()) return text;
  return EN_TEXT[text] || text;
}

function translateJoin(items, separator = " · ") {
  return items.map((item) => tx(item)).join(separator);
}

function formatDateForLanguage(date) {
  const pad = (value) => String(value).padStart(2, "0");
  if (isEnglish()) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function recordDate(record) {
  return record.createdAt ? new Date(record.createdAt) : new Date();
}

function recordTitle(record) {
  const dateText = formatDateForLanguage(recordDate(record));
  return isEnglish() ? `Material generated on ${dateText}` : `${dateText} 生成的新材料`;
}

function requirementText(requirements, detail = "short") {
  if (!requirements) return "--";
  if (!isEnglish()) return detail === "full" ? requirements.full : requirements.short;
  const scene = tx(requirements.scene || "接触器");
  const short = `${scene} | ${requirements.current}A / ${requirements.voltage} / ${requirements.mode} | ${requirements.frequency} cycles/hour | ${requirements.temp}°C`;
  if (detail === "short") return short;
  return `${short} | lifetime ${requirements.life} | cost ${requirements.costTarget} | Ag saving ${requirements.agTarget}`;
}

function dynamicNote(text) {
  if (!isEnglish()) return text;
  const notes = {
    "综合性能稳健，适合做基线配方和快速验证样件。": "Stable overall performance, suitable as a baseline formulation and fast validation sample.",
    "在银价上行时更具成本弹性，建议优先做 Cu 梯度掺杂。": "More cost-resilient when silver prices rise. Prioritize Cu gradient-doping trials.",
    "性能空间更均衡，适合腐蚀与高湿工况下的耐久验证。": "Balanced performance space, suitable for durability validation under corrosion and high humidity.",
    "性价比突出，但高温氧化和磨损风险需要实验确认。": "Strong cost-performance, but high-temperature oxidation and wear risks need experimental confirmation.",
    "机械磨损优势明显，适合高载荷但供应链成本需监控。": "Clear mechanical wear advantage for high-load cases, with supply cost monitoring required.",
    "可作为 EHS 友好备选，但需补充电弧侵蚀数据。": "An EHS-friendly backup route, but arc erosion data must be supplemented.",
    "具备探索价值，建议先进行小样烧结窗口筛选。": "Worth exploring. Start with small-sample sintering-window screening.",
    "适合高温稳定性探索，需要优化润湿和界面结合。": "Suitable for high-temperature stability exploration; wettability and interface bonding need optimization.",
    "可交给 Agent 扩展检索 Ag 基复合体系与专利路线。": "Let the Agent expand searches across Ag-based composite systems and patent routes.",
    "Cu 与 Bi₂O₃ 协同改善导电和润湿，适合作为高频接触器的首批验证配方。": "Cu and Bi₂O₃ jointly improve conductivity and wettability, making this a strong first-batch validation formula for high-frequency contactors.",
    "CeO₂ 有助于稳定氧化物弥散结构，建议重点观察电弧烧蚀坑形貌。": "CeO₂ helps stabilize oxide dispersion; focus on arc erosion pit morphology.",
    "梯度分布可降低局部热应力，适合探索涂层制备和复合粉体路线。": "Gradient distribution may reduce local thermal stress and fits coating or composite-powder routes.",
    "在高湿与盐雾工况下更稳健，适合与 Ag-SnO₂ 基线做并行对比。": "More robust under humidity and salt fog; compare in parallel with the Ag-SnO₂ baseline.",
    "纳米 SnO₂ 提升弥散均匀性，但需控制粉体团聚与烧结窗口。": "Nano SnO₂ improves dispersion uniformity, but powder agglomeration and sintering windows must be controlled.",
    "适合作为所有新方案的对照材料，用于校准寿命和接触电阻曲线。": "Good control material for calibrating lifetime and contact-resistance curves.",
    "银节省潜力大，但高温氧化和磨损颗粒脱落需要重点验证。": "High Ag-saving potential, with oxidation and wear-particle shedding requiring focused validation.",
    "石墨烯可能改善导电网络，但放大制备一致性是主要风险。": "Graphene may improve conductive networks, but scale-up consistency is the key risk.",
    "适合高载荷机械磨损场景，需评估接触电阻随循环次数的漂移。": "Suitable for high-load wear cases; evaluate contact-resistance drift over cycling.",
    "ZnO 体系 EHS 友好，可作为 SnO₂ 供应波动时的备选路线。": "ZnO is EHS-friendly and can serve as a backup route when SnO₂ supply fluctuates.",
    "Ni 可能改善界面结合，但 CuO 热稳定性和电弧产物需谨慎评估。": "Ni may improve interface bonding, but CuO thermal stability and arc products require careful evaluation.",
    "适合高温稳定性探索，关键在于改善 Ag 与陶瓷相润湿。": "Suitable for high-temperature stability exploration; the key is improving Ag-ceramic wettability."
  };
  return notes[text] || text;
}

function buildSummaryItems(record, candidate) {
  if (isEnglish()) {
    return [
      `After combining weights and external market signals, ${candidate.material} ranks first with a score of ${candidate.score}.`,
      `${candidate.material} is strongest in ${translateJoin(candidate.tags, ", ")}. Start with three dopant-ratio pilot samples.`,
      `Under the current silver-price and ${record.requirements.costTarget} cost constraint, prioritize the Ag content window around ${candidate.composition.Ag || 84} wt%.`,
      "Next step: run Ag-SnO₂ baseline and candidate samples in parallel for contact resistance, wetting angle, erosion morphology and salt-fog aging."
    ];
  }
  return [
    `综合权重与外部行情后，${candidate.material} 暂列第一，综合评分 ${candidate.score}。`,
    `${candidate.material} 的主要优势是 ${candidate.tags.join("、")}，适合先做 3 组掺杂比例小样。`,
    `在当前银价与 ${record.requirements.costTarget} 成本约束下，建议优先验证 Ag 含量 ${candidate.composition.Ag || 84} wt% 附近的窗口。`,
    "下一步建议：基准 Ag-SnO₂ 对照样、候选样同步做接触电阻、润湿角、烧蚀坑形貌与盐雾老化。"
  ];
}

function dynamicRiskText(risk) {
  if (!isEnglish()) return risk.text;
  const text = {
    工艺风险: risk.level === "高" ? "Sintering window and phase dispersion need pilot screening." : risk.level === "中" ? "Process window should be verified with small samples." : "Mature powder metallurgy can support fast validation.",
    数据置信度: "Historical data covers key metrics, but new dopant ratios still need additional validation.",
    供应链风险: risk.level === "中" ? "Raw material price volatility should be included in the cost-sensitivity model." : "Key raw-material supply is stable in the short term.",
    "EHS 风险": risk.level === "中" ? "EHS review is required before scale-up." : "The current candidate satisfies RoHS/REACH constraints; keep batch-level EHS records."
  };
  return text[risk.title] || risk.text;
}

function dynamicConstraintText(item) {
  if (!isEnglish()) return item.text;
  const text = {
    银价走势: "Low-Ag routes gain cost advantage as silver price pressure increases.",
    "国标 / 法规": "Latest 2024 standard can be mapped directly to contact-material validation items.",
    行业新闻: "Track silver-paste demand and its impact on silver-price transmission.",
    "毒性 / EHS": "Compliant with current environmental constraints; keep an EHS review checkpoint."
  };
  return text[item.title] || item.text;
}

function applyStaticLanguage() {
  document.documentElement.lang = isEnglish() ? "en" : "zh-CN";
  document.body.classList.toggle("lang-en", isEnglish());
  document.title = tx("3A 电接触材料智能设计平台 Demo");
  languageSwitchText.textContent = isEnglish() ? "EN / 中文" : "中文 / EN";
  languageSwitch.setAttribute("aria-label", isEnglish() ? "Switch language to Chinese" : "切换为英文");

  const skipSelector =
    "script,style,svg,#languageSwitch,#recommendationRack,#historyList,#agentSummary,#runStateText,#toast,#analysisTitle,#analysisSubtitle,#analysisTime,#analysisRequirement,#analysisRecommendation,#analysisTopList,#analysisBestTitle,#compositionChips,#benchmarkChips,#analysisRadar,#predictorBars,#mechanismList,#comparisonTable,#analysisSummary,#riskTiles,#constraintCards";
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      if (node.parentElement?.closest(skipSelector)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    if (!originalTextNodes.has(node)) originalTextNodes.set(node, node.nodeValue);
    const original = originalTextNodes.get(node);
    const match = original.match(/^(\s*)(.*?)(\s*)$/s);
    if (!match) return;
    node.nodeValue = `${match[1]}${tx(match[2])}${match[3]}`;
  });
}

function refreshLanguageRender() {
  applyStaticLanguage();
  updateSliders();
  drawRadarGrid();
  renderHistoryList();

  const record = historyRecords.find((item) => item.id === activeRecordId);
  if (record) {
    renderRecommendations(record.candidates);
    if (analysisView.classList.contains("active-view")) {
      const selectedIndex = Number(document.querySelector(".analysis-candidate.active")?.dataset.index || 0);
      renderAnalysis(record, selectedIndex);
    } else {
      runStateText.textContent = isEnglish()
        ? `Recommendation complete: ${record.recommendation}, score ${record.candidates[0].score}`
        : `推荐完成：${record.recommendation} 当前综合评分 ${record.candidates[0].score}`;
    }
  } else {
    agentSummary.textContent = tx(DEFAULT_AGENT_SUMMARY);
    runStateText.textContent = tx("Agent 就绪：等待生成候选方案");
  }
}

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
  return formatDateForLanguage(date);
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
    grid.push(`<text class="radar-label" x="${text.x}" y="${text.y}" text-anchor="middle" dominant-baseline="middle">${tx(label)}</text>`);
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

  weightTotal.textContent = `${tx("总和")}：${total}%`;
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
  const activeSceneTab = document.querySelector(".scene-tab.active");
  const activeScene = scenes[activeSceneTab?.dataset.scene]?.label || "未选择场景";
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
    .map((group) => {
      const value = group.querySelector(".active")?.textContent.trim();
      if (value === "Yes") return "是";
      if (value === "No") return "否";
      return value;
    })
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
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(historyRecords.slice(0, 20)));
  } catch {
    // Direct file previews may restrict storage; keep in-memory history working.
  }
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
    historyList.innerHTML = `<div class="history-empty">${tx("暂无记录，生成一次新材料后自动归档。")}</div>`;
    return;
  }

  historyList.innerHTML = historyRecords
    .map(
      (record) => `
        <button class="history-record ${record.id === activeRecordId ? "active" : ""}" data-id="${record.id}" type="button">
          <strong>${recordTitle(record)}</strong>
          <span>${tx("初始要求")}：${requirementText(record.requirements)}</span>
          <small>${tx("推荐材料")}：${record.recommendation}</small>
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
            <p>${dynamicNote(item.note)}</p>
            <div class="result-tags">${item.tags.map((tag) => `<span>${tx(tag)}</span>`).join("")}</div>
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
  analysisTitle.textContent = recordTitle(record);
  analysisSubtitle.textContent = isEnglish()
    ? `Generated from initial requirements "${requirementText(record.requirements, "full")}". Recommended material: ${record.recommendation}.`
    : `基于初始要求「${record.requirements.full}」生成，推荐材料为 ${record.recommendation}。`;
  analysisTime.textContent = formatDateForLanguage(recordDate(record));
  analysisRequirement.textContent = requirementText(record.requirements);
  analysisRecommendation.textContent = record.recommendation;
  candidateCountBadge.textContent = `${record.candidates.length} ${tx("个候选")}`;

  analysisTopList.innerHTML = record.candidates
    .map(
      (item, index) => `
        <button class="analysis-candidate ${index === selectedIndex ? "active" : ""}" data-index="${index}" type="button">
          <span class="rank-pill ${index === 0 ? "top" : ""}">${index + 1}</span>
          <span class="mini-lattice"></span>
          <span>
            <h3>${item.material}</h3>
            <small>${translateJoin(item.tags)}</small>
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
  analysisBestTitle.textContent = `${tx("候选")} #${selectedIndex + 1}  ${candidate.material}`;
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
          <span>${tx(metric.label)}</span>
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
          <span class="mechanism-icon">${tx(item.label).slice(0, 2)}</span>
          <span>${tx(item.label)}</span>
          <em>${tx(item.status)} ${item.arrow}</em>
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
      <span>${tx("材料")}</span><span>${tx("综合评分 ↑")}</span><span>${tx("成本 (元/kg) ↓")}</span><span>${tx("抗电弧 (%) ↑")}</span><span>${tx("寿命 (相对) ↑")}</span><span>${tx("Ag 含量 ↓")}</span>
    </div>
    ${comparisonRows
      .map(
        (row, index) => `
          <div class="comparison-row">
            <span>${index === 0 ? tx("基准") : `${tx("候选")} #${index}`} ${row.name}</span>
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

  analysisSummary.innerHTML = buildSummaryItems(record, candidate).map((item) => `<li>${item}</li>`).join("");
  riskTiles.innerHTML = candidate.risks
    .map((risk) => {
      const cls = risk.level === "低" ? "low" : risk.level === "高" ? "high" : "";
      return `<div class="risk-tile"><strong>${tx(risk.title)}<b class="${cls}">${tx(risk.level)}</b></strong><span>${dynamicRiskText(risk)}</span></div>`;
    })
    .join("");
  constraintCards.innerHTML = candidate.constraints
    .map((item) => `<div class="constraint-card"><strong>${tx(item.title)}<em>${tx(item.value)}</em></strong><span>${dynamicConstraintText(item)}</span></div>`)
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
    grid.push(`<text x="${text.x}" y="${text.y}" text-anchor="middle" dominant-baseline="middle" fill="#9fb7c9" font-size="10">${tx(label)}</text>`);
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
    showToast(isEnglish() ? "Select at least one candidate material system." : "至少选择一个候选材料体系。");
    return;
  }

  generateBtn.disabled = true;
  document.body.classList.add("loading");
  runStateText.textContent = isEnglish()
    ? "Agent running: searching standards, market data, historical experiments and candidate formulas..."
    : "Agent 运行中：正在检索标准、行情、历史实验与候选配方...";
  recommendationRack.innerHTML = `
    <div class="rack-empty">
      <span class="scanner"></span>
      <strong>${isEnglish() ? "AI Agent is fusing multi-source data" : "AI Agent 正在融合多源数据"}</strong>
      <p>${isEnglish() ? "Running material knowledge search, cost sensitivity analysis, EHS filtering, random candidate expansion and feasibility ranking." : "执行材料知识检索、成本敏感性分析、EHS 过滤、随机候选扩展和实验可行性排序。"}</p>
    </div>
  `;

  window.setTimeout(() => {
    const record = createGenerationRecord(candidates);
    historyRecords = [record, ...historyRecords].slice(0, 20);
    activeRecordId = record.id;
    saveHistory();
    renderHistoryList();
    renderRecommendations(candidates);
    runStateText.textContent = isEnglish()
      ? `Recommendation complete: ${record.recommendation}, score ${candidates[0].score}`
      : `推荐完成：${record.recommendation} 当前综合评分 ${candidates[0].score}`;
    agentSummary.textContent = isEnglish()
      ? `AI Agent recommends validating ${record.recommendation} first. This result has been archived as "${recordTitle(record)}" and can be reviewed from Generation History.`
      : `AI Agent 推荐优先验证 ${record.recommendation}。本次结果已归档为「${recordTitle(record)}」，可在左侧生成历史中回看。`;
    generateBtn.disabled = false;
    document.body.classList.remove("loading");
    renderAnalysis(record);
    showToast(isEnglish() ? "Generated the material analysis page and archived it in history." : "已生成新材料结果分析页，并写入历史记录。");
  }, 900);
}

function smartSelect() {
  [...candidateGrid.querySelectorAll(".candidate-card")].forEach((card) => {
    const risk = Number(card.dataset.risk);
    const performance = Number(card.dataset.performance);
    const cost = Number(card.dataset.cost);
    card.classList.toggle("selected", performance >= 76 && risk <= 24 && cost >= 62);
  });
  showToast(isEnglish() ? "Smart filter applied using low toxicity, Ag-saving potential and performance thresholds." : "已按低毒、节银潜力和性能阈值完成智能筛选。");
}

function resetAllWeights() {
  sliders.forEach((slider, index) => {
    slider.value = defaultWeights[index];
  });
  updateSliders();
  showToast(isEnglish() ? "Weights restored to the default multi-objective configuration." : "权重已恢复为默认多目标配置。");
}

function switchScene(tab) {
  sceneTabs.forEach((item) => item.classList.toggle("active", item === tab));
  const scene = scenes[tab.dataset.scene];
  const [currentInput, voltageSelect, frequencyInput] = [inputs[0], inputs[1], inputs[2]];
  currentInput.value = scene.current;
  voltageSelect.value = scene.voltage;
  frequencyInput.value = scene.frequency;
  runStateText.textContent = isEnglish() ? `Current scenario: ${tx(scene.label)}. Agent constraint template refreshed.` : `当前场景：${scene.label}，Agent 已刷新约束模板`;
  showToast(isEnglish() ? `${tx(scene.label)} scenario loaded. Constraint priorities have been refreshed.` : scene.summary);
}

function cycleSummary() {
  const currentIndex = summaryTemplates.findIndex((item) => item === agentSummary.textContent);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % summaryTemplates.length;
  summaryTemplateIndex = nextIndex;
  agentSummary.textContent = isEnglish()
    ? [
        "AI Agent completed multi-objective ranking. When silver prices rise, keep Ag-saving targets above 30%.",
        "External intelligence shows short-term supply volatility. Prioritize low-toxicity, low-Ag systems scalable by powder metallurgy.",
        "Based on performance, EHS and cost constraints, use a three-stage route: baseline, dopant optimization, and accelerated corrosion testing."
      ][summaryTemplateIndex]
    : summaryTemplates[summaryTemplateIndex];
  showToast(isEnglish() ? "Agent summary refreshed." : "Agent 摘要已刷新。");
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
    showToast(isEnglish() ? `Reviewing history record: ${record.recommendation}` : `已回看历史记录：${record.recommendation}`);
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
  saveBtn.addEventListener("click", () => showToast(isEnglish() ? "Scenario saved as Demo_Project_Contact_0526." : "场景已保存为 Demo_Project_Contact_0526。"));
  selectSmart.addEventListener("click", smartSelect);
  resetWeights.addEventListener("click", resetAllWeights);
  refreshAgent.addEventListener("click", cycleSummary);
  backToDesignBtn.addEventListener("click", () => {
    setView("design");
    showToast(isEnglish() ? "Returned to the requirements page." : "已返回需求输入页。");
  });
  regenerateBtn.addEventListener("click", runGeneration);
  clearHistoryBtn.addEventListener("click", () => {
    historyRecords = [];
    activeRecordId = null;
    saveHistory();
    renderHistoryList();
    setView("design");
    showToast(isEnglish() ? "Generation history cleared." : "生成历史已清空。");
  });
  languageSwitch.addEventListener("click", () => {
    currentLang = isEnglish() ? "zh" : "en";
    refreshLanguageRender();
    showToast(isEnglish() ? "Language switched to English." : "已切换为中文。");
  });
}

drawRadarGrid();
drawPriceChart();
updateSliders();
renderHistoryList();
wireInteractions();
refreshLanguageRender();
