import { describe, expect, it } from "vitest";
import type {
  LocalizedMessageContent,
  TranslationBatch,
  TranslationItem,
} from "../../domain/types";
import { resolveMultilingualPreview } from "./resolveMultilingualPreview";

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
