const SHANGHAI = {
  latitude: 31.2304,
  longitude: 121.4737,
  name: "上海",
};

const WEATHER_CODE_MAP = {
  0: "晴",
  1: "大致晴朗",
  2: "局部多云",
  3: "阴",
  45: "有雾",
  48: "有雾凇",
  51: "小毛雨",
  53: "毛雨",
  55: "较强毛雨",
  56: "冻毛雨",
  57: "强冻毛雨",
  61: "小雨",
  63: "中雨",
  65: "大雨",
  66: "冻雨",
  67: "强冻雨",
  71: "小雪",
  73: "中雪",
  75: "大雪",
  77: "阵雪",
  80: "小阵雨",
  81: "阵雨",
  82: "强阵雨",
  85: "小阵雪",
  86: "强阵雪",
  95: "雷雨",
  96: "雷暴夹冰雹",
  99: "强雷暴夹冰雹",
};

export async function fetchShanghaiWeather() {
  const query = new URLSearchParams({
    latitude: String(SHANGHAI.latitude),
    longitude: String(SHANGHAI.longitude),
    current: "temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
    timezone: "Asia/Shanghai",
    forecast_days: "1",
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`Weather request failed with ${response.status}`);
  }

  const payload = await response.json();
  const current = payload.current ?? {};

  return {
    location: SHANGHAI.name,
    temperature: current.temperature_2m ?? null,
    apparentTemperature: current.apparent_temperature ?? null,
    windSpeed: current.wind_speed_10m ?? null,
    precipitation: current.precipitation ?? null,
    weatherCode: current.weather_code ?? null,
    weatherLabel: WEATHER_CODE_MAP[current.weather_code] ?? "天气更新中",
    updatedAt: current.time ?? null,
    source: "open-meteo",
  };
}

export function getWeatherFallback() {
  return {
    location: SHANGHAI.name,
    temperature: 22,
    apparentTemperature: 22,
    windSpeed: 9,
    precipitation: 0,
    weatherCode: 1,
    weatherLabel: "晴到多云",
    updatedAt: null,
    source: "fallback",
  };
}
