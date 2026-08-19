import { describe, expect, it } from "vitest";
import {
  ACTIVE_MESSAGE_CHANNELS,
  createEmailHtmlAsset,
  createDefaultEmailConfig,
  createDefaultEmailContent,
  getEmailVariableSourceText,
  getEmailBodyMode,
  validateEmailHtml,
  validateEmailContent,
} from "./emailChannel";

const localizedHtml = (copy = "您的充值已到账") => `<!doctype html>
<html><head><meta charset="utf-8"><title>ForX Finance</title></head>
<body><table><tr><td><p>${copy}</p><p>{{ user_nickname }}</p></td></tr></table></body></html>`;

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

  it("defaults new and legacy email content to the plain-text body mode", () => {
    expect(createDefaultEmailContent().bodyMode).toBe("text");
    expect(getEmailBodyMode({
      subject: "旧模板",
      headline: "旧正文",
      body: "旧内容",
      textBody: "兼容正文",
    })).toBe("text");
  });

  it("validates only the active plain-text body", () => {
    const content = createDefaultEmailContent();
    content.subject = "到账通知";
    content.textBody = "您的充值已到账";

    expect(validateEmailContent(content, createDefaultEmailConfig()).valid).toBe(true);
    content.textBody = "";
    expect(validateEmailContent(content, createDefaultEmailConfig()).errors).toContain(
      "请填写邮件纯文本正文",
    );
  });

  it("blocks unsafe HTML before it can enter content review", () => {
    const result = validateEmailHtml(
      '<!doctype html><html><head></head><body><script>alert(1)</script><a href="javascript:alert(1)">查看</a></body></html>',
      { emailType: "事务邮件", declaredVariables: [] },
    );

    expect(result.status).toBe("blocked");
    expect(result.issues.some((item) => item.message.includes("script"))).toBe(true);
    expect(result.issues.some((item) => item.message.includes("JavaScript"))).toBe(true);
    expect(result.sanitizedHtml).not.toContain("<script");
  });

  it("creates a localized HTML asset with fallback text and pending content review", () => {
    const asset = createEmailHtmlAsset({
      locale: "zh-CN",
      fileName: "deposit.zh-CN.html",
      fileSize: 1024,
      html: localizedHtml(),
      emailType: "事务邮件",
      declaredVariables: ["user_nickname"],
      uploadedBy: "Gary",
      uploadedAt: "2026-08-19 17:20",
    });

    expect(asset.validationStatus).toBe("passed");
    expect(asset.contentReviewStatus).toBe("pending");
    expect(asset.generatedText).toContain("您的充值已到账");
    expect(asset.sha256).toHaveLength(16);
  });

  it("requires one validated HTML asset for every enabled locale", () => {
    const content = createDefaultEmailContent();
    content.subject = "到账通知";
    content.bodyMode = "html";
    content.textBody = "";
    content.htmlAssets = {
      "zh-CN": createEmailHtmlAsset({
        locale: "zh-CN",
        fileName: "deposit.zh-CN.html",
        fileSize: 1024,
        html: localizedHtml(),
        emailType: "事务邮件",
        declaredVariables: ["user_nickname"],
        uploadedBy: "Gary",
      }),
    };

    const result = validateEmailContent(
      content,
      createDefaultEmailConfig(),
      ["zh-CN", "en-US"],
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("请上传 en-US 的 HTML 文件");
    expect(result.errors).not.toContain("请填写邮件纯文本正文");
  });

  it("extracts variables only from the active email body mode", () => {
    const content = createDefaultEmailContent();
    content.subject = "{{ user_nickname }} 的通知";
    content.textBody = "金额 {{ amount }}";
    content.body = "停用内容 {{ legacy_variable }}";
    expect(getEmailVariableSourceText(content)).toContain("{{ amount }}");
    expect(getEmailVariableSourceText(content)).not.toContain("legacy_variable");

    content.bodyMode = "html";
    content.htmlAssets = {
      "zh-CN": createEmailHtmlAsset({
        locale: "zh-CN",
        fileName: "notice.html",
        fileSize: 512,
        html: localizedHtml("金额 {{ currency }}"),
        emailType: "事务邮件",
        declaredVariables: ["user_nickname", "currency"],
        uploadedBy: "Gary",
      }),
    };
    const htmlText = getEmailVariableSourceText(content);
    expect(htmlText).toContain("{{ currency }}");
    expect(htmlText).not.toContain("{{ amount }}");
  });
});
