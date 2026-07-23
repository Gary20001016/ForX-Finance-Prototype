import type { ReviewOperator } from "./reviewOperators";
import type { TranslationItem } from "./types";

export interface TranslationReviewAssignment {
  assigneeId: string;
  assignee: string;
}

export const eligibleTranslationReviewers = (
  item: TranslationItem,
  operators: ReviewOperator[],
) => {
  const authorized = new Set(item.authorizedReviewerIds || []);
  return operators.filter(
    (operator) => operator.enabled && authorized.has(operator.id),
  );
};

export const assignTranslationReviewer = (
  item: TranslationItem,
  operators: ReviewOperator[],
  random: () => number = Math.random,
): TranslationReviewAssignment => {
  const eligible = eligibleTranslationReviewers(item, operators);
  if (!eligible.length) {
    throw new Error(`${item.targetLocale} 暂无可用审核人，请先配置语言审核权限`);
  }
  const index = Math.min(
    eligible.length - 1,
    Math.floor(Math.max(0, random()) * eligible.length),
  );
  const reviewer = eligible[index];
  return { assigneeId: reviewer.id, assignee: reviewer.name };
};

export const canOperateAssignedTranslation = (
  item: TranslationItem,
  operator: ReviewOperator | undefined,
) =>
  Boolean(
    operator &&
      item.specialReviewRequired &&
      item.status === "翻译返回待审核" &&
      item.assigneeId === operator.id &&
      eligibleTranslationReviewers(item, [operator]).length,
  );

export const reassignInvalidTranslationReview = (
  item: TranslationItem,
  operators: ReviewOperator[],
  random: () => number = Math.random,
): TranslationItem => {
  if (!item.specialReviewRequired || item.status !== "翻译返回待审核") {
    return item;
  }
  const current = operators.find((operator) => operator.id === item.assigneeId);
  if (canOperateAssignedTranslation(item, current)) {
    return current?.name === item.assignee
      ? item
      : { ...item, assignee: current?.name };
  }
  return { ...item, ...assignTranslationReviewer(item, operators, random) };
};
