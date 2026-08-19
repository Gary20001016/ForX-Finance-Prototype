import { render, screen, within } from "@testing-library/react";
import MessagePreview from "./MessagePreview";

it("previews desktop, mobile and plain-text email output", () => {
  render(
    <MessagePreview
      channels={["邮件"]}
      content={{
        sourceLocale: "zh-CN",
        locales: ["zh-CN"],
        web: { title: "", summary: "", body: "" },
        push: { title: "", body: "", platform: "全部设备", priority: "普通" },
        email: {
          subject: "提现成功通知",
          headline: "提现已完成",
          body: "您的提现申请已处理完成。",
          textBody: "您的提现申请已处理完成。",
          actionText: "查看详情",
        },
        emailConfig: {
          emailType: "事务邮件",
          senderProfileId: "transaction",
          fromName: "ForX Finance 通知",
          trackingEnabled: true,
          unsubscribeRequired: false,
        },
      }}
    />,
  );

  expect(
    within(screen.getByLabelText("Email 桌面预览")).getByText("提现成功通知"),
  ).toBeVisible();
  expect(screen.getByLabelText("Email 移动预览")).toBeVisible();
  expect(screen.getByText("纯文本预览")).toBeVisible();
});
