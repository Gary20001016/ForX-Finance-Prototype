import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import EventListPage from "./EventListPage";

it("展示 V2 八个系统事件和关联通知规则", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <EventListPage />
    </MemoryRouter>,
  );
  expect(screen.getByRole("heading", { name: "事件目录" })).toBeVisible();
  for (const event of [
    "充值到账",
    "提现成功",
    "提现失败",
    "订单成交",
    "合约强平预警",
    "体验金到账",
    "积分到账",
    "返佣到账",
  ]) {
    expect(screen.getByText(event)).toBeVisible();
  }
  expect(screen.getByText("关联通知规则")).toBeVisible();
  expect(screen.queryByText("绑定模板")).not.toBeInTheDocument();
  await user.click(screen.getAllByText("详情")[1]);
  expect(screen.getByRole("button", { name: "创建通知规则" })).toBeVisible();
});
