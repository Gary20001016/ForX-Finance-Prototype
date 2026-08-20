import type { Channel } from "./types";

export const COMPLIANCE_FILTER_RATE = 0.047;
export const EMAIL_UNIT_COST_CNY = 0.004;

const numberFormatter = new Intl.NumberFormat("zh-CN", {
  maximumFractionDigits: 2,
});

export function calculateTaskAudienceEstimate(audienceCount: number) {
  const normalizedCount = Math.max(0, Math.round(audienceCount));
  const filteredCount = Math.round(
    normalizedCount * COMPLIANCE_FILTER_RATE,
  );
  return {
    filteredCount,
    finalSendCount: Math.max(0, normalizedCount - filteredCount),
  };
}

export function formatTaskEstimatedCost(
  channels: Channel[],
  audienceCount: number,
): string {
  const { finalSendCount } = calculateTaskAudienceEstimate(audienceCount);
  return channels
    .map((channel) => {
      if (channel === "站内信") return "站内信 ¥0";
      if (channel === "Push") return "Push ¥0";
      if (channel === "邮件") {
        const cost = finalSendCount * EMAIL_UNIT_COST_CNY;
        return `Email 预计 ¥${numberFormatter.format(cost)}（${finalSendCount.toLocaleString("zh-CN")} 封 × ¥${EMAIL_UNIT_COST_CNY.toFixed(3)}）`;
      }
      return `${channel} 按量计费`;
    })
    .join(" · ");
}
