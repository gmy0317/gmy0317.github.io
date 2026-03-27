export async function fetchLunarDate(isoDate) {
  const response = await fetch(
    `https://data.weather.gov.hk/weatherAPI/opendata/lunardate.php?date=${isoDate}`
  );

  if (!response.ok) {
    throw new Error(`Lunar request failed with ${response.status}`);
  }

  const payload = await response.json();

  return {
    lunarYear: payload.LunarYear ?? "",
    lunarDate: payload.LunarDate ?? "",
    source: "hko",
  };
}

export function getLunarFallback() {
  return {
    lunarYear: "乙巳年",
    lunarDate: "二月初九",
    source: "fallback",
  };
}
