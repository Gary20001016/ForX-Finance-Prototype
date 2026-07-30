import { beforeEach, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { resetPrototypeStore } from "../../store/prototypeStore";
import CreateTaskPage from "./CreateTaskPage";

beforeEach(() => resetPrototypeStore());

it("queues Japanese-only temporary content for content review first", async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><CreateTaskPage /></MemoryRouter>);

  await user.click(screen.getByText("临时消息"));
  await user.click(screen.getByRole("checkbox", { name: "App Push" }));
  await user.click(screen.getByLabelText("临时消息默认语言"));
  fireEvent.click(await screen.findByText("ja-JP"));
  await user.type(screen.getByLabelText("站内信标题"), "お知らせ");
  await user.type(screen.getByLabelText("站内信摘要"), "概要");
  await user.type(screen.getByLabelText("Markdown 站内信正文"), "本文");

  expect(screen.getByText(/单语言临时消息先审核当前内容/)).toBeVisible();
  expect(screen.getByText("提交后：内容审核 → 多语言")).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "提交语言审核" }),
  ).not.toBeInTheDocument();
});

it("does not expose language preparation before ordinary content approval", async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><CreateTaskPage /></MemoryRouter>);

  await user.click(screen.getByText("临时消息"));

  expect(screen.getByText(/单语言临时消息先审核当前内容/)).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "完成语言准备" }),
  ).not.toBeInTheDocument();
});
