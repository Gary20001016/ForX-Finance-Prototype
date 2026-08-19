import { beforeEach, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { resetPrototypeStore } from "../../store/prototypeStore";
import TemplateEditorDrawer from "./TemplateEditorDrawer";

beforeEach(() => resetPrototypeStore());

it("authors transactional and marketing Email content inside the shared template", async () => {
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
  expect(screen.getByLabelText("邮件类型")).toHaveTextContent("事务邮件");

  await user.click(screen.getByLabelText("邮件类型"));
  fireEvent.click((await screen.findAllByText("营销邮件")).at(-1)!);

  expect(screen.getByLabelText("邮件退订文案")).toHaveValue(
    "如果不想继续接收此类邮件，可取消订阅。",
  );
});
