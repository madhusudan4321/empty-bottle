const parseNumber = (val, defaultVal) => {
  if (val === undefined || val === null || val === "") return defaultVal;
  const num = Number(val);
  return isNaN(num) ? defaultVal : num;
};

const crowdConfig = {
  lowMaxPercent: parseNumber(process.env.CROWD_LOW_MAX, 40),
  moderateMaxPercent: parseNumber(process.env.CROWD_MODERATE_MAX, 80),
  presenceTtlSeconds: parseNumber(process.env.PRESENCE_TTL_SECONDS, 300),
};

module.exports = crowdConfig;
