import { beforeEach, describe, expect, it } from "vitest";
import {
  approveOrdinaryTranslation,
  getPrototypeState,
  resetPrototypeStore,
  reviewApproval,
  saveTaskDraft,
  submitTask,
} from "./prototypeStore";

const submission = (
  locales: string[],
): Parameters<typeof submitTask>[0] => ({
  name: "临时消息内容先审",
  category: "asset",
  topic: "withdrawal",
  nature: "事务",
  risk: "中",
  template: "临时消息",
  channels: ["站内信"],
  audience: "指定 UID 名单",
  audienceCount: 1,
  schedule: "立即",
  creator: "Gary Ma",
  team: "消息运营",
  contentMode: "temporary",
  content: {
    sourceLocale: "zh-CN",
    locales,
    web: {
      title: "提现服务提醒",
      summary: "请关注到账状态",
      body: "到账 {{ amount }}",
      actionText: "查看详情",
      targetUrl: "forxfinance://assets",
    },
    push: {
      title: "",
      body: "",
      deepLink: "",
      platform: "全部设备",
      priority: "普通",
    },
  },
});

const approve = (approvalId: string) => {
  const approval = getPrototypeState().approvals.find(
    (item) => item.id === approvalId,
  )!;
  reviewApproval(approval.id, {
    decision: "approve",
    reviewerId: approval.assigneeId!,
    reviewer: approval.assignee!,
    opinion: "内容审核通过",
  });
};

describe("temporary task content-first workflow", () => {
  beforeEach(() => resetPrototypeStore());

  it("routes variable-bearing temporary messages through variable review first", () => {
    const task = submitTask(submission(["zh-CN", "en-US"]));
    const state = getPrototypeState();
    const current = state.tasks.find(
      (item) => item.id === task.id,
    )!;
    const approval = state.approvals.find((item) => item.taskId === task.id)!;

    expect(approval.reviewNode).toBe("variable");
    expect(current.variableReviewStatus).toBe("待审核");
    expect(current.contentApprovalStatus).toBe("未提交");
    expect(current.workflowStage).toBe("variable_review");
    expect(current.translationBatchId).toBeUndefined();
  });

  it("creates one content approval after variable review and translates only after it passes", () => {
    const task = submitTask(submission(["zh-CN", "en-US"]));
    const variableApproval = getPrototypeState().approvals.find(
      (item) => item.taskId === task.id,
    )!;
    approve(variableApproval.id);

    const afterVariableReview = getPrototypeState();
    const contentApprovals = afterVariableReview.approvals.filter(
      (item) =>
        item.taskId === task.id &&
        item.reviewNode === "content" &&
        item.status === "待审核",
    );
    expect(contentApprovals).toHaveLength(1);
    expect(
      afterVariableReview.translationBatches.some(
        (item) => item.subjectId === task.id,
      ),
    ).toBe(false);

    approve(contentApprovals[0].id);

    const afterApproval = getPrototypeState().tasks.find(
      (item) => item.id === task.id,
    )!;
    expect(afterApproval.contentApprovalStatus).toBe("已通过");
    expect(afterApproval.workflowStage).toBe("localization_review");

    const batch = getPrototypeState().translationBatches.find(
      (item) =>
        item.subjectType === "manual_task_content" &&
        item.subjectId === task.id,
    )!;
    const item = batch.items[0];
    approveOrdinaryTranslation(item.id, {
      title: item.machineTitle || "Withdrawal update",
      summary: item.machineSummary || "Check status",
      body: item.machineBody || "Please check your withdrawal.",
      reviewer: "admin-01",
    });

    const completed = getPrototypeState().tasks.find(
      (candidate) => candidate.id === task.id,
    )!;
    expect(completed.workflowStage).toBe("sending_ready");
    expect(completed.status).toBe("发送中");
    expect(completed.deliveryResult).toBe("处理中");
  });

  it("routes temporary messages without variables directly to content review", () => {
    const input = submission(["zh-CN", "en-US"]);
    const task = submitTask({
      ...input,
      content: {
        ...input.content!,
        web: {
          ...input.content!.web,
          body: "到账提醒",
        },
      },
    });
    const state = getPrototypeState();
    const current = state.tasks.find((item) => item.id === task.id)!;
    const approval = state.approvals.find((item) => item.taskId === task.id)!;

    expect(approval.reviewNode).toBe("content");
    expect(current.variableReviewStatus).toBe("不适用");
    expect(current.contentApprovalStatus).toBe("待审核");
    expect(current.workflowStage).toBe("content_review");
  });

  it("clears variable review data and withdraws pending reviews after an edit", () => {
    const input = submission(["zh-CN", "en-US"]);
    const task = submitTask(input);
    const approval = getPrototypeState().approvals.find(
      (item) => item.taskId === task.id,
    )!;

    saveTaskDraft({ ...input, name: "已编辑临时消息" }, task.id);

    const state = getPrototypeState();
    const current = state.tasks.find((item) => item.id === task.id)!;
    expect(current.variableReviewStatus).toBeUndefined();
    expect(current.variableReviewId).toBeUndefined();
    expect(current.variableReviewedAt).toBeUndefined();
    expect(current.variableReviewedBy).toBeUndefined();
    expect(current.variableReviewedHash).toBeUndefined();
    expect(state.approvals.find((item) => item.id === approval.id)?.status).toBe(
      "已撤回",
    );
  });

  it("sends an ordinary single-language temporary task immediately after approval", () => {
    const input = submission(["zh-CN"]);
    const task = submitTask({
      ...input,
      content: {
        ...input.content!,
        web: {
          ...input.content!.web,
          body: "到账提醒",
        },
      },
    });
    const contentApproval = getPrototypeState().approvals.find(
      (item) => item.taskId === task.id,
    )!;
    approve(contentApproval.id);

    const current = getPrototypeState().tasks.find(
      (item) => item.id === task.id,
    )!;
    expect(current.workflowStage).toBe("sending_ready");
    expect(current.status).toBe("发送中");
    expect(current.translationBatchId).toBeUndefined();
  });
});
