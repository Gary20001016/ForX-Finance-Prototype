import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import {
  getPrototypeState,
  prepareSingleLanguageContent,
  resetPrototypeStore,
} from "../../store/prototypeStore";
import TranslationReviewDrawer from "./TranslationReviewDrawer";

beforeEach(() => resetPrototypeStore());

it("reviews directly authored source text without machine-translation metadata", () => {
  const result = prepareSingleLanguageContent({
    subject: {
      type: "manual_task_content",
      id: "TASK-JA",
      name: "日本語のお知らせ",
      version: "draft-1",
      returnPath: "/tasks/create",
    },
    sourceLocale: "ja-JP",
    sourceContent: { title: "お知らせ", summary: "概要", body: "本文" },
    createdBy: "operator-01",
  });
  const item = getPrototypeState().translationBatches
    .find((batch) => batch.id === result.batch?.id)
    ?.items[0];

  render(
    <TranslationReviewDrawer
      item={item}
      visible
      onClose={() => undefined}
      currentAdmin="special-reviewer-02"
      reviewMode="special"
    />,
  );

  expect(screen.getByText(/原文校对/)).toBeVisible();
  expect(screen.getByText("提交原文")).toBeVisible();
  expect(screen.getByText("人工审核稿")).toBeVisible();
  expect(screen.queryByText("外部任务 ID")).not.toBeInTheDocument();
  expect(screen.queryByText("翻译尝试")).not.toBeInTheDocument();
  expect(screen.queryByText("机器翻译与人工修订")).not.toBeInTheDocument();
});
