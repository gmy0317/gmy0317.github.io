const SHICHEN = [
  { name: "子时", range: "23:00-00:59" },
  { name: "丑时", range: "01:00-02:59" },
  { name: "寅时", range: "03:00-04:59" },
  { name: "卯时", range: "05:00-06:59" },
  { name: "辰时", range: "07:00-08:59" },
  { name: "巳时", range: "09:00-10:59" },
  { name: "午时", range: "11:00-12:59" },
  { name: "未时", range: "13:00-14:59" },
  { name: "申时", range: "15:00-16:59" },
  { name: "酉时", range: "17:00-18:59" },
  { name: "戌时", range: "19:00-20:59" },
  { name: "亥时", range: "21:00-22:59" },
];

const GOOD_ACTIONS = ["沟通协商", "整理计划", "推进要事", "拜访会面", "学习复盘", "外出办事"];
const BAD_ACTIONS = ["冲动表态", "仓促签约", "情绪争执", "高风险消费", "拖延反复", "熬夜硬撑"];
const NEUTRAL_ACTIONS = ["处理日常", "稳妥推进", "保守观察", "查漏补缺", "轻量社交", "适度休息"];
const DAY_TYPES = ["平日", "定日", "成日", "开日", "收日", "破日", "危日", "执日"];
const DAY_VALUES = ["岁合", "天德", "月德", "岁破", "四相", "玉堂", "金匮", "司命"];
const JUDGEMENTS = {
  good: ["诸事可行", "宜顺势而为", "大事可定", "利会面洽谈"],
  neutral: ["平稳行事", "宜先小后大", "循序推进", "务实安排即可"],
  bad: ["大事勿用", "要事缓行", "不宜仓促拍板", "宜守不宜攻"],
};
const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const ZODIACS = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"];
const DIRECTIONS = ["正东", "东南", "正南", "西南", "正西", "西北", "正北", "东北"];

function getCurrentShichenIndex(hour) {
  if (hour === 23 || hour === 0) {
    return 0;
  }

  return Math.floor((hour + 1) / 2);
}

function createSeed(isoDate) {
  return isoDate
    .split("-")
    .join("")
    .split("")
    .reduce((sum, digit) => sum + Number(digit), 0);
}

function pickGanzhi(seed, offset = 0) {
  return `${STEMS[(seed + offset) % STEMS.length]}${BRANCHES[(seed + offset) % BRANCHES.length]}`;
}

function buildFallbackMeta(seed, goodCount, badCount) {
  const overall = goodCount > badCount ? "good" : badCount > goodCount ? "bad" : "neutral";
  const conflictIndex = (seed + 4) % ZODIACS.length;
  const shaDirections = ["煞东", "煞南", "煞西", "煞北"];

  return {
    dayType: DAY_TYPES[seed % DAY_TYPES.length],
    dayValue: DAY_VALUES[(seed + badCount) % DAY_VALUES.length],
    judgement: JUDGEMENTS[overall][seed % JUDGEMENTS[overall].length],
    ganzhiYear: pickGanzhi(seed, 1),
    ganzhiMonth: pickGanzhi(seed, 5),
    ganzhiDay: pickGanzhi(seed, 9),
    conflict: `冲${ZODIACS[conflictIndex]} ${shaDirections[seed % shaDirections.length]}`,
    xishen: DIRECTIONS[seed % DIRECTIONS.length],
    caishen: DIRECTIONS[(seed + 2) % DIRECTIONS.length],
    fushen: DIRECTIONS[(seed + 4) % DIRECTIONS.length],
    shengmen: DIRECTIONS[(seed + 6) % DIRECTIONS.length],
  };
}

function buildFallbackHourAdvice(status, index, seed) {
  if (status === "good") {
    return `适合${GOOD_ACTIONS[(seed + index) % GOOD_ACTIONS.length]}，顺势推进更稳。`;
  }

  if (status === "bad") {
    return `不宜${BAD_ACTIONS[(seed + index) % BAD_ACTIONS.length]}，先缓一步更合适。`;
  }

  return `适合${NEUTRAL_ACTIONS[(seed + index) % NEUTRAL_ACTIONS.length]}，以稳为主。`;
}

