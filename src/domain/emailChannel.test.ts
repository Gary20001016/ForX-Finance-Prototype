import { describe, expect, it } from "vitest";
import {
  ACTIVE_MESSAGE_CHANNELS,
  createDefaultEmailConfig,
  createDefaultEmailContent,
  validateEmailContent,
} from "./emailChannel";

describe("Email channel policy", () => {
  it("enables exactly inbox, push and email", () => {
    expect(ACTIVE_MESSAGE_CHANNELS).toEqual(["站内信", "Push", "邮件"]);
  });

  it("requires unsubscribe copy only for marketing email", () => {
    const transactional = createDefaultEmailContent();
    transactional.subject = "到账通知";
    transactional.headline = "充值已到账";
    transactional.body = "您的资产已更新";
    transactional.textBody = "您的资产已更新";
    expect(
      validateEmailContent(transactional, createDefaultEmailConfig()).valid,
    ).toBe(true);

    const marketing = createDefaultEmailContent("营销邮件");
    marketing.subject = "活动通知";
    marketing.headline = "限时活动";
    marketing.body = "立即参加";
    marketing.textBody = "立即参加";
    marketing.unsubscribeText = "";
    expect(
      validateEmailContent(marketing, createDefaultEmailConfig("营销邮件"))
        .valid,
    ).toBe(false);
  });
});
