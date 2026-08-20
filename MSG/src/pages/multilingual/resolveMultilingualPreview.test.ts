import { describe, expect, it } from "vitest";
import type {
  LocalizedMessageContent,
  TranslationBatch,
  TranslationItem,
} from "../../domain/types";
import { resolveMultilingualPreview } from "./resolveMultilingualPreview";
import { createEmailHtmlAsset } from "../../domain/emailChannel";

const sourceContent: LocalizedMessageContent = {
  sourceLocale: "zh-CN",
  locales: ["zh-CN", "en-US"],
  web: {
    title: "源站内信",
    summary: "源摘要",
    body: "源正文",
    actionText: "查看详情",
    targetUrl: "forxfinance://security/devices",
  },
  push: {
    title: "源 Push",
    body: "源 Push 正文",
    imageUrl: "https://cdn.example.com/push.png",
    deepLink: "forxfinance://security/devices",
    platform: "全部设备",
    priority: "高",
  },
  email: {
    subject: "源 Email 标题",
    preheader: "源预览文字",
    headline: "源正文标题",
    body: "源 Email 正文",
    textBody: "源纯文本正文",
    actionText: "查看邮件详情",
    actionUrl: "https://www.forx.finance/messages/MSG-001",
  },
  emailConfig: {
    senderProfileId: "transaction",
    fromName: "ForX Finance 通知",
    replyMode: "no_reply",
    trackingEnabled: true,
    unsubscribeRequired: false,
  },
};

const baseItem: TranslationItem = {
  id: "MTI-PREVIEW",
  batchId: "MT-PREVIEW",
  templateId: "TPL-PREVIEW",
  templateName: "预览模板",
  sourceLocale: "zh-CN",
  targetLocale: "en-US",
  externalTaskId: "EXT-PREVIEW",
  attemptNo: 1,
  status: "翻译返回待审核",
  sourceContentHash: "sha256:preview",
  submittedAt: "刚刚",
  translatedAt: "刚刚",
  submitter: "Gary Ma",
  variablesValid: true,
};

const baseBatch: TranslationBatch = {
  id: "MT-PREVIEW",
  templateId: "TPL-PREVIEW",
  templateVersion: "v1",
  sourceLocale: "zh-CN",
  targetLocales: ["en-US"],
  status: "翻译返回待审核",
  createdBy: "Gary Ma",
  createdAt: "刚刚",
  updatedAt: "刚刚",
  items: [baseItem],
};

