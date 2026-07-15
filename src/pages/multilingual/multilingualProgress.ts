import type {
  TranslationBatch,
  TranslationItemStatus,
} from "../../domain/types";

export type MultilingualStage =
  | "生成机器翻译"
  | "普通语言确认"
  | "小语种专审"
  | "全部语言通过";

const approvedStatuses = new Set<TranslationItemStatus>(["已通过", "审核通过"]);
const ignoredStatuses = new Set<TranslationItemStatus>(["已取消"]);

const priority: TranslationItemStatus[] = [
  "翻译失败",
  "源文案已变更",
  "审核驳回",
  "待小语种专审",
  "专审中",
  "待普通确认",
  "待人工审核",
  "修改中",
  "翻译中",
  "排队中",
  "未提交",
  "已通过",
  "审核通过",
];

export const unfinishedLocales = (batch: TranslationBatch) =>
  batch.items
    .filter(
      (item) =>
        !approvedStatuses.has(item.status) && !ignoredStatuses.has(item.status),
    )
    .sort((left, right) => priority.indexOf(left.status) - priority.indexOf(right.status))
    .map((item) => ({ locale: item.targetLocale, status: item.status }));

export const deriveMultilingualProgress = (batch: TranslationBatch) => {
  const activeItems = batch.items.filter((item) => !ignoredStatuses.has(item.status));
  const approved = activeItems.filter((item) => approvedStatuses.has(item.status)).length;
  const total = activeItems.length;
  const unfinished = unfinishedLocales(batch);
  const blockingStatus = unfinished[0]?.status;
  let stage: MultilingualStage = "生成机器翻译";

  if (total > 0 && approved === total) stage = "全部语言通过";
  else if (
    activeItems.some(
      (item) => item.status === "待小语种专审" || item.status === "专审中",
    )
  )
    stage = "小语种专审";
  else if (
    activeItems.some((item) =>
      ["待普通确认", "待人工审核", "修改中", "审核驳回"].includes(item.status),
    )
  )
    stage = "普通语言确认";

  return {
    approved,
    total,
    percent: total ? Math.round((approved / total) * 100) : 0,
    stage,
    blockingStatus,
  };
};
