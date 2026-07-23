import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";
import {
  createEventRule,
  getPrototypeState,
  resetPrototypeStore,
} from "../../store/prototypeStore";
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
  expect(screen.queryByText("当前内容版本")).not.toBeInTheDocument();
  expect(screen.queryByText("夏季交易赛召回")).not.toBeInTheDocument();
});

it("does not expose rule content versions", () => {
  render(
    <MemoryRouter>
      <AutomationRuleListPage />
    </MemoryRouter>,
  );

  expect(screen.queryByText("当前内容版本")).not.toBeInTheDocument();
  fireEvent.click(screen.getAllByText("详情")[0]);
  expect(screen.queryByText("内容版本", { selector: "strong" })).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "创建内容版本" }),
  ).not.toBeInTheDocument();
});

it("offers only published event templates when creating a rule", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <AutomationRuleListPage />
    </MemoryRouter>,
  );

  await user.click(screen.getByRole("button", { name: "创建通知规则" }));
  const templateField = screen
    .getByText("消息模板", { selector: "label" })
    .closest(".arco-form-item")
    ?.querySelector(".arco-select");
  expect(templateField).not.toBeNull();
  await user.click(templateField!);

  expect(screen.getByRole("option", { name: /提现成功通知/ })).toBeVisible();
  expect(screen.getByRole("option", { name: /充值到账通知/ })).toBeVisible();
  expect(
    screen.queryByRole("option", { name: /异常登录提醒/ }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("option", { name: /夏季交易赛/ }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("option", { name: /强平风险预警/ }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("option", { name: /网络维护公告/ }),
  ).not.toBeInTheDocument();
});

it("inherits content and languages from the selected template", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <AutomationRuleListPage />
    </MemoryRouter>,
  );

  await user.click(screen.getByRole("button", { name: "创建通知规则" }));

  expect(screen.getByText("消息模板", { selector: "label" })).toBeVisible();
  expect(screen.queryByText("中文标题", { selector: "label" })).not.toBeInTheDocument();
  expect(screen.queryByText("中文正文", { selector: "label" })).not.toBeInTheDocument();
  expect(screen.queryByText("目标语言", { selector: "label" })).not.toBeInTheDocument();
  expect(
    screen.getByText(/内容与语言自动继承所选事件消息模板/),
  ).toBeVisible();
});

it("switches between event and conditional triggers using event variables", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <AutomationRuleListPage />
    </MemoryRouter>,
  );

  await user.click(screen.getByRole("button", { name: "创建通知规则" }));
  const dialog = screen.getByRole("dialog", { name: "创建事件通知规则" });

  expect(within(dialog).getByText("触发方式", { selector: "label" })).toBeVisible();
  expect(
    within(dialog).queryByText("条件变量", { selector: "label" }),
  ).not.toBeInTheDocument();
  expect(
    within(dialog).queryByText("负责人", { selector: "label" }),
  ).not.toBeInTheDocument();

  const eventField = within(dialog)
    .getByText("系统事件", { selector: "label" })
    .closest(".arco-form-item")
    ?.querySelector(".arco-select");
  expect(eventField).not.toBeNull();
  await user.click(eventField!);
  await act(async () => {
    fireEvent.click(
      screen.getByRole("option", { name: /充值到账 · deposit\.credited/ }),
    );
  });

  const triggerField = within(dialog)
    .getByText("触发方式", { selector: "label" })
    .closest(".arco-form-item")
    ?.querySelector(".arco-select");
  expect(triggerField).not.toBeNull();
  await user.click(triggerField!);
  await act(async () => {
    fireEvent.click(screen.getByRole("option", { name: "条件触发" }));
  });

  expect(within(dialog).getByText("条件变量", { selector: "label" })).toBeVisible();
  expect(within(dialog).getByText("关系", { selector: "label" })).toBeVisible();
  expect(within(dialog).getByText("阈值", { selector: "label" })).toBeVisible();

  const variableField = within(dialog)
    .getByText("条件变量", { selector: "label" })
    .closest(".arco-form-item")
    ?.querySelector(".arco-select");
  expect(variableField).not.toBeNull();
  await user.click(variableField!);
  expect(screen.getByRole("option", { name: "amount" })).toBeVisible();
  expect(screen.getByRole("option", { name: "occurred_at" })).toBeVisible();
});

it("builds the condition expression and records the creator as owner", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <AutomationRuleListPage />
    </MemoryRouter>,
  );

  await user.click(screen.getByRole("button", { name: "创建通知规则" }));
  const dialog = screen.getByRole("dialog", { name: "创建事件通知规则" });
  await user.type(
    within(dialog).getByRole("textbox", { name: "规则名称" }),
    "大额充值到账通知 V2",
  );

  const chooseOption = async (
    label: string,
    option: string | RegExp,
  ) => {
    const select = within(dialog)
      .getByText(label, { selector: "label" })
      .closest(".arco-form-item")
      ?.querySelector(".arco-select");
    expect(select).not.toBeNull();
    await user.click(select!);
    await act(async () => {
      fireEvent.click(screen.getByRole("option", { name: option }));
    });
  };

  await chooseOption("系统事件", /充值到账 · deposit\.credited/);
  await chooseOption("触发方式", "条件触发");
  await chooseOption("条件变量", "amount");
  await chooseOption("关系", "大于等于（≥）");
  await user.type(
    within(dialog).getByRole("textbox", { name: "阈值" }),
    "1000",
  );
  await chooseOption("消息模板", "充值到账通知");
  await user.click(within(dialog).getByRole("button", { name: "保存草稿" }));

  await waitFor(() =>
    expect(
      screen.queryByRole("dialog", { name: "创建事件通知规则" }),
    ).not.toBeInTheDocument(),
  );
  expect(
    getPrototypeState().rules.find(
      (rule) => rule.name === "大额充值到账通知 V2",
    ),
  ).toMatchObject({
    eventId: "deposit.credited",
    conditionExpression: "amount >= 1000",
    owner: "Gary Ma",
  });
});

