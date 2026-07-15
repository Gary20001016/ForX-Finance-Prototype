import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ApprovalCenterPage from "./ApprovalCenterPage";
import { submitTask } from "../../store/prototypeStore";

it("shows object-bound Web/App inbox and Push previews in approval", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <ApprovalCenterPage currentAdminId="reviewer-02" />
    </MemoryRouter>,
  );
  await user.click(screen.getAllByText("审核")[0]);
  expect(screen.getByText("Web 站内信预览")).toBeVisible();
  expect(screen.getByText("App 站内信预览")).toBeVisible();
  expect(screen.getByText("App Push 预览")).toBeVisible();
  expect(screen.getByRole("button", { name: "通过审核" })).toBeVisible();
  expect(screen.getByRole("button", { name: "驳回审核" })).toBeVisible();
  await user.click(screen.getByRole("tab", { name: "受众与合规" }));
  expect(screen.getByText("受众样例")).toBeVisible();
});

it("shows the frozen event policy in approval details", async () => {
  const user = userEvent.setup();
  const variables = [
    "user_nickname",
    "amount",
    "currency",
    "symbol",
    "occurred_at",
  ];
  submitTask({
    name: "提现事件审批测试",
    triggerType: "event",
    category: "资产通知",
    nature: "强事务",
    risk: "关键",
    contentMode: "template",
    template: "withdraw_success v12",
    templateId: "TPL-1001",
    templateVersion: "v12",
    channels: ["站内信", "Push"],
    audience: "事件主体用户",
    audienceCount: 1,
    schedule: "事件到达时",
    creator: "事件配置员",
    team: "资金平台",
    eventConfig: {
      eventId: "withdrawal.succeeded",
      eventVersion: "1.0.0",
      conditionExpression: "",
      dedupeKey: "{{ event_id }}:{{ user_id }}",
      eventTtlSeconds: 300,
      maxRetries: 3,
      retryBackoffSeconds: 30,
      variableMappings: variables.map((variable) => ({
        eventField: variable,
        templateVariable: variable,
        required: true,
      })),
    },
  });
  render(
    <MemoryRouter>
      <ApprovalCenterPage currentAdminId="reviewer-02" />
    </MemoryRouter>,
  );
  await user.click(screen.getAllByText("审核")[0]);
  expect(screen.getByText("冻结的事件触发策略")).toBeVisible();
  expect(screen.getByText(/withdrawal\.succeeded/)).toBeVisible();
});
