import { describe, expect, it } from "vitest";
import {
  calculateTaskAudienceEstimate,
  EMAIL_UNIT_COST_CNY,
  formatTaskEstimatedCost,
} from "./taskEstimate";

describe("task estimate", () => {
  it("calculates the compliance-filtered send count", () => {
    expect(calculateTaskAudienceEstimate(300_000)).toEqual({
      filteredCount: 14_100,
      finalSendCount: 285_900,
    });
  });

  it("calculates an Email-only estimate from the final send count", () => {
    expect(EMAIL_UNIT_COST_CNY).toBe(0.004);
    expect(formatTaskEstimatedCost(["邮件"], 300_000)).toBe(
      "Email 预计 ¥1,143.6（285,900 封 × ¥0.004）",
    );
  });

  it("shows only selected channels and preserves their order", () => {
    expect(
      formatTaskEstimatedCost(["站内信", "邮件", "Push"], 300_000),
    ).toBe(
      "站内信 ¥0 · Email 预计 ¥1,143.6（285,900 封 × ¥0.004） · Push ¥0",
    );
  });

  it("never produces a negative billable audience", () => {
    expect(calculateTaskAudienceEstimate(-10)).toEqual({
      filteredCount: 0,
      finalSendCount: 0,
    });
    expect(formatTaskEstimatedCost(["邮件"], -10)).toBe(
      "Email 预计 ¥0（0 封 × ¥0.004）",
    );
  });
});
