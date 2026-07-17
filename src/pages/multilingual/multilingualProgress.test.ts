import { describe, expect, it } from "vitest";
import type { TranslationBatch, TranslationItemStatus } from "../../domain/types";
import {
  deriveMultilingualProgress,
  unfinishedLocales,
} from "./multilingualProgress";

const batchWith = (statuses: Array<[string, TranslationItemStatus]>): TranslationBatch => ({
  id: "MT-TEST",
  subjectType: "manual_task_content",
  subjectId: "TASK-001",
  subjectName: "临时风险消息",
  contentVersion: "draft-1",
  returnPath: "/tasks/create",
  templateId: "TEMP-001",
  templateVersion: "draft-1",
  sourceLocale: "zh-CN",
  targetLocales: statuses.map(([locale]) => locale),
  status: statuses.some(([, status]) => status === "无结果")
    ? "无结果"
    : statuses.every(([, status]) => status === "已通过")
      ? "已通过"
      : "翻译返回待审核",
  createdBy: "operator-01",
  createdAt: "刚刚",
  updatedAt: "刚刚",
  items: statuses.map(([locale, status], index) => ({
    id: `MTI-${index}`,
    batchId: "MT-TEST",
    templateId: "TEMP-001",
    templateName: "临时风险消息",
    subjectType: "manual_task_content",
    subjectId: "TASK-001",
    subjectName: "临时风险消息",
    sourceLocale: "zh-CN",
    targetLocale: locale,
    externalTaskId: `EXT-${index}`,
    attemptNo: 1,
    status,
    sourceContentHash: "sha256:test",
    submittedAt: "刚刚",
    submitter: "operator-01",
    variablesValid: true,
    specialReviewRequired: locale === "ja-JP" || locale === "tr-TR",
  })),
});

describe("multilingual progress", () => {
  it("derives the single aggregate status and separates missing results from pending review", () => {
    const batch = batchWith([
      ["en-US", "已通过"],
      ["fr-FR", "已通过"],
      ["zh-TW", "翻译返回待审核"],
      ["ja-JP", "翻译返回待审核"],
      ["tr-TR", "无结果"],
    ]);

    expect(deriveMultilingualProgress(batch)).toMatchObject({
      approved: 2,
      total: 5,
      percent: 40,
      status: "无结果",
      missingResultLocales: ["tr-TR"],
      pendingReviewLocales: ["zh-TW", "ja-JP"],
    });
  });

  it("uses returned-for-review when every language has a translation result", () => {
    const batch = batchWith([
      ["en-US", "已通过"],
      ["ru-RU", "翻译返回待审核"],
      ["ja-JP", "翻译返回待审核"],
    ]);

    expect(deriveMultilingualProgress(batch)).toMatchObject({
      approved: 1,
      total: 3,
      percent: 33,
      status: "翻译返回待审核",
    });
    expect(unfinishedLocales(batch)).toEqual([
      { locale: "ru-RU", status: "翻译返回待审核" },
      { locale: "ja-JP", status: "翻译返回待审核" },
    ]);
  });
});
