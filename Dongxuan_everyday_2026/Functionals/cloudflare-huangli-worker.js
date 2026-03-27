const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-headers": "Content-Type",
  "content-type": "application/json; charset=utf-8",
};

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

const TXT = {
  yi: "\u5b9c",
  ji: "\u5fcc",
  lunarPrefix: "\u519c\u5386 ",
  taishenPrefix: "\u80ce\u795e\uff1a",
  wuxingPrefix: "\u4e94\u884c\uff1a",
  xishenPrefix: "\u559c\u795e\uff1a",
  fushenPrefix: "\u798f\u795e\uff1a",
  caishenPrefix: "\u8d22\u795e\uff1a",
  dayOfficerPrefix: "\u4eca\u65e5\u503c\u795e\u662f",
  goodDay: "\u597d\u65e5\u5b50",
  dayChongPrefix: "\u65e5\u51b2\uff1a",
  dayShaPrefix: "\u65e5\u715e\uff1a",
  day: "\u65e5",
  zhiWei: "\u6267\u4f4d",
  titleSuanbu: "\u62e9\u5409\u8001\u9ec4\u5386",
  now: "\u4eca",
  hourZi: "\u5b50\u65f6",
  hourWu: "\u5348\u65f6",
  chongSha: "\u51b2\u715e",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: CORS_HEADERS,
  });
}

