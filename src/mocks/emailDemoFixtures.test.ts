import { describe, expect, it } from "vitest";
import { createEmailDemoFixtures } from "./emailDemoFixtures";

describe("email demo fixtures", () => {
  it("links representative Email content across every workflow surface", () => {
    const fixtures = createEmailDemoFixtures();
    const htmlTemplate = fixtures.templates.find(
      (item) => item.id === "TPL-EMAIL-DEMO-HTML",
    );
    const eventTemplate = fixtures.templates.find(
      (item) => item.id === "TPL-EMAIL-DEMO-EVENT",
    );

    expect(htmlTemplate).toMatchObject({
      name: "夏季 VIP 专属礼遇邮件",
      usageScope: "manual",
      channels: ["邮件"],
      status: "已发布",
    });
    expect(htmlTemplate?.content?.email).toMatchObject({
      bodyMode: "html",
      subject: "{{ user_nickname }}，您的夏季 VIP 专属礼遇已开启",
    });
    expect(Object.keys(htmlTemplate?.content?.email?.htmlAssets || {})).toEqual([
      "zh-CN",
      "en-US",
    ]);
    expect(
      Object.values(htmlTemplate?.content?.email?.htmlAssets || {}).every(
        (asset) =>
          asset.validationStatus === "passed" &&
          asset.contentReviewStatus === "approved",
      ),
    ).toBe(true);

    expect(eventTemplate).toMatchObject({
      name: "充值到账 Email 通知",
      usageScope: "event",
      eventId: "deposit.credited",
      channels: ["邮件"],
    });
    expect(eventTemplate?.content?.email).toMatchObject({
      bodyMode: "text",
      subject: "充值到账：{{ amount }} {{ currency }}",
    });

    expect(fixtures.tasks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "MSG-EMAIL-DEMO-MANUAL",
          name: "VIP 礼遇 Email 群发",
          triggerType: "manual",
          channels: ["邮件"],
          templateId: "TPL-EMAIL-DEMO-HTML",
        }),
        expect.objectContaining({
          id: "MSG-EMAIL-DEMO-EVENT",
          name: "充值到账 Email 事件任务",
          triggerType: "event",
          channels: ["邮件"],
          templateId: "TPL-EMAIL-DEMO-EVENT",
        }),
      ]),
    );
    expect(fixtures.approvals[0]).toMatchObject({
      id: "APR-EMAIL-DEMO-CONTENT",
      name: "Email 营销内容审核",
      channels: ["邮件"],
      templateId: "TPL-EMAIL-DEMO-HTML",
    });
    expect(fixtures.translationBatches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "MT-EMAIL-DEMO-TEXT",
          subjectName: "充值到账 Email 日语审核",
          channels: ["邮件"],
          templateId: "TPL-EMAIL-DEMO-EVENT",
        }),
      ]),
    );
    expect(fixtures.deliveries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "DEL-EMAIL-DEMO-OPENED",
          channel: "邮件",
          status: "已打开",
          messageStream: "broadcast",
        }),
        expect.objectContaining({
          id: "DEL-EMAIL-DEMO-BOUNCED",
          channel: "邮件",
          status: "已退信",
          bounceType: "hard",
        }),
      ]),
    );
  });
});
