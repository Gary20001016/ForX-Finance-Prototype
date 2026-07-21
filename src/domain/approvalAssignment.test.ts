import { describe, expect, it } from "vitest";
import type { ApprovalItem } from "./types";
import { createPagePermissions } from "./pagePermissions";
import { reviewOperators, type ReviewOperator } from "./reviewOperators";
import {
  assignApprovalReviewer,
  canReviewAssignedApproval,
  eligibleApprovalReviewers,
  reassignInvalidApprovals,
} from "./approvalAssignment";

const pendingApproval = (changes: Partial<ApprovalItem> = {}): ApprovalItem => ({
  id: "APR-TEST",
  objectType: "消息任务",
  name: "测试工单",
  version: "v1",
  risk: "低",
  nature: "服务",
  audience: 1,
  cost: "—",
  schedule: "立即",
  step: "统一审核",
  submitter: "Emily Chen",
  submitterId: "reviewer-en-01",
  assignee: "王璐",
  assigneeId: "reviewer-zh-01",
  submittedAt: "刚刚",
  status: "待审核",
  ...changes,
});

const approvalWriter = (id: string, name: string): ReviewOperator => ({
  id,
  name,
  team: "消息运营",
  enabled: true,
  isSuperAdmin: false,
  pagePermissions: createPagePermissions(undefined, ["operations.approvals"]),
});

describe("approval assignment", () => {
  it("only includes enabled approval writers other than the submitter", () => {
    const disabled = { ...approvalWriter("disabled", "停用审核人"), enabled: false };
    const candidates = eligibleApprovalReviewers(
      [...reviewOperators, disabled],
      "admin-01",
    );

    expect(candidates.map((operator) => operator.id)).toEqual([
      "reviewer-zh-01",
    ]);
  });

  it("randomly assigns exactly one eligible reviewer", () => {
    const secondWriter = approvalWriter("reviewer-ops-02", "周宁");

    expect(
      assignApprovalReviewer([...reviewOperators, secondWriter], "admin-01", () => 0),
    ).toEqual({ assigneeId: "reviewer-zh-01", assignee: "王璐" });
    expect(
      assignApprovalReviewer(
        [...reviewOperators, secondWriter],
        "admin-01",
        () => 0.99,
      ),
    ).toEqual({ assigneeId: "reviewer-ops-02", assignee: "周宁" });
  });

  it("blocks assignment when no eligible reviewer remains", () => {
    expect(() =>
      assignApprovalReviewer([reviewOperators[0]], "admin-01"),
    ).toThrow("当前没有可用审核人");
  });

  it("allows only the assigned non-submitter reviewer to review", () => {
    const approval = pendingApproval();

    expect(
      canReviewAssignedApproval(approval, reviewOperators[2]),
    ).toBe(true);
    expect(
      canReviewAssignedApproval(approval, reviewOperators[0]),
    ).toBe(false);
    expect(
      canReviewAssignedApproval(
        pendingApproval({ submitterId: "reviewer-zh-01" }),
        reviewOperators[2],
      ),
    ).toBe(false);
  });

  it("reassigns pending work when the current reviewer loses write access", () => {
    const operatorsAfterPermissionLoss = reviewOperators.map((operator) =>
      operator.id === "reviewer-zh-01"
        ? { ...operator, pagePermissions: createPagePermissions() }
        : operator,
    );

    const [reassigned] = reassignInvalidApprovals(
      [pendingApproval()],
      operatorsAfterPermissionLoss,
      () => 0,
    );

    expect(reassigned.assigneeId).toBe("admin-01");
    expect(reassigned.assignee).toBe("Gary Ma");
  });

  it("keeps the historical assignee on completed work", () => {
    const completed = pendingApproval({ status: "已通过" });
    const operatorsAfterPermissionLoss = reviewOperators.map((operator) =>
      operator.id === "reviewer-zh-01"
        ? { ...operator, pagePermissions: createPagePermissions() }
        : operator,
    );

    expect(
      reassignInvalidApprovals([completed], operatorsAfterPermissionLoss),
    ).toEqual([completed]);
  });
});
