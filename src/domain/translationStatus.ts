import type {
  TranslationBatchStatus,
  TranslationItem,
  TranslationItemStatus,
} from "./types";

const approvedLegacyStatuses = new Set([
  "已通过",
  "审核通过",
  "全部审核通过",
]);

const returnedLegacyStatuses = new Set([
  "翻译返回待审核",
  "待普通确认",
  "修改中",
  "待小语种专审",
  "专审中",
  "待人工审核",
  "审核驳回",
  "审核被驳回",
]);

export const normalizeTranslationStatus = (
  status: string,
): TranslationItemStatus => {
  if (approvedLegacyStatuses.has(status)) return "已通过";
  if (returnedLegacyStatuses.has(status)) return "翻译返回待审核";
  return "无结果";
};

export const deriveTranslationBatchStatus = (
  items: Array<Pick<TranslationItem, "status">>,
): TranslationBatchStatus => {
  if (items.length === 0) return "无结果";
  if (items.some((item) => item.status === "无结果")) return "无结果";
  if (items.every((item) => item.status === "已通过")) return "已通过";
  return "翻译返回待审核";
};

export const hasTranslationResult = (status: TranslationItemStatus) =>
  status !== "无结果";

export const isTranslationApproved = (status: TranslationItemStatus) =>
  status === "已通过";
