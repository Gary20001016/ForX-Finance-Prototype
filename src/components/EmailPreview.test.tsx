import { render, screen, within } from "@testing-library/react";
import { createEmailHtmlAsset } from "../domain/emailChannel";
import MessagePreview from "./MessagePreview";

it("previews only the active plain-text email body", () => {
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
          bodyMode: "text",
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
    within(screen.getByLabelText("Email 纯文本预览")).getByText("提现成功通知"),
  ).toBeVisible();
  expect(screen.queryByLabelText("Email 桌面预览")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Email 移动预览")).not.toBeInTheDocument();
});

it("previews the localized HTML asset in a sandboxed frame", () => {
  const asset = createEmailHtmlAsset({
    locale: "zh-CN",
    fileName: "withdrawal.zh-CN.html",
    fileSize: 512,
    html: "<!doctype html><html><head><title>邮件</title></head><body><p>提现已完成</p></body></html>",
    emailType: "事务邮件",
    declaredVariables: [],
    uploadedBy: "Gary",
  });
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
          bodyMode: "html",
          htmlAssets: { "zh-CN": asset },
          headline: "",
          body: "",
          textBody: "",
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

  const frame = screen.getByTitle("zh-CN HTML 邮件预览");
  expect(frame).toHaveAttribute("sandbox", "");
  expect(frame).toHaveAttribute("srcdoc", expect.stringContaining("提现已完成"));
  expect(screen.getByText("兼容性纯文本")).toBeVisible();
  expect(screen.queryByText("多语言审核")).not.toBeInTheDocument();
});
