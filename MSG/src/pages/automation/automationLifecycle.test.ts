import { describe, expect, it } from "vitest";
import {
  getEventRuleOperations,
  nextEventRuleStatus,
  nextRuleVersionStatus,
  ruleEventIdempotencyKey,
} from "./automationLifecycle";

describe("event automation lifecycle", () => {
  it("keeps long-lived rule operations separate from trigger outcomes", () => {
    expect(getEventRuleOperations("已启用")).toEqual([
      "查看详情",
      "创建内容版本",
      "停用规则",
    ]);
    expect(getEventRuleOperations("已停用")).toEqual([
      "查看详情",
      "编辑规则",
      "启用规则",
      "取消规则",
    ]);
    expect(nextEventRuleStatus("已启用", "停用规则")).toBe("已停用");
    expect(nextEventRuleStatus("已停用", "启用规则")).toBe("已启用");
  });

  it("moves a content version through translation and approval without changing the rule", () => {
    expect(nextRuleVersionStatus("草稿", "提交机翻")).toBe("机翻处理中");
    expect(nextRuleVersionStatus("机翻处理中", "机翻完成")).toBe(
      "待人工审核",
    );
    expect(nextRuleVersionStatus("待人工审核", "人工审核通过")).toBe(
      "待审核",
    );
    expect(nextRuleVersionStatus("待审核", "通过审核")).toBe("待生效");
  });

  it("does not include content version in the event idempotency key", () => {
    expect(ruleEventIdempotencyKey("RULE-001", "EVT-9988")).toBe(
      "RULE-001:EVT-9988",
    );
  });
});
