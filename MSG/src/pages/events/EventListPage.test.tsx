import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it } from "vitest";
import { resetPrototypeStore } from "../../store/prototypeStore";
import EventListPage from "./EventListPage";

beforeEach(() => resetPrototypeStore());

it("keeps event definitions separate from notification rules", () => {
  render(
    <MemoryRouter>
      <EventListPage />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: "事件目录" })).toBeVisible();
  expect(
    screen.getByText(
      "由后台事件注册中心统一维护；操作者可查询事件、查看字段，并用于创建通知规则。",
    ),
  ).toBeVisible();
  expect(
    screen.getByRole("columnheader", { name: "关联通知规则" }),
  ).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "注册事件" }),
  ).not.toBeInTheDocument();
  expect(screen.queryByText("关联触发任务")).not.toBeInTheDocument();
});

it("focuses the event list on notification setup while retaining runtime metrics", () => {
  render(
    <MemoryRouter>
      <EventListPage />
    </MemoryRouter>,
  );

  for (const column of [
    "事件",
    "业务线",
    "可用消息变量",
    "关联通知规则",
    "近24h调用",
    "失败率",
    "最后调用",
    "运行状态",
    "操作",
  ]) {
    expect(screen.getByRole("columnheader", { name: column })).toBeVisible();
  }
  expect(screen.queryByRole("columnheader", { name: "版本" })).not.toBeInTheDocument();
  expect(screen.queryByRole("columnheader", { name: "调用方" })).not.toBeInTheDocument();
  expect(screen.getByPlaceholderText("关联通知规则")).toBeVisible();
  expect(
    screen.queryByText(/事件编码、版本、调用方与字段 Schema/),
  ).not.toBeInTheDocument();
});

it("explains every available variable in the event detail table", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <EventListPage />
    </MemoryRouter>,
  );

  await user.click(screen.getAllByRole("button", { name: "详情" })[0]);

  expect(screen.getByRole("columnheader", { name: "模板变量" })).toBeVisible();
  expect(screen.getByRole("columnheader", { name: "说明" })).toBeVisible();
  expect(screen.getByRole("columnheader", { name: "示例" })).toBeVisible();
  expect(screen.getByText("{{ symbol }}")).toBeVisible();
  expect(screen.getByText("事件涉及的交易对")).toBeVisible();
  expect(screen.getByText("BTC/USDT")).toBeVisible();
});
