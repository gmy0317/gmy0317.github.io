const COLOR_BANK = [
  { name: "米白", hex: "#f0e6d2" },
  { name: "竹青", hex: "#6d8b74" },
  { name: "黛蓝", hex: "#435c76" },
  { name: "杏色", hex: "#d8b48c" },
  { name: "雾灰", hex: "#a7a3a0" },
  { name: "浅卡其", hex: "#c7b28b" },
  { name: "藏黑", hex: "#2f343a" },
  { name: "栗棕", hex: "#7b4b34" },
];

function colorSlice(seed) {
  const first = COLOR_BANK[seed % COLOR_BANK.length];
  const second = COLOR_BANK[(seed + 2) % COLOR_BANK.length];
  return [first, second];
}

export function createClothingAdvice(dateContext, weather) {
  const seed = Number(dateContext.isoDate.replaceAll("-", ""));
  const colors = colorSlice(seed);
  const primaryColor = colors[0];

  let level = "轻便春装";
  let advice = "短袖或薄长袖即可，外出保持轻便。";

  if (weather.temperature <= 10) {
    level = "偏厚保暖";
    advice = "建议针织衫、外套叠穿，晚间加一层更稳。";
  } else if (weather.temperature <= 18) {
    level = "薄外套";
    advice = "长袖配轻外套比较合适，早晚温差注意补一层。";
  } else if (weather.temperature >= 28) {
    level = "清爽透气";
    advice = "建议轻薄透气面料，避免闷热厚重穿搭。";
  }

  if (weather.precipitation > 0.2) {
    advice += " 有降水时尽量选耐脏、好打理的颜色，并带伞。";
  }

  if (weather.windSpeed >= 20) {
    advice += " 风大时上身尽量利落，避免过宽松外搭。";
  }

  return {
    level,
    advice,
    primaryColor,
    colors,
  };
}