describe("resolveMultilingualPreview", () => {
  it("prefers approved channel output and preserves source metadata", () => {
    const batch = {
      ...baseBatch,
      channels: ["站内信", "Push"],
      sourceChannelContent: sourceContent,
    } as unknown as TranslationBatch;
    const item = {
      ...baseItem,
      machineChannelOutput: {
        web: { title: "Machine inbox", summary: "Machine summary", body: "Machine body" },
        push: { title: "Machine push", body: "Machine push body" },
      },
      humanChannelDraft: {
        web: { title: "Human inbox", summary: "Human summary", body: "Human body" },
        push: { title: "Human push", body: "Human push body" },
      },
      approvedChannelOutput: {
        web: { title: "Approved inbox", summary: "Approved summary", body: "Approved body" },
        push: { title: "Approved push", body: "Approved push body" },
      },
    } as unknown as TranslationItem;

    const result = resolveMultilingualPreview(batch, item);

    expect(result.channels).toEqual(["站内信", "Push"]);
    expect(result.content?.sourceLocale).toBe("en-US");
    expect(result.content?.web.title).toBe("Approved inbox");
    expect(result.content?.web.targetUrl).toBe(
      "forxfinance://security/devices",
    );
    expect(result.content?.push.title).toBe("Approved push");
    expect(result.content?.push.imageUrl).toBe(
      "https://cdn.example.com/push.png",
    );
    expect(result.content?.push.deepLink).toBe(
      "forxfinance://security/devices",
    );
  });

  it("resolves localized Email text and preserves links and sender config", () => {
    const batch = {
      ...baseBatch,
      channels: ["邮件"],
      sourceChannelContent: sourceContent,
    } as unknown as TranslationBatch;
    const item = {
      ...baseItem,
      machineChannelOutput: {
        email: {
          subject: "Withdrawal succeeded · en-US",
          headline: "Withdrawal completed",
          body: "Your withdrawal was completed.",
          textBody: "Your withdrawal was completed.",
        },
      },
    } as unknown as TranslationItem;

    const result = resolveMultilingualPreview(batch, item);

    expect(result.content?.email?.subject).toContain("en-US");
    expect(result.content?.email?.actionUrl).toBe(
      "https://www.forx.finance/messages/MSG-001",
    );
    expect(result.content?.emailConfig?.senderProfileId).toBe("transaction");
  });

  it("reuses a localized HTML asset while translating only subject and preheader", () => {
    const asset = createEmailHtmlAsset({
      locale: "en-US",
      fileName: "notice.en-US.html",
      fileSize: 640,
      html: "<!doctype html><html><head><title>Notice</title></head><body><p>English final HTML</p></body></html>",
      unsubscribeRequired: false,
      declaredVariables: [],
      uploadedBy: "Gary",
    });
    const htmlSource = {
      ...sourceContent,
      email: {
        ...sourceContent.email!,
        bodyMode: "html" as const,
        textBody: "",
        htmlAssets: { "en-US": asset },
      },
    };
    const batch = {
      ...baseBatch,
      channels: ["邮件"],
      sourceChannelContent: htmlSource,
    } as unknown as TranslationBatch;
    const item = {
      ...baseItem,
      approvedChannelOutput: {
        email: { subject: "Localized subject", preheader: "Localized preheader" },
      },
    } as unknown as TranslationItem;

    const result = resolveMultilingualPreview(batch, item);

    expect(result.content?.email?.bodyMode).toBe("html");
    expect(result.content?.email?.subject).toBe("Localized subject");
    expect(result.content?.email?.htmlAssets?.["en-US"]).toEqual(asset);
    expect(result.content?.email?.textBody).toBe("");
  });

  it("prefers the uploaded target-locale HTML asset over source-locale assets", () => {
    const sourceAsset = createEmailHtmlAsset({
      locale: "zh-CN",
      fileName: "notice.zh-CN.html",
      fileSize: 640,
      html: "<!doctype html><html><head><title>通知</title></head><body><p>中文源文件</p></body></html>",
      unsubscribeRequired: false,
      declaredVariables: [],
      uploadedBy: "Gary",
    });
    const targetAsset = createEmailHtmlAsset({
      locale: "ja-JP",
      fileName: "notice.ja-JP.html",
      fileSize: 660,
      html: "<!doctype html><html><head><title>通知</title></head><body><p>日本語完成稿</p></body></html>",
      unsubscribeRequired: false,
      declaredVariables: [],
      uploadedBy: "Gary",
    });
    const batch = {
      ...baseBatch,
      channels: ["邮件"],
      targetLocales: ["ja-JP"],
      sourceChannelContent: {
        ...sourceContent,
        email: {
          ...sourceContent.email!,
          bodyMode: "html",
          htmlAssets: { "zh-CN": sourceAsset },
          textBody: "",
        },
      },
    } as unknown as TranslationBatch;
    const item = {
      ...baseItem,
      targetLocale: "ja-JP",
      humanChannelDraft: {
        email: {
          subject: "日本語件名",
          preheader: "日本語プレビュー",
          bodyMode: "html",
          htmlAssets: { "ja-JP": targetAsset },
        },
      },
    } as unknown as TranslationItem;

    const result = resolveMultilingualPreview(batch, item);

    expect(result.content?.email?.htmlAssets).toEqual({ "ja-JP": targetAsset });
    expect(result.content?.email?.htmlAssets?.["zh-CN"]).toBeUndefined();
  });

  it("previews legacy returned content but leaves a missing result empty", () => {
    const legacyItem: TranslationItem = {
      ...baseItem,
      machineTitle: "Legacy title",
      machineSummary: "Legacy summary",
      machineBody: "Legacy body",
    };
    const returned = resolveMultilingualPreview(
      baseBatch,
      legacyItem,
      sourceContent,
      ["站内信"],
    );
    const missing = resolveMultilingualPreview(
      baseBatch,
      { ...legacyItem, status: "无结果" },
      sourceContent,
      ["站内信"],
    );

    expect(returned.channels).toEqual(["站内信"]);
    expect(returned.content?.web.title).toBe("Legacy title");
    expect(returned.content?.push.title).toBe("Legacy title");
    expect(missing.content).toBeUndefined();
  });
});
