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

  it("keeps translation state in the translation batch and only models business approval here", () => {
    expect(nextRuleVersionStatus("待审核", "通过审核")).toBe("待生效");
  });

  it("does not include content version in the event idempotency key", () => {
    expect(ruleEventIdempotencyKey("RULE-001", "EVT-9988")).toBe(
      "RULE-001:EVT-9988",
    );
  });
});