it("edits a draft rule in place with its existing values", async () => {
  const user = userEvent.setup();
  const template = getPrototypeState().templates.find(
    (item) => item.id === "TPL-1008",
  )!;
  const rule = createEventRule({
    name: "大额充值到账通知 V2",
    eventId: "deposit.credited",
    conditionExpression: "amount >= 1000",
    subjectMapping: "payload.user_id → UID",
    channels: ["站内信", "Push"],
    templateId: template.id,
    templateVersion: template.version,
    title: template.content!.web.title,
    body: template.content!.web.body,
    targetLocales: ["en-US", "ja-JP"],
    owner: "Gary Ma",
  });
  const ruleCount = getPrototypeState().rules.length;

  render(
    <MemoryRouter>
      <AutomationRuleListPage />
    </MemoryRouter>,
  );

  const row = screen.getByText("大额充值到账通知 V2").closest("tr")!;
  await user.click(within(row).getByRole("button", { name: "详情" }));
  await user.click(screen.getByRole("button", { name: "编辑规则" }));

  const dialog = screen.getByRole("dialog", { name: "编辑事件通知规则" });
  const nameInput = within(dialog).getByRole("textbox", { name: "规则名称" });
  expect(nameInput).toHaveValue("大额充值到账通知 V2");
  expect(within(dialog).getByText("条件变量", { selector: "label" })).toBeVisible();
  expect(within(dialog).getByRole("textbox", { name: "阈值" })).toHaveValue(
    "1000",
  );

  await user.clear(nameInput);
  await user.type(nameInput, "大额充值到账通知 V3");
  await user.click(within(dialog).getByRole("button", { name: "保存修改" }));

  await waitFor(() =>
    expect(
      screen.queryByRole("dialog", { name: "编辑事件通知规则" }),
    ).not.toBeInTheDocument(),
  );
  expect(getPrototypeState().rules).toHaveLength(ruleCount);
  expect(
    getPrototypeState().rules.find((item) => item.id === rule.id),
  ).toMatchObject({
    name: "大额充值到账通知 V3",
    conditionExpression: "amount >= 1000",
    owner: "Gary Ma",
    status: "草稿",
  });
});

it("optionally pauses any enabled rule after approval", async () => {
  const user = userEvent.setup();
  const template = getPrototypeState().templates.find(
    (item) => item.id === "TPL-1001",
  )!;
  const rule = createEventRule({
    name: "订单成交通知新版",
    eventId: "order.filled",
    conditionExpression: "filled_amount > 0",
    subjectMapping: "payload.user_id → UID",
    channels: ["站内信", "Push"],
    templateId: template.id,
    templateVersion: template.version,
    title: template.content!.web.title,
    body: template.content!.web.body,
    targetLocales: ["en-US"],
    owner: "交易运营",
  });

  render(
    <MemoryRouter>
      <AutomationRuleListPage />
    </MemoryRouter>,
  );

  const row = screen.getByText("订单成交通知新版").closest("tr")!;
  await user.click(within(row).getByRole("button", { name: "详情" }));
  await user.click(screen.getByRole("button", { name: "提交审核" }));

  await user.click(
    screen.getByRole("checkbox", { name: /提现成功自动通知/ }),
  );
  const submitButton = screen.getByRole("button", { name: "确认提审" });
  await waitFor(() => expect(submitButton).toBeEnabled());
  await user.click(submitButton);

  expect(
    getPrototypeState().rules.find((item) => item.id === rule.id),
  ).toMatchObject({
    status: "待审核",
    replacementRuleIds: ["RULE-001"],
  });
  expect(screen.getByText("审核通过后暂停规则")).toBeVisible();
  expect(screen.getByText(/提现成功自动通知 · RULE-001/)).toBeVisible();
  expect(
    screen.getByRole("button", { name: "前往审核中心" }),
  ).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "驳回规则" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /审核并/ }),
  ).not.toBeInTheDocument();
});

it("submits a rule without pausing another rule", async () => {
  const user = userEvent.setup();
  const template = getPrototypeState().templates.find(
    (item) => item.id === "TPL-1001",
  )!;
  const rule = createEventRule({
    name: "充值到账通知 V2",
    eventId: "deposit.credited",
    conditionExpression: "事件到达即触发",
    subjectMapping: "payload.user_id → UID",
    channels: ["站内信"],
    templateId: template.id,
    templateVersion: template.version,
    title: template.content!.web.title,
    body: template.content!.web.body,
    targetLocales: ["en-US"],
    owner: "资产运营",
  });

  render(
    <MemoryRouter>
      <AutomationRuleListPage />
    </MemoryRouter>,
  );

  const row = screen.getByText("充值到账通知 V2").closest("tr")!;
  await user.click(within(row).getByRole("button", { name: "详情" }));
  await user.click(screen.getByRole("button", { name: "提交审核" }));
  await user.click(screen.getByRole("button", { name: "确认提审" }));

  expect(
    getPrototypeState().rules.find((item) => item.id === rule.id),
  ).toMatchObject({
    status: "待审核",
    replacementRuleIds: [],
  });
  expect(screen.getByText("审核通过后直接启用")).toBeVisible();
});