function buildFallbackDayTags(seed, weather) {
  const yi = new Set(["整理安排", "沟通协商", "清理杂事", "学习提升"]);
  const ji = new Set(["情绪争执", "临时大改", "冲动消费"]);

  if (weather.precipitation > 0.2) {
    yi.add("室内事务");
    ji.add("久留户外");
  } else {
    yi.add("短途出行");
  }

  if (weather.temperature >= 26) {
    yi.add("轻量活动");
    ji.add("长时间暴晒");
  } else if (weather.temperature <= 12) {
    yi.add("保暖通勤");
    ji.add("晚间受凉");
  } else {
    yi.add("会面洽谈");
  }

  if (seed % 2 === 0) {
    yi.add("收尾定稿");
    ji.add("反复摇摆");
  } else {
    yi.add("拜访合作");
    ji.add("拖延失约");
  }

  return {
    yi: [...yi].slice(0, 5),
    ji: [...ji].slice(0, 5),
  };
}

function buildNotes(weather, hourFortunes, yi = [], ji = []) {
  const notes = [];
  const goodHours = hourFortunes.filter((item) => item.status === "good").slice(0, 2);
  const badHours = hourFortunes.filter((item) => item.status === "bad").slice(0, 1);

  if (yi.length > 0) {
    notes.push(`今天可优先安排：${yi.slice(0, 3).join("、")}。`);
  }

  if (ji.length > 0) {
    notes.push(`今天尽量避开：${ji.slice(0, 2).join("、")}。`);
  }

  if (goodHours.length > 0) {
    notes.push(`较顺时段可优先放在 ${goodHours.map((item) => item.name).join("、")}。`);
  } else if (badHours.length > 0) {
    notes.push(`${badHours[0].name}更适合保守处理，重要决定尽量避开。`);
  }

  if (weather.precipitation > 0.2) {
    notes.push("上海当前有降水信号，出门建议带伞，节奏放缓。");
  } else if (weather.windSpeed >= 20) {
    notes.push("风力偏明显，外出注意保暖和衣摆整理。");
  } else {
    notes.push("天气整体平稳，适合安排通勤、会面与常规推进。");
  }

  return notes.slice(0, 4);
}

function normalizeHourStatus(rawStatus) {
  if (!rawStatus) {
    return "neutral";
  }

  if (rawStatus.includes("吉")) {
    return "good";
  }

  if (rawStatus.includes("凶") || rawStatus.includes("黑")) {
    return "bad";
  }

  return "neutral";
}

function statusLabel(status) {
  if (status === "good") return "吉";
  if (status === "bad") return "凶";
  return "平";
}

function createRealtimeHourAdvice(hour) {
  const segments = [];

  if (hour.starGod) {
    segments.push(`星神${hour.starGod}`);
  }

  if (hour.yi) {
    segments.push(`宜${hour.yi.slice(0, 4).join("、")}`);
  }

  if (hour.ji && hour.ji.length > 0 && hour.ji[0] !== "无") {
    segments.push(`忌${hour.ji.slice(0, 3).join("、")}`);
  }

  return segments.join("；") || "此时段可按今日整体宜忌稳妥安排。";
}

function getBestHours(hourFortunes) {
  return hourFortunes.filter((item) => item.status === "good").slice(0, 3);
}

function getAvoidHours(hourFortunes) {
  return hourFortunes.filter((item) => item.status === "bad").slice(0, 2);
}

