const SHANGHAI_TIME_ZONE = "Asia/Shanghai";

function formatInShanghai(date, options) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: SHANGHAI_TIME_ZONE,
    ...options,
  }).format(date);
}

function formatInLocale(date, locale, options) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: SHANGHAI_TIME_ZONE,
    ...options,
  }).format(date);
}

export function getShanghaiDateContext(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SHANGHAI_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .formatToParts(now)
    .reduce((accumulator, part) => {
      if (part.type !== "literal") {
        accumulator[part.type] = part.value;
      }
      return accumulator;
    }, {});

  const isoDate = `${parts.year}-${parts.month}-${parts.day}`;
  const hour = Number(parts.hour);
  const minute = Number(parts.minute);

  return {
    isoDate,
    hour,
    minute,
    weekdayLabel: formatInShanghai(now, { weekday: "long" }),
    weekdayEn: formatInLocale(now, "en-US", { weekday: "long" }).toUpperCase(),
    fullDateLabel: formatInShanghai(now, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    monthDayLabel: formatInShanghai(now, {
      month: "numeric",
      day: "numeric",
    }),
    yearLabel: parts.year,
    monthLabel: formatInShanghai(now, { month: "long" }),
    dayLabel: parts.day,
    clockLabel: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  };
}
