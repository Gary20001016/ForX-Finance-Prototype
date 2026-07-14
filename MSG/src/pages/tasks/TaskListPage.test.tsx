import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
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

it("allows editing every task except sending and completed tasks", () => {
  expect(canEditTask("待审核")).toBe(true);
  expect(canEditTask("待发送")).toBe(true);
  expect(canEditTask("已暂停")).toBe(true);
  expect(canEditTask("部分完成")).toBe(true);
  expect(canEditTask("失败")).toBe(true);
  expect(canEditTask("已取消")).toBe(true);
  expect(canEditTask("发送中")).toBe(false);
  expect(canEditTask("已完成")).toBe(false);
});

it("shows the system event code for an event-triggered task", () => {
  render(
    <MemoryRouter>
      <TaskListPage />
    </MemoryRouter>,
  );
  expect(screen.getAllByText("系统事件触发").length).toBeGreaterThan(0);
  expect(screen.getByText("withdrawal.succeeded")).toBeVisible();
});

it("includes the rejected status in the task status filter", async () => {
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

  expect(await screen.findByText("已驳回")).toBeVisible();
});
