import { beforeEach, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { resetPrototypeStore } from "../../store/prototypeStore";
import TemplateEditorDrawer from "./TemplateEditorDrawer";

beforeEach(() => resetPrototypeStore());

it("configures Email delivery controls without an email type", async () => {
  const user = userEvent.setup();
  render(
    <TemplateEditorDrawer
      visible
      entryScope="manual"
      onClose={() => undefined}
    />,
  );

  await user.click(screen.getByRole("checkbox", { name: "Email" }));

  expect(screen.getByLabelText("邮件标题")).toBeVisible();
  expect(screen.getByRole("radiogroup", { name: "邮件正文类型" })).toBeVisible();
  expect(screen.getByLabelText("邮件纯文本正文")).toBeVisible();
  expect(screen.queryByLabelText("邮件类型")).not.toBeInTheDocument();
  expect(screen.getByLabelText("发件人身份")).toBeVisible();
  expect(screen.getByLabelText("邮件回复方式")).toHaveTextContent("不接收回复");
  expect(screen.getByRole("switch", { name: "退订入口" })).not.toBeChecked();

  await user.click(screen.getByRole("switch", { name: "退订入口" }));

  expect(screen.getByLabelText("邮件退订文案")).toHaveValue(
    "如果不想继续接收此类邮件，可取消订阅。",
  );
});
