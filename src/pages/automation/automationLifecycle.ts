import type {
  EventRuleOperation,
  EventRuleStatus,
  RuleContentVersionOperation,
  RuleContentVersionStatus,
} from "../../domain/types";

const operations: Record<EventRuleStatus, EventRuleOperation[]> = {
  草稿: ["查看详情", "编辑规则", "提交审核", "取消规则"],
  待审核: ["查看详情", "撤回审核", "取消规则"],
  待修改: ["查看详情", "编辑规则", "提交审核", "取消规则"],
  已启用: ["查看详情", "创建内容版本", "停用规则"],
  已停用: ["查看详情", "编辑规则", "启用规则", "取消规则"],
  已取消: ["查看详情"],
  已过期: ["查看详情"],
};

const ruleTransitions: Partial<
  Record<EventRuleStatus, Partial<Record<EventRuleOperation, EventRuleStatus>>>
> = {
  草稿: { 提交审核: "待审核", 取消规则: "已取消" },
  待审核: { 撤回审核: "草稿", 取消规则: "已取消" },
  待修改: { 提交审核: "待审核", 取消规则: "已取消" },
  已启用: { 停用规则: "已停用" },
  已停用: {
    编辑规则: "草稿",
    启用规则: "已启用",
    取消规则: "已取消",
  },
};

const versionTransitions: Partial<
  Record<
    RuleContentVersionStatus,
    Partial<Record<RuleContentVersionOperation, RuleContentVersionStatus>>
  >
> = {
  草稿: { 取消版本: "已取消" },
  待审核: { 通过审核: "待生效", 取消版本: "已取消" },
  待生效: { 取消版本: "已取消" },
};

export const getEventRuleOperations = (status: EventRuleStatus) =>
  operations[status];

export const nextEventRuleStatus = (
  status: EventRuleStatus,
  operation: EventRuleOperation,
) => ruleTransitions[status]?.[operation] || status;

export const nextRuleVersionStatus = (
  status: RuleContentVersionStatus,
  operation: RuleContentVersionOperation,
) => versionTransitions[status]?.[operation] || status;

export const ruleEventIdempotencyKey = (
  ruleId: string,
  eventInstanceId: string,
) => `${ruleId}:${eventInstanceId}`;
