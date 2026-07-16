import { beforeEach, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  getPrototypeState,
  resetPrototypeStore,
} from "../../store/prototypeStore";
import TemplateEditorDrawer from "./TemplateEditorDrawer";

beforeEach(() => resetPrototypeStore());

it("automatically sends the current template to all personal test accounts", async () => {
  const user = userEvent.setup();
  const template = getPrototypeState().templates.find(
    (item) => item.id === "TPL-1004",
  )!;

  render(
    <TemplateEditorDrawer
      visible
      template={template}
      entryScope="manual"
      onClose={() => undefined}
    />,
  );

  await user.click(screen.getByRole("button", { name: "测试发送" }));

  expect(screen.getByText("UID-TEST-9001")).toBeVisible();
  expect(screen.getByText("UID-TEST-9002")).toBeVisible();
  expect(screen.queryByPlaceholderText("输入测试 UID")).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "发送测试消息" }));

  expect(
    await screen.findByText("2 个测试账号 × 2 个渠道，共生成 4 条测试发送"),
  ).toBeVisible();
});

it("does not offer test sending for a locked published manual template", () => {
  const template = getPrototypeState().templates.find(
    (item) => item.id === "TPL-1007",
  )!;

  render(
    <TemplateEditorDrawer
      visible
      template={template}
      entryScope="manual"
      onClose={() => undefined}
    />,
  );

  expect(
    screen.queryByRole("button", { name: "测试发送" }),
  ).not.toBeInTheDocument();
});
