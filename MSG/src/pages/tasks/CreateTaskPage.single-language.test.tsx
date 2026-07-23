import { beforeEach, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import {
  getPrototypeState,
  resetPrototypeStore,
} from "../../store/prototypeStore";
import CreateTaskPage from "./CreateTaskPage";

beforeEach(() => resetPrototypeStore());

it("creates a direct review batch for a Japanese-only temporary message", async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><CreateTaskPage /></MemoryRouter>);

  await user.click(screen.getByText("临时消息"));
  await user.click(screen.getByRole("checkbox", { name: "App Push" }));
  await user.click(screen.getByLabelText("临时消息默认语言"));
  fireEvent.click(await screen.findByText("ja-JP"));
  await user.type(screen.getByLabelText("站内信标题"), "お知らせ");
  await user.type(screen.getByLabelText("站内信摘要"), "概要");
  await user.type(screen.getByLabelText("Markdown 站内信正文"), "本文");

  expect(screen.getByText(/单语言临时消息，无需机器翻译/)).toBeVisible();
  await user.click(screen.getByRole("button", { name: "提交语言审核" }));

  await waitFor(() =>
    expect(
      getPrototypeState().translationBatches.find(
        (batch) => batch.subjectType === "manual_task_content",
      ),
    ).toMatchObject({
      productionMode: "direct_source_review",
      sourceLocale: "ja-JP",
      targetLocales: [],
    }),
  );
});

it("completes language preparation locally for an ordinary single-language temporary message", async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><CreateTaskPage /></MemoryRouter>);

  await user.click(screen.getByText("临时消息"));

  expect(screen.getByText(/单语言临时消息，无需机器翻译/)).toBeVisible();
  expect(
    screen.getByRole("button", { name: "完成语言准备" }),
  ).toBeEnabled();
});
