import { describe, expect, it } from "vitest";
import {
  type ContentApprovalSnapshot,
  contentApprovalHash,
  contentWorkflowStageLabel,
  shouldStartLocalization,
  templateMainStatusForStage,
} from "./contentApprovalWorkflow";

const snapshot = {
  sourceLocale: "zh-CN",
  locales: ["zh-CN", "ja-JP"],
  channels: ["站内信"] as const,
  category: "asset" as const,
  topic: "withdrawal" as const,
  risk: "中" as const,
  content: {
    sourceLocale: "zh-CN",
    locales: ["zh-CN", "ja-JP"],
    web: {
      title: "提现成功",
      summary: "资金已经到账",
      body: "到账金额 {{ amount }}",
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
  variables: ["amount"],
} satisfies ContentApprovalSnapshot;

describe("content-first localization workflow", () => {
  it("keeps internal stages behind the four operator-facing template statuses", () => {
    expect(templateMainStatusForStage("draft")).toBe("草稿");
    expect(templateMainStatusForStage("content_review")).toBe("审核中");
    expect(templateMainStatusForStage("localization_review")).toBe("审核中");
    expect(templateMainStatusForStage("rejected")).toBe("驳回");
    expect(templateMainStatusForStage("published")).toBe("已发布");
  });

  it("starts localization only after content approval", () => {
    expect(shouldStartLocalization("未提交")).toBe(false);
    expect(shouldStartLocalization("待审核")).toBe(false);
    expect(shouldStartLocalization("已通过")).toBe(true);
  });

  it("uses concise current-node labels", () => {
    expect(contentWorkflowStageLabel("content_review")).toBe("内容审核中");
    expect(contentWorkflowStageLabel("translation_creating")).toBe(
      "多语言任务创建中",
    );
    expect(contentWorkflowStageLabel("localization_review")).toBe(
      "多语言审核中",
    );
  });

  it("changes the approved snapshot hash when governed content changes", () => {
    expect(contentApprovalHash(snapshot)).not.toBe(
      contentApprovalHash({
        ...snapshot,
        content: {
          ...snapshot.content,
          web: { ...snapshot.content.web, body: "到账金额 {{ actual_amount }}" },
        },
      }),
    );
  });

  it("keeps the approved snapshot hash stable when variable order changes", () => {
    expect(
      contentApprovalHash({ ...snapshot, variables: ["currency", "amount"] }),
    ).toBe(
      contentApprovalHash({ ...snapshot, variables: ["amount", "currency"] }),
    );
  });
});
