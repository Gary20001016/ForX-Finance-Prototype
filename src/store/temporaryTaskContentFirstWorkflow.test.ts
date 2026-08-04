import { beforeEach, describe, expect, it } from "vitest";
import type { MessageTask } from "../domain/types";
import {
  approveOrdinaryTranslation,
  getPrototypeState,
  resetPrototypeStore,
  reviewApproval,
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
      body: "尊敬的用户，请查看提现进度。",
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

const approveTask = (task: MessageTask) => {
  const approval = getPrototypeState().approvals.find(
    (item) => item.taskId === task.id,
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

  it("does not create translation before content approval", () => {
    const task = submitTask(submission(["zh-CN", "en-US"]));
    const current = getPrototypeState().tasks.find(
      (item) => item.id === task.id,
    )!;

    expect(current.contentApprovalStatus).toBe("待审核");
    expect(current.workflowStage).toBe("content_review");
    expect(current.translationBatchId).toBeUndefined();
  });

  it("starts translation after approval and sends automatically after language review", () => {
    const task = submitTask(submission(["zh-CN", "en-US"]));
    approveTask(task);

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

  it("sends an ordinary single-language temporary task immediately after approval", () => {
    const task = submitTask(submission(["zh-CN"]));
    approveTask(task);

    const current = getPrototypeState().tasks.find(
      (item) => item.id === task.id,
    )!;
    expect(current.workflowStage).toBe("sending_ready");
    expect(current.status).toBe("发送中");
    expect(current.translationBatchId).toBeUndefined();
  });
});
