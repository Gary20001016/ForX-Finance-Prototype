import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it } from "vitest";
import {
  createTranslationBatch,
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

  await user.click(screen.getAllByRole("button", { name: "开始专项审核" })[0]);
  expect(screen.getByText("默认语言源文案")).toBeVisible();
  expect(screen.getByRole("button", { name: "专项审核通过" })).toBeEnabled();
});
