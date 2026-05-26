const defaultWeights = [30, 20, 10, 15, 10, 5, 5, 5];

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

const summaryTemplates = [
  "AI Agent 已完成多目标排序：银价上行时，建议把 Ag 节省目标维持在 30% 以上，并将 Ag-SnO₂-Cu 作为第一批实验验证体系。",
  "外部情报显示供应链短期波动仍在扩大，推荐优先选择低毒、低银且可用粉末冶金放大的体系。",
  "基于性能、EHS 与成本约束，Agent 建议采用“基线 Ag-SnO₂ + 掺杂优化 + 腐蚀环境加速测试”的三阶段路线。"
];

const sliders = [...document.querySelectorAll(".weight-row input[type='range']")];
const weightTotal = document.querySelector("#weightTotal");
const radarChart = document.querySelector("#radarChart");
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

function polarToPoint(center, radius, angle) {
  const radians = (Math.PI / 180) * angle;
  return {
    x: center + radius * Math.cos(radians),
    y: center + radius * Math.sin(radians)
  };
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

  priceChart.innerHTML = [
    `<rect x="0" y="0" width="${width}" height="${height}" fill="transparent" />`,
    ...gridLines,
    ...paths,
    ...labels
  ].join("");
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

function scoreCandidate(card, weights) {
  const performance = Number(card.dataset.performance);
  const cost = Number(card.dataset.cost);
  const risk = Number(card.dataset.risk);
  const ehsBoost = 100 - risk;
  const supply = 82 - risk / 3;
  const innovation = card.dataset.material.includes("systems") ? 88 : 66 + risk / 2;
  const weighted =
    performance * weights["性能"] +
    cost * weights["性价比"] +
    (performance - risk / 3) * weights["耐磨损"] +
    cost * weights["材料价格"] +
    innovation * weights["创新性"] +
    innovation * weights["新颖度"] +
    ehsBoost * weights["EHS / 毒性"] +
    supply * weights["供应链稳定性"];
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0) || 1;
  return Math.max(58, Math.min(96, Math.round(weighted / total)));
}

function renderRecommendations() {
  const selected = selectedCandidates();
  if (!selected.length) {
    showToast("至少选择一个候选材料体系。");
    return;
  }

  const weights = getWeightMap();
  const ranked = selected
    .map((card) => {
      const material = card.dataset.material;
      return {
        material,
        score: scoreCandidate(card, weights),
        profile: candidateProfiles[material]
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  recommendationRack.innerHTML = `
    <div class="recommendation-list">
      ${ranked
        .map(
          (item, index) => `
          <article class="result-card" data-rank="#${index + 1}" style="animation-delay: ${index * 90}ms">
            <h4>${item.material}</h4>
            <div class="score-ring" style="--score: ${item.score}">${item.score}</div>
            <p>${item.profile.note}</p>
            <div class="result-tags">${item.profile.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>
          </article>
        `
        )
        .join("")}
    </div>
  `;

  const best = ranked[0];
  runStateText.textContent = `推荐完成：${best.material} 当前综合评分 ${best.score}`;
  agentSummary.textContent = `AI Agent 推荐优先验证 ${best.material}。建议实验路线：粉体混合 → 烧结窗口筛选 → 1000 次开断预筛 → 高湿盐雾加速老化；同时保留 Ag-SnO₂ 作为对照样。`;
  showToast("候选方案已生成，推荐队列与 Agent 摘要已更新。");
}

function runGeneration() {
  generateBtn.disabled = true;
  document.body.classList.add("loading");
  runStateText.textContent = "Agent 运行中：正在检索标准、行情、历史实验与候选配方...";
  recommendationRack.innerHTML = `
    <div class="rack-empty">
      <span class="scanner"></span>
      <strong>AI Agent 正在融合多源数据</strong>
      <p>执行材料知识检索、成本敏感性分析、EHS 过滤和实验可行性排序。</p>
    </div>
  `;

  window.setTimeout(() => {
    renderRecommendations();
    generateBtn.disabled = false;
    document.body.classList.remove("loading");
  }, 850);
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
}

drawRadarGrid();
drawPriceChart();
updateSliders();
wireInteractions();
