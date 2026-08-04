import { beforeEach, describe, expect, it } from "vitest";
import type { MessageTemplate } from "../domain/types";
import {
  approveOrdinaryTranslation,
  getPrototypeState,
  resetPrototypeStore,
  reviewApproval,
  saveTemplate,
  submitTemplateContentForApproval,
  updateTemplate,
} from "./prototypeStore";

const templateInput = (): Omit<
  MessageTemplate,
  | "id"
  | "code"
  | "translationBatchId"
  | "translationReadiness"
  | "version"
  | "status"
  | "updatedAt"
> => ({
  name: "内容先审测试模板",
  category: "asset",
  topic: "withdrawal",
  nature: "事务",
  risk: "中",
  channels: ["站内信"],
  locales: ["zh-CN", "en-US"],
  sourceLocale: "zh-CN",
  content: {
    sourceLocale: "zh-CN",
    locales: ["zh-CN", "en-US"],
    web: {
      title: "提现成功",
      summary: "资金已经到账",
      body: "尊敬的 {{ user_nickname }}，提现已成功。",
      actionText: "查看详情",
      targetUrl: "forxfinance://assets",
    },
    push: {
      title: "",
      body: "",
      deepLink: "",
      platform: "全部设备",
      priority: "高",
    },
  },
  variables: ["user_nickname"],
  owner: "资产运营",
  usageScope: "manual",
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

describe("template content-first workflow", () => {
  beforeEach(() => resetPrototypeStore());

  it("routes variable-bearing templates through variable review first", () => {
    const template = saveTemplate(templateInput());
    const approval = submitTemplateContentForApproval(template.id);
    const state = getPrototypeState();
    const current = state.templates.find((item) => item.id === template.id)!;

    expect(approval.objectType).toBe("人工消息模板");
    expect(approval.reviewNode).toBe("variable");
    expect(current.status).toBe("审核中");
    expect(current.workflowStage).toBe("variable_review");
    expect(current.variableReviewStatus).toBe("待审核");
    expect(current.contentApprovalStatus).toBe("未提交");
    expect(
      state.translationBatches.some((item) => item.templateId === template.id),
    ).toBe(false);
  });

  it("creates one content approval after variable review and localizes only after it passes", () => {
    const template = saveTemplate(templateInput());
    const variableApproval = submitTemplateContentForApproval(template.id);
    approve(variableApproval.id);

    const afterVariableReview = getPrototypeState();
    const contentApprovals = afterVariableReview.approvals.filter(
      (item) =>
        item.templateId === template.id &&
        item.reviewNode === "content" &&
        item.status === "待审核",
    );
    expect(contentApprovals).toHaveLength(1);
    expect(
      afterVariableReview.translationBatches.some(
        (item) => item.templateId === template.id,
      ),
    ).toBe(false);

    approve(contentApprovals[0].id);

    const current = getPrototypeState().templates.find(
      (item) => item.id === template.id,
    )!;
    expect(current.contentApprovalStatus).toBe("已通过");
    expect(current.workflowStage).toBe("localization_review");
    expect(current.translationBatchId).toMatch(/^MT-/);
    expect(current.status).toBe("审核中");
  });

  it("routes templates without variables directly to content review", () => {
    const input = templateInput();
    const template = saveTemplate({
      ...input,
      content: {
        ...input.content!,
        web: {
          ...input.content!.web,
          body: "尊敬的用户，提现已成功。",
        },
      },
      variables: [],
    });

    const approval = submitTemplateContentForApproval(template.id);
    const current = getPrototypeState().templates.find(
      (item) => item.id === template.id,
    )!;

    expect(approval.reviewNode).toBe("content");
    expect(current.variableReviewStatus).toBe("不适用");
    expect(current.contentApprovalStatus).toBe("待审核");
    expect(current.workflowStage).toBe("content_review");
  });

  it("clears variable review data and withdraws pending reviews after an edit", () => {
    const template = saveTemplate(templateInput());
    const approval = submitTemplateContentForApproval(template.id);

    updateTemplate(template.id, { name: "已编辑模板" });

    const state = getPrototypeState();
    const current = state.templates.find((item) => item.id === template.id)!;
    expect(current.variableReviewStatus).toBeUndefined();
    expect(current.variableReviewId).toBeUndefined();
    expect(current.variableReviewedAt).toBeUndefined();
    expect(current.variableReviewedBy).toBeUndefined();
    expect(current.variableReviewedHash).toBeUndefined();
    expect(state.approvals.find((item) => item.id === approval.id)?.status).toBe(
      "已撤回",
    );
  });

  it("publishes automatically when every target language passes", () => {
    const template = saveTemplate(templateInput());
    const variableApproval = submitTemplateContentForApproval(template.id);
    approve(variableApproval.id);
    const contentApproval = getPrototypeState().approvals.find(
      (item) =>
        item.templateId === template.id &&
        item.reviewNode === "content" &&
        item.status === "待审核",
    )!;
    approve(contentApproval.id);
    const batch = getPrototypeState().translationBatches.find(
      (item) => item.templateId === template.id,
    )!;
    const item = batch.items[0];

    approveOrdinaryTranslation(item.id, {
      title: item.machineTitle || "Withdrawal succeeded",
      summary: item.machineSummary || "Funds arrived",
      body: item.machineBody || "Your withdrawal succeeded.",
      reviewer: "admin-01",
    });

    const current = getPrototypeState().templates.find(
      (candidate) => candidate.id === template.id,
    )!;
    expect(current.translationReadiness).toBe("已通过");
    expect(current.workflowStage).toBe("published");
    expect(current.status).toBe("已发布");
  });

  it("publishes ordinary single-language content immediately after approval", () => {
    const template = saveTemplate({
      ...templateInput(),
      locales: ["zh-CN"],
      content: {
        ...templateInput().content!,
        locales: ["zh-CN"],
      },
    });
    const variableApproval = submitTemplateContentForApproval(template.id);
    approve(variableApproval.id);
    const contentApproval = getPrototypeState().approvals.find(
      (item) =>
        item.templateId === template.id &&
        item.reviewNode === "content" &&
        item.status === "待审核",
    )!;
    approve(contentApproval.id);

    const current = getPrototypeState().templates.find(
      (item) => item.id === template.id,
    )!;
    expect(current.translationBatchId).toBe("");
    expect(current.translationReadiness).toBe("已通过");
    expect(current.status).toBe("已发布");
  });
});
