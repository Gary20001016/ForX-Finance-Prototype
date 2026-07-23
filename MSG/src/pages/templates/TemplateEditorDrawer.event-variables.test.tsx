import { beforeEach, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { resetPrototypeStore } from "../../store/prototypeStore";
import TemplateEditorDrawer from "./TemplateEditorDrawer";

beforeEach(() => resetPrototypeStore());

it("uses explained insert-only variables for event template bodies", async () => {
  const user = userEvent.setup();
  render(
    <TemplateEditorDrawer
      visible
      entryScope="event"
      onClose={() => undefined}
    />,
  );

  expect(screen.queryByText("逗号分隔")).not.toBeInTheDocument();
  const insertButtons = screen.getAllByRole("button", { name: "插入变量" });
  expect(insertButtons).toHaveLength(2);

  await user.click(insertButtons[0]);
  expect(screen.getByText("接收事件通知的用户昵称")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "插入 user_nickname" }));

  expect(screen.getByLabelText("Markdown 站内信正文")).toHaveValue(
    "{{ user_nickname }}",
  );
});
