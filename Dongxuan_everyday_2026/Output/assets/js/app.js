import { APP_CONFIG } from "./config.js";
import { getShanghaiDateContext } from "./services/date-service.js";
import { fetchShanghaiWeather, getWeatherFallback } from "./services/weather-service.js";
import { fetchLunarDate, getLunarFallback } from "./services/lunar-service.js";
import { fetchRealtimeHuangli } from "./services/huangli-service.js";
import {
  createFortuneProfile,
  createFortuneProfileFromRealtime,
} from "./engines/fortune-engine.js";
import { createClothingAdvice } from "./engines/style-engine.js";
import { createZodiacAdvice } from "./engines/zodiac-engine.js";

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) {
    node.textContent = value;
  }
}

function renderTagList(id, items) {
  const node = document.getElementById(id);
  if (!node) return;
  node.innerHTML = items.map((item) => `<li>${item}</li>`).join("");
}

function renderNotes(id, items) {
  const node = document.getElementById(id);
  if (!node) return;
  node.innerHTML = items.map((item) => `<li>${item}</li>`).join("");
}

function renderColors(colors) {
  const node = document.getElementById("color-swatches");
  if (!node) return;

  node.innerHTML = colors
    .map(
      (color) => `
        <span class="swatch">
          <span class="swatch-dot" style="background:${color.hex}"></span>
          <strong>${color.name}</strong>
        </span>
      `
    )
    .join("");
}

function renderHourGrid(hourFortunes) {
  const node = document.getElementById("hour-grid");
  if (!node) return;

  node.innerHTML = hourFortunes
    .map(
      (item) => `
        <article class="hour-item ${item.status} ${item.isCurrent ? "current" : ""}">
          <div class="hour-header">
            <strong>${item.name}</strong>
            <span class="status-chip ${item.status}">${item.label}</span>
          </div>
          <span class="hour-time">${item.range}</span>
          <p class="hour-text">${item.advice}</p>
        </article>
      `
    )
    .join("");
}

function renderHeroHourSummary(fortune) {
  const current = fortune.currentHour;
  const best = fortune.bestHours.map((item) => item.name).join("、") || "今天以稳为主";
  const avoid = fortune.avoidHours.map((item) => item.name).join("、") || "暂无明显忌时";

  setText("current-hour-focus", `${current.name} ${current.label} ${current.range}`);
  setText("current-hour-note", current.advice);
  setText("best-hours-focus", best);
  setText("best-hours-note", "重要沟通、会面、推进事项优先放在这些时段。");
  setText("avoid-hours-focus", avoid);
  setText("avoid-hours-note", "这些时段更适合保守处理，避免临时拍板。");
}

function renderZodiacGrid(zodiacItems) {
  const node = document.getElementById("zodiac-grid");
  if (!node) return;

  node.innerHTML = zodiacItems
    .map(
      (item) => `
        <article class="zodiac-item ${item.status}">
          <div class="zodiac-header">
            <h3 class="zodiac-name">${item.name}</h3>
            <span class="status-chip ${item.status}">${item.level}</span>
          </div>
          <p class="zodiac-text">${item.advice}</p>
        </article>
      `
    )
    .join("");
}

function renderMeta(fortune) {
  const meta = fortune.meta;

  setText("day-type", `今日${meta.dayType}`);
  setText("day-status", `日值${meta.dayValue}`);
  setText("day-judgement", meta.judgement);
  setText("judgement-day-type", `今日${meta.dayType}`);
  setText("judgement-day-value", `日值${meta.dayValue}`);
  setText("judgement-main", meta.judgement);
  setText("ganzhi-line", `${meta.ganzhiYear}年 ${meta.ganzhiMonth}月 ${meta.ganzhiDay}日`);
  setText("conflict-line", meta.conflict);
  setText("xishen-line", meta.xishen);
  setText("caishen-line", meta.caishen);
  setText("fushen-line", meta.fushen);
  setText("shengmen-line", meta.shengmen || "待补充");
}

function formatNumber(value, suffix = "") {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return `--${suffix}`;
  }

  return `${Math.round(value)}${suffix}`;
}

function formatWeatherUpdated(updatedAt) {
  if (!updatedAt) {
    return "兜底";
  }

  const date = new Date(updatedAt);
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

async function safeLoad(loader, fallbackFactory = null) {
  try {
    return await loader();
  } catch (error) {
    console.error(error);
    if (fallbackFactory) {
      return fallbackFactory();
    }
    return null;
  }
}

async function bootstrap() {
  const dateContext = getShanghaiDateContext();

  setText("today-date", `${dateContext.fullDateLabel} ${dateContext.weekdayLabel}`);
  setText("today-day", dateContext.dayLabel);
  setText("today-weekday-en", dateContext.weekdayEn || "DAY");
  setText("today-month-meta", `${dateContext.yearLabel} ${dateContext.monthLabel}`);

  const [weather, lunar, realtimeAlmanac] = await Promise.all([
    safeLoad(fetchShanghaiWeather, getWeatherFallback),
    safeLoad(() => fetchLunarDate(dateContext.isoDate), getLunarFallback),
    safeLoad(() => fetchRealtimeHuangli(dateContext.isoDate)),
  ]);

  const fortune = realtimeAlmanac
    ? createFortuneProfileFromRealtime(dateContext, weather, realtimeAlmanac, lunar)
    : createFortuneProfile(dateContext, weather, lunar);

  const clothing = createClothingAdvice(dateContext, weather);
  const zodiacAdvice = createZodiacAdvice(dateContext, fortune);

  setText("today-location", weather.location);
  setText("today-lunar", realtimeAlmanac?.lunarText || `农历 ${lunar.lunarYear} ${lunar.lunarDate}`);
  setText("today-summary", fortune.summary);

  setText("weather-label", weather.weatherLabel);
  setText("weather-temp", formatNumber(weather.temperature, "°C"));
  setText("weather-feels-like", formatNumber(weather.apparentTemperature, "°C"));
  setText("weather-wind", formatNumber(weather.windSpeed, " km/h"));
  setText("weather-rain", formatNumber(weather.precipitation, " mm"));
  setText("weather-updated", formatWeatherUpdated(weather.updatedAt));

  setText("clothing-level", clothing.level);
  setText("clothing-advice", clothing.advice);
  setText("today-color-badge", `今日衣色 ${clothing.primaryColor.name}`);
  setText("today-judgement-badge", `总判断 ${fortune.meta.judgement}`);
  renderColors(clothing.colors);

  renderTagList("fortune-yi", fortune.yi);
  renderTagList("fortune-ji", fortune.ji);
  renderMeta(fortune);
  renderHeroHourSummary(fortune);
  renderHourGrid(fortune.hourFortunes);
  renderZodiacGrid(zodiacAdvice);
  renderNotes("today-notes", fortune.notes);

  const almanacStatus = realtimeAlmanac
    ? `黄历来源：${fortune.source}`
    : APP_CONFIG.almanacEndpoint
      ? "黄历接口异常，已切回本地规则兜底"
      : "黄历接口未配置，当前为本地规则兜底";

  setText(
    "data-status",
    `天气来源：${weather.source}；农历来源：${lunar.source}；${almanacStatus}。`
  );
}

bootstrap();
