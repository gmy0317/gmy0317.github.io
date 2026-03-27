import { APP_CONFIG } from "../config.js";

function ensureDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid date: ${date}`);
  }
}

export async function fetchRealtimeHuangli(isoDate) {
  ensureDate(isoDate);

  if (!APP_CONFIG.almanacEndpoint) {
    throw new Error("Realtime almanac endpoint is not configured");
  }

  const url = new URL(APP_CONFIG.almanacEndpoint);
  url.searchParams.set("date", isoDate);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Realtime almanac request failed with ${response.status}`);
  }

  const payload = await response.json();
  if (!payload || !payload.success || !payload.data) {
    throw new Error("Realtime almanac payload is invalid");
  }

  return {
    ...payload.data,
    source: payload.source || "worker-huangli",
  };
}
