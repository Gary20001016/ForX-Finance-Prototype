import type {
  MessageCategory,
  MessageCategoryCode,
  MessageNature,
  MessageTopic,
  MessageTopicCode,
  RiskLevel,
} from "./types";

export const MESSAGE_RISK_LEVELS: RiskLevel[] = ["低", "中", "高", "关键"];

export const getRiskLevelsAtOrAbove = (risk: RiskLevel): RiskLevel[] => {
  const index = MESSAGE_RISK_LEVELS.indexOf(risk);
  return MESSAGE_RISK_LEVELS.slice(Math.max(index, 0));
};

export const getEffectiveRiskLevel = (
  templateRisk: RiskLevel,
  riskOverride?: RiskLevel,
): RiskLevel => {
  if (!riskOverride) return templateRisk;
  return MESSAGE_RISK_LEVELS.indexOf(riskOverride) >
    MESSAGE_RISK_LEVELS.indexOf(templateRisk)
    ? riskOverride
    : templateRisk;
};

const topic = (
  code: MessageTopicCode,
  name: string,
  order: number,
  defaultRisk: RiskLevel = "低",
  defaultNature: MessageNature = "事务",
): MessageTopic => ({
  code,
  name,
  order,
  defaultRisk,
  defaultNature,
  enabled: true,
});

export const MESSAGE_DISPLAY_CATEGORIES: MessageCategory[] = [
  {
    code: "announcement",
    name: "公告",
    color: "gray",
    defaultRisk: "低",
    defaultRetentionDays: 30,
    order: 1,
    enabled: true,
    topics: [
      topic("maintenance", "维护", 1, "低", "服务"),
      topic("listing", "上新", 2, "低", "服务"),
      topic("delisting", "下架", 3, "中", "服务"),
      topic("rule_update", "规则与更新", 4, "中", "服务"),
    ],
  },
  {
    code: "trade",
    name: "交易",
    color: "blue",
    defaultRisk: "低",
    defaultRetentionDays: 180,
    order: 2,
    enabled: true,
    topics: [
      topic("order_update", "订单", 1),
      topic("order_filled", "成交", 2),
      topic("contract_notice", "合约", 3, "中"),
    ],
  },
  {
    code: "asset",
    name: "资产",
    color: "green",
    defaultRisk: "低",
    defaultRetentionDays: 365,
    order: 3,
    enabled: true,
    topics: [
      topic("deposit", "充值", 1, "中"),
      topic("withdrawal", "提现", 2, "中"),
      topic("transfer", "划转", 3),
      topic("balance_change", "其他变动", 4),
    ],
  },
  {
    code: "security_risk",
    name: "安全与风控",
    color: "red",
    defaultRisk: "低",
    defaultRetentionDays: 365,
    order: 4,
    enabled: true,
    topics: [
      topic("account_security", "账户安全", 1, "中"),
      topic("abnormal_login", "登录与设备", 2, "高"),
      topic("liquidation_warning", "风险预警", 3, "关键"),
    ],
  },
  {
    code: "campaign_reward",
    name: "活动与奖励",
    color: "purple",
    defaultRisk: "低",
    defaultRetentionDays: 90,
    order: 5,
    enabled: true,
    topics: [
      topic("campaign", "活动", 1, "低", "营销"),
      topic("trial_fund", "体验金", 2),
      topic("campaign_reward", "奖励发放", 3),
      topic("commission", "返佣", 4),
    ],
  },
];

export const getDisplayCategory = (categoryCode: MessageCategoryCode) =>
  MESSAGE_DISPLAY_CATEGORIES.find((category) => category.code === categoryCode);

export const getTopicsForCategory = (categoryCode: MessageCategoryCode) =>
  getDisplayCategory(categoryCode)?.topics.filter((item) => item.enabled) || [];

export const getDisplayTopic = (
  categoryCode: MessageCategoryCode,
  topicCode: MessageTopicCode,
) =>
  getDisplayCategory(categoryCode)?.topics.find(
    (item) => item.code === topicCode,
  );

