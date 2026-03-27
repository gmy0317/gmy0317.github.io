const ZODIAC_CONFIG = {
  sheep: {
    label: "属羊",
    bias: 0,
    goodText: "适合主动沟通、推进待办与处理会面事务，顺势发力会更有效。",
    neutralText: "适合先整理思路，再推进要事，避免一开始就把节奏拉太满。",
    badText: "更适合稳住情绪与节奏，重要决定先多确认一次，不宜抢快。",
    suffixes: [
      "财务和口头承诺要留痕，别只凭当下感觉。",
      "与熟人沟通时语气放柔一点，更容易把事情谈顺。",
      "下午之后做收尾和复盘，比临时起意开新事项更稳。",
    ],
  },
  snake: {
    label: "属蛇",
    bias: 1,
    goodText: "今天判断力相对在线，适合处理需要拿主意的事务，也适合推进沟通节点。",
    neutralText: "适合观察形势后再出手，先把信息摸清楚，比急着表态更稳。",
    badText: "今天要防止想太多又改太快，别在细节里来回折返，先定主线。",
    suffixes: [
      "工作上宜先抓重点，不必一开始就把所有细节铺满。",
      "面对临时变化时，先确认边界，再决定是否接手。",
      "晚上更适合静下来整理，而不是继续加码新任务。",
    ],
  },
  rabbit: {
    label: "属兔",
    bias: -1,
    goodText: "今天人际和缓，适合会面、协商、处理关系型事务，柔和推进反而更有效。",
    neutralText: "适合按节奏稳步推进，尤其适合清理积压事项和优化日常安排。",
    badText: "今天要避免被外界节奏带跑，先管住分心和犹豫，再谈效率。",
    suffixes: [
      "出门与会面前把时间点确认好，可减少来回变动。",
      "消费与送礼相关的决定宜克制一点，避免临时加码。",
      "今天适合把居家、整理、复盘类事务做扎实。",
    ],
  },
};

function toLevel(status) {
  if (status === "good") return "可主动";
  if (status === "bad") return "忌急躁";
  return "宜稳";
}

function pickStatus(goodCount, badCount, bias, dateSeed) {
  const score = goodCount * 2 - badCount + bias + (dateSeed % 5);

  if (score >= 7) {
    return "good";
  }

  if (score <= 3) {
    return "bad";
  }

  return "neutral";
}

function buildAdvice(config, status, seed) {
  let body = config.neutralText;

  if (status === "good") {
    body = config.goodText;
  } else if (status === "bad") {
    body = config.badText;
  }

  return `${body} ${config.suffixes[seed % config.suffixes.length]}`;
}

function createAdviceForAnimal(config, dateSeed, goodCount, badCount) {
  const status = pickStatus(goodCount, badCount, config.bias, dateSeed);
  const seed = dateSeed + config.bias + goodCount;

  return {
    animalKey: config.label.replace("属", ""),
    name: config.label,
    status,
    level: toLevel(status),
    advice: buildAdvice(config, status, seed),
  };
}

export function createZodiacAdvice(dateContext, fortuneProfile) {
  const seed = Number(dateContext.isoDate.replaceAll("-", ""));
  const goodCount = fortuneProfile.hourFortunes.filter((item) => item.status === "good").length;
  const badCount = fortuneProfile.hourFortunes.filter((item) => item.status === "bad").length;
  return Object.values(ZODIAC_CONFIG).map((config) =>
    createAdviceForAnimal(config, seed, goodCount, badCount)
  );
}
