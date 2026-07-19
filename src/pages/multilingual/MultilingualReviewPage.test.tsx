import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it } from "vitest";
import {
  createTranslationBatch,
  prepareSingleLanguageContent,
  resetPrototypeStore,
} from "../../store/prototypeStore";
import MultilingualReviewPage from "./MultilingualReviewPage";

beforeEach(() => resetPrototypeStore());

it("lists only special-language review items with source and SLA", async () => {
  createTranslationBatch({
    subject: {
      type: "manual_task_content",
      id: "TASK-REVIEW",
      name: "临时风险消息",
      version: "draft-1",
      returnPath: "/tasks/create",
    },
    sourceLocale: "zh-CN",
    sourceContent: { title: "风险提示", body: "请核对账户。" },
    targetLocales: ["en-US", "ja-JP"],
    createdBy: "operator-01",
  });
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <MultilingualReviewPage />
    </MemoryRouter>,
  );

  expect(screen.getByText("临时风险消息")).toBeInTheDocument();
  expect(screen.getByText("人工任务临时内容")).toBeInTheDocument();
  expect(screen.getByText("日韩专项审核组")).toBeInTheDocument();
  expect(screen.getByText("8 小时")).toBeInTheDocument();
  expect(screen.queryByText("en-US")).not.toBeInTheDocument();

  await user.click(screen.getAllByRole("button", { name: "审核译文" })[0]);
  expect(screen.getByText("默认语言源文案")).toBeVisible();
  expect(screen.getByRole("button", { name: "专项审核通过" })).toBeEnabled();
});

it("labels direct source review items without an external task", () => {
  prepareSingleLanguageContent({
    subject: {
      type: "manual_task_content",
      id: "TASK-DIRECT-JA",
      name: "日本語単独メッセージ",
      version: "draft-1",
      returnPath: "/tasks/create",
    },
    sourceLocale: "ja-JP",
    sourceContent: { title: "お知らせ", body: "本文" },
    createdBy: "operator-01",
  });

  render(
    <MemoryRouter>
      <MultilingualReviewPage />
    </MemoryRouter>,
  );

  expect(screen.getByText("日本語単独メッセージ")).toBeVisible();
  expect(screen.getByText("单语言原文")).toBeVisible();
  expect(screen.getByText("原文待审核")).toBeVisible();
  expect(screen.getByRole("button", { name: "审核原文" })).toBeEnabled();
});