export const getTopicDefaults = (
  categoryCode: MessageCategoryCode,
  topicCode: MessageTopicCode,
) => {
  const selected = getDisplayTopic(categoryCode, topicCode);
  return selected
    ? { risk: selected.defaultRisk, nature: selected.defaultNature }
    : undefined;
};

export const formatDisplayLocation = (
  categoryCode: MessageCategoryCode,
  topicCode: MessageTopicCode,
) => {
  const category = getDisplayCategory(categoryCode);
  const selectedTopic = getDisplayTopic(categoryCode, topicCode);
  return `${category?.name || categoryCode} / ${selectedTopic?.name || topicCode}`;
};

export const getDefaultTopicCode = (categoryCode: MessageCategoryCode) =>
  getTopicsForCategory(categoryCode)[0]?.code;

export const normalizeRiskLevel = (
  value: unknown,
  fallback: RiskLevel = "低",
): RiskLevel => {
  if (MESSAGE_RISK_LEVELS.includes(value as RiskLevel)) return value as RiskLevel;
  if (value === "普通") return "低";
  if (value === "重要") return "高";
  if (value === "紧急") return "关键";
  return fallback;
};

export const inferDisplayLocation = (
  name: string,
  legacyCategory = "",
): {
  category: MessageCategoryCode;
  topic: MessageTopicCode;
  risk: RiskLevel;
  nature: MessageNature;
} => {
  const text = `${name}${legacyCategory}`;
  const match = (
    category: MessageCategoryCode,
    topicCode: MessageTopicCode,
  ) => ({
    category,
    topic: topicCode,
    risk: getTopicDefaults(category, topicCode)?.risk || "低",
    nature: getTopicDefaults(category, topicCode)?.nature || "事务",
  });
  if (
    text.includes("强平") ||
    text.includes("提现风险") ||
    text.includes("账户异常") ||
    text.includes("风险预警")
  )
    return match("security_risk", "liquidation_warning");
  if (
    text.includes("异常登录") ||
    text.includes("登录") ||
    text.includes("设备")
  )
    return match("security_risk", "abnormal_login");
  if (text.includes("账户安全") || text.includes("白名单"))
    return match("security_risk", "account_security");
  if (text.includes("充值")) return match("asset", "deposit");
  if (text.includes("提现")) return match("asset", "withdrawal");
  if (text.includes("划转")) return match("asset", "transfer");
  if (text.includes("资产变动") || text.includes("余额"))
    return match("asset", "balance_change");
  if (text.includes("成交")) return match("trade", "order_filled");
  if (text.includes("订单")) return match("trade", "order_update");
  if (text.includes("合约")) return match("trade", "contract_notice");
  if (text.includes("返佣")) return match("campaign_reward", "commission");
  if (text.includes("体验金")) return match("campaign_reward", "trial_fund");
  if (text.includes("积分") || text.includes("奖励"))
    return match("campaign_reward", "campaign_reward");
  if (text.includes("活动") || text.includes("交易赛"))
    return match("campaign_reward", "campaign");
  if (text.includes("下架")) return match("announcement", "delisting");
  if (text.includes("上线") || text.includes("上币"))
    return match("announcement", "listing");
  if (
    text.includes("规则") ||
    text.includes("更新") ||
    text.includes("调整")
  )
    return match("announcement", "rule_update");
  return match("announcement", "maintenance");
};

export const normalizeDisplayLocation = (
  name: string,
  categoryValue?: unknown,
  topicValue?: unknown,
) => {
  const inferred = inferDisplayLocation(
    name,
    typeof categoryValue === "string" ? categoryValue : "",
  );
  const category =
    typeof categoryValue === "string" &&
    getDisplayCategory(categoryValue as MessageCategoryCode)
      ? (categoryValue as MessageCategoryCode)
      : inferred.category;
  const topic =
    typeof topicValue === "string" &&
    getDisplayTopic(category, topicValue as MessageTopicCode)
      ? (topicValue as MessageTopicCode)
      : inferred.category === category
        ? inferred.topic
        : getDefaultTopicCode(category) || inferred.topic;
  const defaults = getTopicDefaults(category, topic);
  return {
    category,
    topic,
    risk: defaults?.risk || inferred.risk,
    nature: defaults?.nature || inferred.nature,
  };
};
