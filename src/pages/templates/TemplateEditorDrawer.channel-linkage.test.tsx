import { beforeEach, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { resetPrototypeStore } from "../../store/prototypeStore";
import TemplateEditorDrawer from "./TemplateEditorDrawer";

beforeEach(() => resetPrototypeStore());

it("links editors and previews to formal channels without clearing hidden content", async () => {
  const user = userEvent.setup();
  render(
    <TemplateEditorDrawer
      visible
      entryScope="manual"
      onClose={() => undefined}
    />,
  );

  await user.type(screen.getByLabelText("Push 标题"), "保留的 Push 标题");
  await user.click(screen.getByRole("checkbox", { name: "Push" }));

  expect(screen.queryByLabelText("Push 标题")).not.toBeInTheDocument();
  expect(screen.getByLabelText("站内信标题")).toBeVisible();
  expect(
    screen.getByText("站内信（Web + App 共用）").closest(".arco-col"),
  ).toHaveClass("arco-col-24");

  await user.click(screen.getByRole("tab", { name: "双端预览" }));
  expect(
    screen.getByRole("region", { name: "Web 站内信预览" }),
  ).toBeVisible();
  expect(
    screen.getByRole("region", { name: "App 站内信预览" }),
  ).toBeVisible();
  expect(
    screen.queryByRole("region", { name: "App Push 预览" }),
  ).not.toBeInTheDocument();

  await user.click(screen.getByRole("checkbox", { name: "Push" }));
  await user.click(screen.getByRole("tab", { name: "内容编辑" }));
  expect(screen.getByLabelText("Push 标题")).toHaveValue(
    "保留的 Push 标题",
  );
});

it("keeps one formal channel and validates only selected channel content", async () => {
  const user = userEvent.setup();
  const onCreated = vi.fn();
  render(
    <TemplateEditorDrawer
      visible
      entryScope="manual"
      onClose={() => undefined}
      onCreated={onCreated}
    />,
  );

  await user.click(screen.getByRole("checkbox", { name: "Push" }));
  const stationChannel = screen.getByRole("checkbox", { name: "站内信" });
  await user.click(stationChannel);
  expect(stationChannel).toBeChecked();
  expect(screen.getByText("请至少保留一个正式渠道")).toBeVisible();

  await user.type(
    screen.getByPlaceholderText("后台识别名称"),
    "仅站内信模板",
  );
  await user.type(screen.getByLabelText("站内信标题"), "标题");
  await user.type(screen.getByLabelText("站内信摘要"), "摘要");
  await user.type(screen.getByLabelText("Markdown 站内信正文"), "正文");
  await user.click(screen.getByRole("button", { name: "保存草稿" }));

  await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
  expect(onCreated.mock.calls[0][0].channels).toEqual(["站内信"]);
});
