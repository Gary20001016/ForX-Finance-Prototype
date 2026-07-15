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
  status: "待人工审核",
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
  it("derives approval ratio and special-language review stage", () => {
    const batch = batchWith([
      ["en-US", "已通过"],
      ["fr-FR", "已通过"],
      ["zh-TW", "待普通确认"],
      ["ja-JP", "待小语种专审"],
      ["tr-TR", "专审中"],
    ]);

    expect(deriveMultilingualProgress(batch)).toMatchObject({
      approved: 2,
      total: 5,
      percent: 40,
      stage: "小语种专审",
      blockingStatus: "待小语种专审",
    });
  });

  it("uses the highest-priority unfinished status and excludes canceled locales", () => {
    const batch = batchWith([
      ["en-US", "已通过"],
      ["ru-RU", "翻译失败"],
      ["ja-JP", "待小语种专审"],
      ["tr-TR", "专审中"],
      ["ko-KR", "已取消"],
    ]);

    expect(deriveMultilingualProgress(batch)).toMatchObject({
      approved: 1,
      total: 4,
      percent: 25,
      blockingStatus: "翻译失败",
    });
    expect(unfinishedLocales(batch)).toEqual([
      { locale: "ru-RU", status: "翻译失败" },
      { locale: "ja-JP", status: "待小语种专审" },
      { locale: "tr-TR", status: "专审中" },
    ]);
  });
});
