import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { TranslationBatch } from "../../domain/types";
import MultilingualProgressCell from "./MultilingualProgressCell";
import MultilingualProgressDrawer from "./MultilingualProgressDrawer";

const batch: TranslationBatch = {
  id: "MT-UI",
  subjectType: "manual_task_content",
  subjectId: "TASK-UI",
  subjectName: "临时消息",
  contentVersion: "draft-1",
  returnPath: "/tasks/create",
  templateId: "TASK-UI",
  templateVersion: "draft-1",
  sourceLocale: "zh-CN",
  targetLocales: ["en-US", "fr-FR", "zh-TW", "ja-JP", "ru-RU", "tr-TR"],
  status: "部分失败",
  createdBy: "Gary Ma",
  createdAt: "刚刚",
  updatedAt: "刚刚",
  items: [
    ["en-US", "已通过"],
    ["fr-FR", "已通过"],
    ["zh-TW", "已通过"],
    ["ja-JP", "待小语种专审"],
    ["ru-RU", "翻译失败"],
    ["tr-TR", "专审中"],
  ].map(([locale, status], index) => ({
    id: `MTI-UI-${index}`,
    batchId: "MT-UI",
    templateId: "TASK-UI",
    templateName: "临时消息",
    subjectType: "manual_task_content" as const,
    subjectId: "TASK-UI",
    subjectName: "临时消息",
    sourceLocale: "zh-CN",
    targetLocale: locale,
    externalTaskId: `EXT-${index}`,
    attemptNo: 1,
    status: status as never,
    sourceContentHash: "sha256:ui",
    submittedAt: "刚刚",
    submitter: "Gary Ma",
    variablesValid: true,
    specialReviewRequired: ["ja-JP", "ru-RU", "tr-TR"].includes(locale),
    reviewGroup: "小语种专项审核组",
    reviewSlaHours: 12,
  })),
};

describe("multilingual progress UI", () => {
  it("shows ratio, stage and highest-priority unfinished languages", () => {
    const onOpen = vi.fn();
    render(<MultilingualProgressCell batch={batch} onOpen={onOpen} />);

    expect(screen.getByText("3/6 已通过")).toBeInTheDocument();
    expect(screen.getByText("小语种专审")).toBeInTheDocument();
    expect(screen.getByText(/俄语 · 翻译失败/)).toBeInTheDocument();
    expect(screen.getByText(/日语 · 待专审/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "查看多语言进度" }));
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it("shows the full process and routes special languages to standalone review", () => {
    render(
      <MemoryRouter>
        <MultilingualProgressDrawer batch={batch} visible onClose={() => undefined} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/源文案完成/)).toBeInTheDocument();
    expect(screen.getByText(/普通语言确认/)).toBeInTheDocument();
    expect(screen.getByText("小语种专项审核", { exact: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "前往专审" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "普通确认" })).not.toBeInTheDocument();
  });
});
