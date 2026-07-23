import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ApprovalCenterPage from "./ApprovalCenterPage";
import {
  createEventRule,
  getPrototypeState,
  resetPrototypeStore,
  submitEventRuleForReview,
  submitTask,
} from "../../store/prototypeStore";

it("shows object-bound Web/App inbox and Push previews in approval", async () => {
  resetPrototypeStore();
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <ApprovalCenterPage currentAdminId="admin-01" />
    </MemoryRouter>,
  );
  await user.click(screen.getAllByText("审核")[0]);
  expect(screen.getByText("Web 站内信预览")).toBeVisible();
  expect(screen.getByText("App 站内信预览")).toBeVisible();
  expect(screen.getByText("App Push 预览")).toBeVisible();
  expect(screen.getByRole("button", { name: "通过审核" })).toBeVisible();
  expect(screen.getByRole("button", { name: "驳回审核" })).toBeVisible();
  await user.click(screen.getByRole("tab", { name: "受众与合规" }));
  expect(screen.queryByText("受众样例")).not.toBeInTheDocument();
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
  resetPrototypeStore();
  const task = submitTask({
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
  const approval = getPrototypeState().approvals.find(
    (item) => item.taskId === task.id,
  )!;
  render(
    <MemoryRouter>
      <ApprovalCenterPage currentAdminId={approval.assigneeId} />
    </MemoryRouter>,
  );
  const row = screen.getByText("提现事件审批测试").closest("tr")!;
  await user.click(within(row).getByRole("button", { name: "审核" }));
  expect(screen.getByText("冻结的事件触发策略")).toBeVisible();
  expect(screen.getByText(/withdrawal\.succeeded/)).toBeVisible();
});

it("highlights rule replacement approvals and their before-after impact", async () => {
  resetPrototypeStore();
  const user = userEvent.setup();
  const template = getPrototypeState().templates.find(
    (item) => item.id === "TPL-1001",
  )!;
  const rule = createEventRule({
    name: "提现成功通知新规则",
    eventId: "withdrawal.succeeded",
    conditionExpression: "事件到达即触发",
    subjectMapping: "payload.user_id → UID",
    channels: ["站内信", "Push"],
    templateId: template.id,
    templateVersion: template.version,
    title: template.content!.web.title,
    body: template.content!.web.body,
    targetLocales: ["en-US"],
    owner: "Gary Ma",
  });
  submitEventRuleForReview(rule.id, ["RULE-001"]);
  const approval = getPrototypeState().approvals.find(
    (item) => item.ruleId === rule.id,
  )!;

  render(
    <MemoryRouter>
      <ApprovalCenterPage currentAdminId={approval.assigneeId} />
    </MemoryRouter>,
  );

  const row = screen.getByText("提现成功通知新规则").closest("tr")!;
  expect(within(row).getByText("规则交替")).toBeVisible();
  expect(within(row).getByText("启用 1 条新规则")).toBeVisible();
  expect(within(row).getByText("停用 1 条旧规则")).toBeVisible();

  await user.click(within(row).getByRole("button", { name: "审核" }));
  expect(screen.getByText("规则交替审核")).toBeVisible();
  expect(screen.getByText("当前生效规则")).toBeVisible();
  expect(screen.getByText("审核通过后启用")).toBeVisible();
  expect(screen.getByText("系统事件")).toBeVisible();
  expect(screen.getByText("主体映射")).toBeVisible();
  expect(screen.getByText("关联模板")).toBeVisible();
  expect(screen.getByText("发送渠道")).toBeVisible();
  expect(screen.queryByText("去重键")).not.toBeInTheDocument();
  expect(screen.queryByText("事件有效期")).not.toBeInTheDocument();
  expect(screen.queryByText("重试策略")).not.toBeInTheDocument();
  expect(screen.queryByText("变量映射")).not.toBeInTheDocument();
  expect(screen.queryByText("通过后暂停规则")).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "确认交替并通过" }),
  ).toBeVisible();
});
