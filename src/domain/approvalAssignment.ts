import { canWritePage } from "./pagePermissions";
import type { ReviewOperator } from "./reviewOperators";
import type { ApprovalItem } from "./types";

export const pendingApprovalStatuses = [
  "待我审核",
  "待审核",
  "紧急",
] as const;

export interface ApprovalAssignment {
  assigneeId: string;
  assignee: string;
}

export const isPendingApproval = (approval: ApprovalItem) =>
  pendingApprovalStatuses.includes(
    approval.status as (typeof pendingApprovalStatuses)[number],
  );

export const eligibleApprovalReviewers = (
  operators: ReviewOperator[],
  submitterId: string,
) =>
  operators.filter(
    (operator) =>
      operator.id !== submitterId &&
      canWritePage(operator, "operations.approvals"),
  );

export const assignApprovalReviewer = (
  operators: ReviewOperator[],
  submitterId: string,
  random: () => number = Math.random,
): ApprovalAssignment => {
  const eligible = eligibleApprovalReviewers(operators, submitterId);
  if (!eligible.length) {
    throw new Error(
      "当前没有可用审核人，请联系超级管理员配置审核中心写权限",
    );
  }
  const index = Math.min(
    eligible.length - 1,
    Math.floor(Math.max(0, random()) * eligible.length),
  );
  const reviewer = eligible[index];
  return { assigneeId: reviewer.id, assignee: reviewer.name };
};

export const canReviewAssignedApproval = (
  approval: ApprovalItem,
  operator: ReviewOperator | undefined,
) =>
  Boolean(
    operator &&
      isPendingApproval(approval) &&
      approval.assigneeId === operator.id &&
      approval.submitterId !== operator.id &&
      canWritePage(operator, "operations.approvals"),
  );

export const reassignInvalidApprovals = (
  approvals: ApprovalItem[],
  operators: ReviewOperator[],
  random: () => number = Math.random,
): ApprovalItem[] =>
  approvals.map((approval) => {
    if (!isPendingApproval(approval)) return approval;
    const currentAssignee = operators.find(
      (operator) => operator.id === approval.assigneeId,
    );
    if (canReviewAssignedApproval(approval, currentAssignee)) {
      return approval.assignee === currentAssignee?.name
        ? approval
        : { ...approval, assignee: currentAssignee?.name };
    }
    return {
      ...approval,
      ...assignApprovalReviewer(operators, approval.submitterId, random),
    };
  });
