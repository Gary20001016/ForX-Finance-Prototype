import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, it } from "vitest";
import type { MessageTemplate, TranslationBatch } from "../../domain/types";
import TranslationWorkflowPanel from "./TranslationWorkflowPanel";

const template: MessageTemplate = {
  id: "TPL-TEST",
  code: "test",
  name: "测试模板",
  category: "系统公告",
  nature: "服务",
  risk: "低",
  channels: ["站内信"],
  locales: ["zh-CN", "en-US", "fr-FR", "ja-JP"],
  sourceLocale: "zh-CN",
  translationBatchId: "MT-TEST",
  translationReadiness: "无结果",
  version: "v1",
  status: "草稿",
  updatedAt: "刚刚",
  usageScope: "manual",
};

const batch: TranslationBatch = {
  id: "MT-TEST",
  templateId: template.id,
  templateVersion: template.version,
  sourceLocale: "zh-CN",
  targetLocales: ["en-US", "fr-FR", "ja-JP"],
  status: "无结果",
  createdBy: "Gary Ma",
  createdAt: "刚刚",
  updatedAt: "刚刚",
  items: [
    ["en-US", "无结果", false],
    ["fr-FR", "翻译返回待审核", false],
    ["ja-JP", "翻译返回待审核", true],
  ].map(([targetLocale, status, specialReviewRequired], index) => ({
    id: `MTI-${index}`,
    batchId: "MT-TEST",
    templateId: template.id,
    templateName: template.name,
    sourceLocale: "zh-CN",
    targetLocale: String(targetLocale),
    externalTaskId: `EXT-${index}`,
    attemptNo: 1,
    status: status as "无结果" | "翻译返回待审核",
    sourceContentHash: "sha256:test",
    submittedAt: "刚刚",
    submitter: "operator-01",
    variablesValid: true,
    specialReviewRequired: Boolean(specialReviewRequired),
  })),
};

it("renders only the three translation states and exposes actions by result and review route", () => {
  render(
    <MemoryRouter>
      <TranslationWorkflowPanel template={template} batch={batch} />
    </MemoryRouter>,
  );

  expect(screen.getAllByText("无结果").length).toBeGreaterThan(0);
  expect(screen.getByRole("button", { name: "重试该语言" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "当场校对并确认" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "前往专项审核" })).toBeEnabled();
  expect(screen.queryByText("外部机翻", { exact: true })).not.toBeInTheDocument();
  expect(screen.queryByText("人工审核", { exact: true })).not.toBeInTheDocument();
});
