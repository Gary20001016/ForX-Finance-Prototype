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
  status: "无结果",
  createdBy: "Gary Ma",
  createdAt: "刚刚",
  updatedAt: "刚刚",
  items: [
    ["en-US", "已通过"],
    ["fr-FR", "已通过"],
    ["zh-TW", "已通过"],
    ["ja-JP", "翻译返回待审核"],
    ["ru-RU", "无结果"],
    ["tr-TR", "翻译返回待审核"],
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
    status: status as "无结果" | "翻译返回待审核" | "已通过",
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
  it("shows ratio, aggregate status and language groups", () => {
    const onOpen = vi.fn();
    render(<MultilingualProgressCell batch={batch} onOpen={onOpen} />);

    expect(screen.getByText("3/6 已通过")).toBeInTheDocument();
    expect(screen.getByText("无结果")).toBeInTheDocument();
    expect(screen.getByText(/无结果：俄语/)).toBeInTheDocument();
    expect(screen.getByText(/待审核：日语、土耳其语/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "查看多语言进度" }));
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it("shows translation results without a transition-state stepper and routes special languages to review", () => {
    render(
      <MemoryRouter>
        <MultilingualProgressDrawer batch={batch} visible onClose={() => undefined} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/当前状态：无结果/)).toBeInTheDocument();
    expect(screen.queryByText(/源文案完成/)).not.toBeInTheDocument();
    expect(screen.getAllByText("需专项审核").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "前往专审" })).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "普通确认" })).not.toBeInTheDocument();
  });
});
