import type { ControlledTemplateVariable } from "./types";

export interface EventVariableDefinition {
  name: string;
  description: string;
  example: string;
}

const canonicalDefinitions: Record<string, Omit<EventVariableDefinition, "name">> = {
  user_nickname: {
    description: "接收事件通知的用户昵称",
    example: "Gary",
  },
  amount: { description: "事件对应的金额", example: "1,000.00" },
  currency: { description: "金额对应的币种", example: "USDT" },
  network: { description: "事件涉及的区块链网络", example: "TRON" },
  occurred_at: {
    description: "事件实际发生时间",
    example: "2026-07-22 18:06:31 UTC+8",
  },
  fee: { description: "事件产生的手续费", example: "1.00 USDT" },
  actual_amount: { description: "扣除手续费后的实际金额", example: "999.00 USDT" },
  masked_address: {
    description: "脱敏后的链上地址",
    example: "TXa8...9Kp2",
  },
  failure_reason: { description: "事件失败原因", example: "链上拥堵" },
  refund_status: { description: "失败资金的退回状态", example: "已退回" },
  refund_amount: { description: "失败后退回的金额", example: "1,000.00 USDT" },
  product_type: { description: "交易产品类型", example: "永续合约" },
  symbol: { description: "事件涉及的交易对", example: "BTC/USDT" },
  side: { description: "交易方向", example: "买入" },
  order_type: { description: "订单类型", example: "限价单" },
  filled_price: { description: "订单成交均价", example: "67,500.00" },
  filled_quantity: { description: "订单成交数量", example: "0.10 BTC" },
  filled_value: { description: "订单成交额", example: "6,750.00 USDT" },
  fee_currency: { description: "手续费币种", example: "USDT" },
  position_side: { description: "持仓方向", example: "多仓" },
  position_quantity: { description: "当前持仓数量", example: "0.50 BTC" },
  leverage: { description: "当前持仓杠杆倍数", example: "20x" },
  mark_price: { description: "触发事件时的标记价格", example: "65,200.00" },
  liquidation_price: { description: "预估强平价格", example: "64,800.00" },
  liquidation_distance: { description: "距离强平价格的幅度", example: "0.61%" },
  margin_ratio: { description: "当前保证金率", example: "8.20%" },
  warning_level: { description: "风险预警等级", example: "高" },
  trial_fund_type: { description: "体验金类型", example: "合约体验金" },
  activity_name: { description: "体验金所属活动", example: "新客体验活动" },
  usage_scope: { description: "资产可使用的业务范围", example: "USDT 永续合约" },
  usage_rule: { description: "资产的主要使用规则", example: "仅可抵扣交易亏损" },
  expires_at: { description: "权益或资产的失效时间", example: "2026-08-22 23:59:59 UTC+8" },
  points: { description: "本次到账积分数量", example: "500" },
  points_type: { description: "积分类型", example: "平台积分" },
  points_source: { description: "积分到账来源", example: "交易任务奖励" },
  points_balance: { description: "到账后的积分余额", example: "2,350" },
  commission_type: { description: "返佣类型", example: "邀请返佣" },
  commission_source: { description: "返佣来源", example: "下级用户交易" },
  settlement_period: { description: "返佣结算周期", example: "2026-07-21" },
  commission_balance: { description: "返佣到账后的余额", example: "245.80 USDT" },
  masked_related_user: { description: "脱敏后的关联用户标识", example: "UID 12****89" },
};

const eventVariableNames: Record<string, string[]> = {
  "deposit.credited": [
    "user_nickname",
    "amount",
    "currency",
    "network",
    "occurred_at",
  ],
  "withdrawal.succeeded": [
    "user_nickname",
    "amount",
    "fee",
    "actual_amount",
    "currency",
    "network",
    "masked_address",
    "occurred_at",
  ],
  "withdrawal.failed": [
    "user_nickname",
    "amount",
    "currency",
    "network",
    "masked_address",
    "failure_reason",
    "refund_status",
    "refund_amount",
    "occurred_at",
  ],
  "order.filled": [
    "user_nickname",
    "product_type",
    "symbol",
    "side",
    "order_type",
    "filled_price",
    "filled_quantity",
    "filled_value",
    "fee",
    "fee_currency",
    "occurred_at",
  ],
  "liquidation.warning": [
    "user_nickname",
    "symbol",
    "position_side",
    "position_quantity",
    "leverage",
    "mark_price",
    "liquidation_price",
    "liquidation_distance",
    "margin_ratio",
    "warning_level",
    "occurred_at",
  ],
  "trial_fund.credited": [
    "user_nickname",
    "amount",
    "currency",
    "trial_fund_type",
    "activity_name",
    "usage_scope",
    "usage_rule",
    "occurred_at",
    "expires_at",
  ],
  "points.credited": [
    "user_nickname",
    "points",
    "points_type",
    "points_source",
    "points_balance",
    "occurred_at",
    "expires_at",
  ],
  "commission.credited": [
    "user_nickname",
    "amount",
    "currency",
    "commission_type",
    "commission_source",
    "settlement_period",
    "commission_balance",
    "masked_related_user",
    "occurred_at",
  ],
};

const eventOverrides: Record<
  string,
  Partial<Record<string, Partial<Omit<EventVariableDefinition, "name">>>>
> = {
  "deposit.credited": {
    amount: { description: "本次实际到账金额" },
    currency: { description: "充值到账币种" },
    network: { description: "充值使用的区块链网络" },
  },
  "withdrawal.succeeded": {
    amount: { description: "用户申请提现金额" },
    currency: { description: "提现币种" },
    network: { description: "提现使用的区块链网络" },
  },
  "withdrawal.failed": {
    amount: { description: "失败的提现申请金额" },
    currency: { description: "提现币种" },
    network: { description: "提现使用的区块链网络" },
  },
  "trial_fund.credited": {
    amount: { description: "本次到账的体验金金额" },
    currency: { description: "体验金计价币种" },
  },
  "commission.credited": {
    amount: { description: "本次返佣到账金额" },
    currency: { description: "返佣计价币种" },
  },
};

const definitionFor = (
  name: string,
  override?: Partial<Omit<EventVariableDefinition, "name">>,
): EventVariableDefinition => {
  const canonical = canonicalDefinitions[name] || {
    description: "由事件注册中心同步的消息变量",
    example: "—",
  };
  return { name, ...canonical, ...override };
};

export const getEventVariableDefinitions = (
  eventId: string,
  fallbackNames: string[] = [],
): EventVariableDefinition[] => {
  const names = fallbackNames.length ? fallbackNames : eventVariableNames[eventId] || [];
  return names.map((name) =>
    definitionFor(name, eventOverrides[eventId]?.[name]),
  );
};

export const getEventVariableNames = (eventId: string): string[] =>
  [...(eventVariableNames[eventId] || [])];

export const getEventTemplateVariables = (
  names: string[] = Object.keys(canonicalDefinitions),
): ControlledTemplateVariable[] =>
  names.map((name) => {
    const definition = definitionFor(name);
    return {
      id: `EVENT-VAR-${name}`,
      name,
      description: definition.description,
      status: "启用",
      updatedAt: "2026-07-22 18:00",
      updatedBy: "事件注册中心",
    };
  });
