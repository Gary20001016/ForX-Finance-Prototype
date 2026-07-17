import type { TranslationBatch } from "../../domain/types";
import { deriveTranslationBatchStatus } from "../../domain/translationStatus";

export const unfinishedLocales = (batch: TranslationBatch) =>
  batch.items
    .filter((item) => item.status !== "已通过")
    .sort((left, right) => {
      if (left.status === right.status) return 0;
      return left.status === "无结果" ? -1 : 1;
    })
    .map((item) => ({ locale: item.targetLocale, status: item.status }));

export const deriveMultilingualProgress = (batch: TranslationBatch) => {
  const activeItems = batch.items.filter(
    (item) => String(item.status) !== "已取消",
  );
  const approved = activeItems.filter((item) => item.status === "已通过").length;
  const total = activeItems.length;

  return {
    approved,
    total,
    percent: total ? Math.round((approved / total) * 100) : 0,
    status: deriveTranslationBatchStatus(activeItems),
    missingResultLocales: activeItems
      .filter((item) => item.status === "无结果")
      .map((item) => item.targetLocale),
    pendingReviewLocales: activeItems
      .filter((item) => item.status === "翻译返回待审核")
      .map((item) => item.targetLocale),
  };
};