export function createFortuneProfile(dateContext, weather, lunar) {
  const seed = createSeed(dateContext.isoDate);
  const currentIndex = getCurrentShichenIndex(dateContext.hour);

  const hourFortunes = SHICHEN.map((slot, index) => {
    const value = (seed + index * 3) % 9;
    let status = "neutral";

    if (value <= 2) {
      status = "good";
    } else if (value >= 7) {
      status = "bad";
    }

    return {
      ...slot,
      isCurrent: index === currentIndex,
      status,
      label: statusLabel(status),
      advice: buildFallbackHourAdvice(status, index, seed),
    };
  });

  const dayTags = buildFallbackDayTags(seed, weather);
  const bestHours = getBestHours(hourFortunes);
  const avoidHours = getAvoidHours(hourFortunes);
  const meta = buildFallbackMeta(
    seed,
    bestHours.length,
    avoidHours.length
  );

  let summary = `${dateContext.weekdayLabel}整体适合先稳后快，优先处理能落地的事项。`;
  if (bestHours.length > avoidHours.length) {
    summary = `${dateContext.weekdayLabel}可主动推进，吉时多于忌时，重要事务尽量卡在顺时段完成。`;
  } else if (avoidHours.length > bestHours.length) {
    summary = `${dateContext.weekdayLabel}更适合收敛节奏，关键动作不要太急，先确认再执行。`;
  }

  if (lunar.lunarDate) {
    summary += ` 农历${lunar.lunarDate}，建议以有把握的安排为主。`;
  }

  return {
    summary,
    yi: dayTags.yi,
    ji: dayTags.ji,
    hourFortunes,
    currentHour: hourFortunes[currentIndex],
    bestHours,
    avoidHours,
    meta,
    notes: buildNotes(weather, hourFortunes, dayTags.yi, dayTags.ji),
    source: "fallback-rules",
  };
}

export function createFortuneProfileFromRealtime(dateContext, weather, realtime, lunarFallback) {
  const currentIndex = getCurrentShichenIndex(dateContext.hour);
  const realtimeHours = realtime.hours ?? [];

  const hourFortunes = SHICHEN.map((slot, index) => {
    const remote = realtimeHours[index] ?? {};
    const status = normalizeHourStatus(remote.status);

    return {
      name: remote.name || slot.name,
      range: remote.range || slot.range,
      status,
      label: statusLabel(status),
      isCurrent: index === currentIndex,
      advice: createRealtimeHourAdvice(remote),
      starGod: remote.starGod || "",
      conflict: remote.conflict || "",
      yi: remote.yi || [],
      ji: remote.ji || [],
    };
  });

  const bestHours = getBestHours(hourFortunes);
  const avoidHours = getAvoidHours(hourFortunes);
  const fallbackMeta = buildFallbackMeta(dateContext.dayLabel ? Number(dateContext.dayLabel) : 0, bestHours.length, avoidHours.length);
  const rawJudgement = [realtime.dayOfficerType, realtime.dayOfficerText, realtime.dayQuality]
    .filter(Boolean)
    .join(" / ");

  const meta = {
    dayType: realtime.dayType || fallbackMeta.dayType,
    dayValue: realtime.dayValue || fallbackMeta.dayValue,
    judgement: rawJudgement || realtime.judgement || fallbackMeta.judgement,
    ganzhiYear: realtime.ganzhiYear || lunarFallback.lunarYear || fallbackMeta.ganzhiYear,
    ganzhiMonth: realtime.ganzhiMonth || fallbackMeta.ganzhiMonth,
    ganzhiDay: realtime.ganzhiDay || fallbackMeta.ganzhiDay,
    conflict: realtime.conflict || fallbackMeta.conflict,
    xishen: realtime.positions?.xishen || fallbackMeta.xishen,
    caishen: realtime.positions?.caishen || fallbackMeta.caishen,
    fushen: realtime.positions?.fushen || fallbackMeta.fushen,
    shengmen: realtime.positions?.shengmen || fallbackMeta.shengmen,
  };

  const summary = realtime.summary ||
    `${dateContext.weekdayLabel}黄历实时数据已更新，今日可参考宜忌与值神安排事务。`;

  return {
    summary,
    yi: (realtime.yi || []).slice(0, 8),
    ji: (realtime.ji || []).slice(0, 8),
    hourFortunes,
    currentHour: hourFortunes[currentIndex],
    bestHours,
    avoidHours,
    meta,
    notes: buildNotes(weather, hourFortunes, realtime.yi, realtime.ji),
    source: realtime.source || "realtime-huangli",
  };
}