function htmlToLines(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<(br|\/p|\/div|\/li|\/tr|\/td|\/th|\/h1|\/h2|\/h3|\/h4|\/h5|\/h6)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function parseRange(value) {
  return (value || "").replace(/\s+/g, "");
}

function findIndexAfter(lines, startIndex, target) {
  for (let index = startIndex; index < lines.length; index += 1) {
    if (lines[index] === target) {
      return index;
    }
  }
  return -1;
}

function parseSuanbu(lines) {
  const titleIndex = lines.findIndex((line) => line.includes(TXT.titleSuanbu));
  const firstHourIndex = findIndexAfter(lines, titleIndex, TXT.hourZi);
  const secondHourIndex = findIndexAfter(lines, firstHourIndex + 1, TXT.hourWu);

  if (firstHourIndex === -1 || secondHourIndex === -1) {
    throw new Error("Failed to parse suanbu hour blocks");
  }

  const parseHourBlock = (startIndex) => {
    const names = lines.slice(startIndex, startIndex + 6);
    const base = startIndex + 6;

    return names.map((name, index) => ({
      name,
      range: parseRange(lines[base + 1 + index]),
      starGod: lines[base + 8 + index] || "",
      yi: (lines[base + 15 + index] || "").split(" ").filter(Boolean),
      ji: (lines[base + 22 + index] || "").split(" ").filter(Boolean),
      conflict: lines[base + 29 + index] || "",
      status: lines[base + 36 + index] || "",
    }));
  };

  const daySectionIndex = lines.findIndex((line) => line === TXT.now);

  return {
    lunarText:
      lines[59] && lines[60] && lines[61]
        ? `${TXT.lunarPrefix}${lines[59]} ${lines[60]} ${lines[61]}`
        : "",
    yi: daySectionIndex >= 0 ? lines[daySectionIndex + 1].split(" ").filter(Boolean) : [],
    ji: daySectionIndex >= 0 ? lines[daySectionIndex + 2].split(" ").filter(Boolean) : [],
    conflict:
      lines.find((line, index) => line && lines[index - 1] === TXT.chongSha) || "",
    positionsLine: lines.find((line) => line.startsWith("\u559c\u795e:")) || "",
    hours: [...parseHourBlock(firstHourIndex), ...parseHourBlock(secondHourIndex)],
  };
}

function parseQmrl(lines) {
  const yiStart = lines.indexOf(TXT.yi);
  const jiStart = lines.indexOf(TXT.ji);
  const yiEnd = lines.findIndex((line) => line.startsWith(TXT.taishenPrefix));
  const jiEnd = lines.findIndex((line) => line.startsWith(TXT.wuxingPrefix));

  const yi = yiStart >= 0 && yiEnd > yiStart ? lines.slice(yiStart + 1, yiEnd) : [];
  const ji = jiStart >= 0 && jiEnd > jiStart ? lines.slice(jiStart + 1, jiEnd) : [];

  const positions = {
    xishen: (lines.find((line) => line.startsWith(TXT.xishenPrefix)) || "").replace(TXT.xishenPrefix, ""),
    fushen: (lines.find((line) => line.startsWith(TXT.fushenPrefix)) || "").replace(TXT.fushenPrefix, ""),
    caishen: (lines.find((line) => line.startsWith(TXT.caishenPrefix)) || "").replace(TXT.caishenPrefix, ""),
    shengmen: "",
  };

  const lunarText = lines.find((line) => line.startsWith(TXT.lunarPrefix)) || "";
  const ganzhiLine =
    lines.find((line) => /^\S+\u5e74\uff08.+?\uff09\S+\u6708\uff08.+?\uff09\S+\u65e5\uff08.+?\uff09$/.test(line)) || "";
  const ganzhiMatch =
    ganzhiLine.match(/^(.+?)\u5e74\uff08.+?\uff09(.+?)\u6708\uff08.+?\uff09(.+?)\u65e5/) || [];
  const dayOfficerLine = lines.find((line) => line.startsWith(TXT.dayOfficerPrefix)) || "";
  const dayOfficerMatch = dayOfficerLine.match(/^今日值神是(.+?)，是(.+?)，/);
  const wuxingLine = lines.find((line) => line.startsWith(TXT.wuxingPrefix)) || "";
  const dayTypeMatch = wuxingLine.match(/五行：(.+?)\s+(.+执位)$/);
  const dayChong = lines.find((line) => line.startsWith(TXT.dayChongPrefix)) || "";
  const daySha = lines.find((line) => line.startsWith(TXT.dayShaPrefix)) || "";

  return {
    yi,
    ji,
    lunarText,
    ganzhiYear: ganzhiMatch?.[1] || "",
    ganzhiMonth: ganzhiMatch?.[2] || "",
    ganzhiDay: ganzhiMatch?.[3] || "",
    dayType: (dayTypeMatch?.[2] || "").replace(TXT.zhiWei, TXT.day),
    dayValue: dayOfficerMatch?.[1] || "",
    dayOfficerType: dayOfficerMatch?.[2] || "",
    dayOfficerText: dayOfficerLine.includes(TXT.goodDay) ? "\u662f\u4e2a\u597d\u65e5\u5b50" : "",
    conflict: [
      dayChong.replace(TXT.dayChongPrefix, "\u51b2"),
      daySha.replace(TXT.dayShaPrefix, "\u715e"),
    ]
      .filter(Boolean)
      .join(" "),
    positions,
  };
}

function parsePositions(line, fallback = {}) {
  if (!line) return fallback;

  const xishen = (line.match(/\u559c\u795e[:：]([^\s]+)/) || [])[1] || fallback.xishen || "";
  const fushen = (line.match(/\u798f\u795e[:：]([^\s]+)/) || [])[1] || fallback.fushen || "";
  const caishen = (line.match(/\u8d22\u795e[:：]([^\s]+)/) || [])[1] || fallback.caishen || "";

  return {
    ...fallback,
    xishen,
    fushen,
    caishen,
  };
}

function buildSummary(data) {
  return [
    data.dayType && `\u4eca\u65e5${data.dayType}`,
    data.dayValue && `\u503c\u795e${data.dayValue}`,
    data.dayOfficerType,
    data.conflict,
  ]
    .filter(Boolean)
    .join("\uff0c");
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT,
      accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

async function getRealtimeAlmanac(date) {
  const [year, month, day] = date.split("-").map((value) => String(Number(value)));
  const suanbuUrl = `https://lhl.suanbu.cn/${year}-${month}-${day}.html`;
  const qmrlUrl = `https://www.qmrl888.com/${year}-${month}-${day}.html`;

  const [suanbuHtml, qmrlHtml] = await Promise.all([fetchHtml(suanbuUrl), fetchHtml(qmrlUrl)]);
  const suanbu = parseSuanbu(htmlToLines(suanbuHtml));
  const qmrl = parseQmrl(htmlToLines(qmrlHtml));
  const positions = parsePositions(suanbu.positionsLine, qmrl.positions);

  return {
    date,
    lunarText: qmrl.lunarText || suanbu.lunarText,
    yi: qmrl.yi.length > 0 ? qmrl.yi : suanbu.yi,
    ji: qmrl.ji.length > 0 ? qmrl.ji : suanbu.ji,
    dayType: qmrl.dayType,
    dayValue: qmrl.dayValue,
    dayOfficerType: qmrl.dayOfficerType,
    dayOfficerText: qmrl.dayOfficerText,
    ganzhiYear: qmrl.ganzhiYear,
    ganzhiMonth: qmrl.ganzhiMonth,
    ganzhiDay: qmrl.ganzhiDay,
    conflict: qmrl.conflict || suanbu.conflict,
    positions,
    hours: suanbu.hours,
    summary: buildSummary({
      dayType: qmrl.dayType,
      dayValue: qmrl.dayValue,
      dayOfficerType: qmrl.dayOfficerType,
      conflict: qmrl.conflict || suanbu.conflict,
    }),
  };
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return json({ success: false, error: "date must be YYYY-MM-DD" }, 400);
    }

    try {
      const data = await getRealtimeAlmanac(date);
      return json({
        success: true,
        source: "qmrl888 + suanbu",
        data,
      });
    } catch (error) {
      return json(
        {
          success: false,
          error: error.message,
          stack: error.stack,
        },
        502
      );
    }
  },
};
