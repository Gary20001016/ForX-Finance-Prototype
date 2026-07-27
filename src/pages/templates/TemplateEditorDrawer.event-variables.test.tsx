import { beforeEach, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  getPrototypeState,
  resetPrototypeStore,
} from "../../store/prototypeStore";
import TemplateEditorDrawer from "./TemplateEditorDrawer";

beforeEach(() => resetPrototypeStore());

const selectDepositEvent = async (user: ReturnType<typeof userEvent.setup>) => {
  const eventField = screen.getByText("系统事件").closest(".arco-form-item");
  const eventSelect = eventField?.querySelector(".arco-select");
  expect(eventSelect).toBeTruthy();
  await user.click(eventSelect as HTMLElement);
  fireEvent.click(await screen.findByText("充值到账 · deposit.credited"));
};

it("selects an event from the directory and locks inherited metadata", async () => {
  const user = userEvent.setup();
  render(
    <TemplateEditorDrawer
      visible
      entryScope="event"
      onClose={() => undefined}
    />,
  );

  await selectDepositEvent(user);

  const categoryField = screen
    .getByText("前台一级分类")
    .closest(".arco-form-item");
  const topicField = screen
    .getByText("前台二级主题")
    .closest(".arco-form-item");
  const riskField = screen.getByText("风险等级").closest(".arco-form-item");
  expect(categoryField).toHaveTextContent("资产");
  expect(topicField).toHaveTextContent("充值");
  expect(riskField).toHaveTextContent("中");
  expect(categoryField?.querySelector(".arco-select-disabled")).toBeTruthy();
  expect(topicField?.querySelector(".arco-select-disabled")).toBeTruthy();
  expect(riskField?.querySelector(".arco-select-disabled")).toBeTruthy();
});

it("uses explained insert-only variables for event template bodies", async () => {
  const user = userEvent.setup();
  render(
    <TemplateEditorDrawer
      visible
      entryScope="event"
      onClose={() => undefined}
    />,
  );

  await selectDepositEvent(user);

  expect(screen.queryByText("逗号分隔")).not.toBeInTheDocument();
  const insertButtons = screen.getAllByRole("button", { name: "插入变量" });
  expect(insertButtons).toHaveLength(2);

  await user.click(insertButtons[0]);
  expect(screen.getByText("接收事件通知的用户昵称")).toBeVisible();
  expect(screen.getByText("事件涉及的区块链网络")).toBeVisible();
  expect(screen.queryByText("事件涉及的交易对")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "插入 user_nickname" }));

  expect(screen.getByLabelText("Markdown 站内信正文")).toHaveValue(
    "{{ user_nickname }}",
  );
});

it("does not allow changing the bound event when editing", () => {
  const template = getPrototypeState().templates.find(
    (item) => item.code === "liquidation_warning",
  )!;

  render(
    <TemplateEditorDrawer
      visible
      template={template}
      entryScope="event"
      onClose={() => undefined}
    />,
  );

  const eventField = screen.getByText("系统事件").closest(".arco-form-item");
  expect(eventField).toHaveTextContent("合约强平预警 · liquidation.warning");
  expect(eventField?.querySelector(".arco-select-disabled")).toBeTruthy();
});
