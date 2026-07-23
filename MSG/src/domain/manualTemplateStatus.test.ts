import { describe, expect, it } from "vitest";
import type { MessageTemplate } from "./types";
import {
  MANUAL_TEMPLATE_STATUSES,
  normalizeManualTemplateStatus,
  normalizeManualTemplateStatuses,
} from "./manualTemplateStatus";

const template = (
  id: string,
  usageScope: MessageTemplate["usageScope"],
  status: string,
): MessageTemplate => ({
  id,
  code: id.toLowerCase(),
  name: id,
  category: "系统公告",
  nature: "事务",
  risk: "低",
  channels: ["站内信"],
  locales: ["zh-CN"],
  sourceLocale: "zh-CN",
  translationBatchId: "",
  translationReadiness: "已通过",
  version: "v1",
  status,
  updatedAt: "刚刚",
  usageScope,
});

describe("manual template statuses", () => {
  it("exposes exactly the four operator-facing statuses", () => {
    expect(MANUAL_TEMPLATE_STATUSES).toEqual([
      "草稿",
      "审核中",
      "驳回",
      "已发布",
    ]);
  });

  it.each([
    ["草稿", "草稿"],
    ["审核中", "审核中"],
    ["待业务审核", "审核中"],
    ["待审核", "审核中"],
    ["驳回", "驳回"],
    ["已驳回", "驳回"],
    ["已发布", "已发布"],
    ["已停用", "草稿"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizeManualTemplateStatus(input)).toBe(expected);
  });

  it("normalizes manual and shared templates without changing event templates", () => {
    const result = normalizeManualTemplateStatuses([
      template("TPL-MAN", "manual", "已停用"),
      template("TPL-SHARED", "shared", "待业务审核"),
      template("TPL-EVENT", "event", "已停用"),
    ]);

    expect(result.map((item) => item.status)).toEqual([
      "草稿",
      "审核中",
      "已停用",
    ]);
  });
});
