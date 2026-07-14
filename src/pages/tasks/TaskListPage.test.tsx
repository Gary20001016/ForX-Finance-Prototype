import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { getPrototypeState } from "../../store/prototypeStore";
import TaskListPage, { canEditTask } from "./TaskListPage";

it("filters task rows by keyword", async () => {
  render(
    <MemoryRouter>
      <TaskListPage />
    </MemoryRouter>,
  );
  await userEvent.type(
    screen.getByPlaceholderText("搜索任务 ID、名称或创建人"),
    "提现",
  );
  expect(screen.getByText("提现安全通知")).toBeVisible();
  expect(screen.queryByText("夏季交易赛召回")).not.toBeInTheDocument();
});

it("only allows editing the three mutable artificial task states", () => {
  expect(canEditTask("草稿")).toBe(true);
  expect(canEditTask("待修改")).toBe(true);
  expect(canEditTask("待发送")).toBe(true);
  expect(canEditTask("待审核")).toBe(false);
  expect(canEditTask("发送中")).toBe(false);
  expect(canEditTask("已暂停")).toBe(false);
  expect(canEditTask("已完成")).toBe(false);
  expect(canEditTask("已取消")).toBe(false);
  expect(canEditTask("已过期")).toBe(false);
});

it("shows the system event code for an event-triggered task", () => {
  render(
    <MemoryRouter>
      <TaskListPage />
    </MemoryRouter>,
  );
  expect(screen.getAllByText("系统事件触发").length).toBeGreaterThan(0);
  expect(screen.getByText("withdrawal.succeeded")).toBeVisible();
  expect(screen.getByText("liquidation.warning").closest("tr")).toHaveTextContent(
    "已停用",
  );
  expect(screen.getByText("liquidation.warning").closest("tr")).not.toHaveTextContent(
    "部分完成",
  );
});

it("separates task, approval and delivery-result columns", () => {
  render(
    <MemoryRouter>
      <TaskListPage />
    </MemoryRouter>,
  );

  expect(screen.getByRole("columnheader", { name: "任务状态" })).toBeVisible();
  expect(screen.getByRole("columnheader", { name: "审核状态" })).toBeVisible();
  expect(screen.getByRole("columnheader", { name: "发送结果" })).toBeVisible();
  expect(screen.getByText("短信供应商恢复补发")).toBeVisible();
  expect(screen.getAllByText("已完成").length).toBeGreaterThan(0);
  expect(screen.getByText("失败")).toBeVisible();
});

it("uses the nine standardized artificial states in the status filter", async () => {
  render(
    <MemoryRouter>
      <TaskListPage />
    </MemoryRouter>,
  );

  const statusSelect = screen
    .getByPlaceholderText("任务状态")
    .closest(".arco-select");
  expect(statusSelect).not.toBeNull();
  await userEvent.click(statusSelect!);

  expect(await screen.findByRole("option", { name: "待修改" })).toBeVisible();
  expect(
    screen.queryByRole("option", { name: "已驳回" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("option", { name: "部分完成" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("option", { name: "失败" }),
  ).not.toBeInTheDocument();
});

it("shows standardized operations and withdraws a pending review", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <TaskListPage />
    </MemoryRouter>,
  );

  await user.click(
    screen.getByRole("button", { name: "操作 夏季交易赛召回" }),
  );
  const withdrawAction = await screen.findByRole("menuitem", {
    name: "撤回审核",
  });
  expect(withdrawAction).toBeVisible();
  expect(screen.queryByText("继续编辑")).not.toBeInTheDocument();
  expect(screen.queryByText("再次编辑")).not.toBeInTheDocument();

  fireEvent.click(withdrawAction);
  await user.click(
    await screen.findByRole("button", { name: "确认撤回" }),
  );

  expect(
    getPrototypeState().tasks.find((item) => item.id === "MSG-260712-002"),
  ).toMatchObject({ status: "草稿", approvalStatus: "已撤回" });
});
