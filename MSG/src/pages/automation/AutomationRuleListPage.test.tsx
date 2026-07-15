import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it } from "vitest";
import { getPrototypeState, resetPrototypeStore } from "../../store/prototypeStore";
import AutomationRuleListPage from "./AutomationRuleListPage";

beforeEach(() => resetPrototypeStore());

it("shows event notification rules separately from artificial tasks", () => {
  render(
    <MemoryRouter>
      <AutomationRuleListPage />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: "事件通知规则" })).toBeVisible();
  expect(screen.getByText("提现成功自动通知")).toBeVisible();
  expect(screen.getByText("当前内容版本")).toBeVisible();
  expect(screen.queryByText("夏季交易赛召回")).not.toBeInTheDocument();
});

it("creates a new immutable content version without stopping the rule", () => {
  render(
    <MemoryRouter>
      <AutomationRuleListPage />
    </MemoryRouter>,
  );

  fireEvent.click(screen.getAllByText("详情")[0]);
  fireEvent.click(screen.getByRole("button", { name: "创建内容版本" }));
  fireEvent.change(screen.getByLabelText("消息标题"), {
    target: { value: "提现成功通知（新版）" },
  });
  fireEvent.click(screen.getByRole("button", { name: "保存新版本" }));

  const rule = getPrototypeState().rules.find((item) => item.id === "RULE-001");
  expect(rule?.status).toBe("已启用");
  expect(
    getPrototypeState().ruleVersions.some(
      (item) => item.ruleId === "RULE-001" && item.status === "草稿",
    ),
  ).toBe(true);
});
