import { describe, expect, it } from "vitest";
import {
  MESSAGE_DISPLAY_CATEGORIES,
  formatDisplayLocation,
  getTopicDefaults,
  getTopicsForCategory,
} from "./messageDisplayTaxonomy";

describe("unified front-display taxonomy", () => {
  it("uses exactly the five front-display categories", () => {
    expect(MESSAGE_DISPLAY_CATEGORIES.map((item) => item.code)).toEqual([
      "announcement",
      "trade",
      "asset",
      "security_risk",
      "campaign_reward",
    ]);
    expect(MESSAGE_DISPLAY_CATEGORIES.map((item) => item.name)).toEqual([
      "公告",
      "交易",
      "资产",
      "安全与风控",
      "活动与奖励",
    ]);
  });

  it("keeps topics controlled under their parent category", () => {
    expect(getTopicsForCategory("announcement")).toHaveLength(4);
    expect(getTopicsForCategory("trade")).toHaveLength(3);
    expect(getTopicsForCategory("asset")).toHaveLength(4);
    expect(getTopicsForCategory("security_risk")).toHaveLength(3);
    expect(getTopicsForCategory("campaign_reward")).toHaveLength(4);
  });

  it("derives internal defaults and display location from the topic", () => {
    expect(
      getTopicDefaults("security_risk", "liquidation_warning"),
    ).toMatchObject({
      risk: "关键",
      nature: "事务",
    });
    expect(formatDisplayLocation("asset", "withdrawal")).toBe("资产 / 提现");
  });

  it("migrates legacy categories and risk labels into the unified model", async () => {
    const { normalizeDisplayLocation, normalizeRiskLevel } = await import(
      "./messageDisplayTaxonomy"
    );
    expect(
      normalizeDisplayLocation("提现到账", "资产通知", undefined),
    ).toMatchObject({ category: "asset", topic: "withdrawal" });
    expect(normalizeRiskLevel("普通")).toBe("低");
    expect(normalizeRiskLevel("重要")).toBe("高");
    expect(normalizeRiskLevel("紧急")).toBe("关键");
  });
});
