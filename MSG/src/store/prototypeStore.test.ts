import { beforeEach, describe, expect, it } from "vitest";
import {
  approveTranslation,
  advanceRuleContentVersion,
  createRuleContentVersion,
  createTranslationBatch,
  getPrototypeState,
  markMessageRead,
  performManualTaskOperation,
  publishRuleContentVersion,
  resetPrototypeStore,
  submitTask,
  reviewApproval,
  saveTaskDraft,
  submitTemplateForApproval,
  testSystemEvent,
} from "./prototypeStore";

describe("prototype store workflow transitions", () => {
  beforeEach(() => resetPrototypeStore());

  it("persists a single message read transition", () => {
    markMessageRead("UM-1001");
    expect(
      getPrototypeState().messages.find((item) => item.id === "UM-1001")?.read,
    ).toBe(true);
  });

  it("creates an external translation batch and opens human review", () => {
    const batch = createTranslationBatch({
      templateId: "TPL-1001",
      targetLocales: ["fr-FR"],
      createdBy: "Gary Ma",
    });
    expect(batch.items[0].externalTaskId).toMatch(/^EXT-MT-/);
    expect(batch.items[0].status).toBe("待人工审核");
  });

  it("opens the publishing gate after every locale is approved", () => {
    const batch = createTranslationBatch({
      templateId: "TPL-1001",
      targetLocales: ["fr-FR"],
      createdBy: "Gary Ma",
    });
    approveTranslation(batch.items[0].id, {
      title: "Retrait réussi",
      summary: "Le retrait est arrivé.",
      body: "Votre retrait est arrivé.",
      reviewer: "Gary Ma",
    });
    expect(
      getPrototypeState().translationBatches.find(
        (item) => item.id === batch.id,
      )?.status,
    ).toBe("全部审核通过");
  });

  it("submits a task and creates a linked approval object", () => {
    const task = submitTask({
      name: "临时风险消息",
      category: "风控通知",
      nature: "事务",
      risk: "关键",
      contentMode: "temporary",
      template: "临时消息 v1",
      channels: ["站内信", "Push"],
      audience: "全部有效用户",
      audienceCount: 120,
      schedule: "立即",
      creator: "Gary Ma",
      team: "风险控制",
      content: {
        sourceLocale: "zh-CN",
        locales: ["zh-CN"],
        web: {
          title: "风险提示",
          summary: "请立即处理",
          body: "账户存在风险。",
        },
        push: {
          title: "风险提示",
          body: "请立即处理",
          deepLink: "forxfinance://security/devices",
          priority: "高",
          platform: "全部设备",
        },
      },
    });
    const approval = getPrototypeState().approvals.find(
      (item) => item.taskId === task.id,
    );
    expect(task.status).toBe("待审核");
    expect(task.approvalStatus).toBe("审核中");
    expect(task.deliveryResult).toBe("未开始");
    expect(approval?.name).toBe("临时风险消息");
  });

  it("records an approval decision and updates the linked task", () => {
    reviewApproval("APR-8812", {
      decision: "approve",
      reviewer: "Gary Ma",
      opinion: "内容已核对",
    });
    expect(
      getPrototypeState().approvals.find((item) => item.id === "APR-8812")
        ?.status,
    ).toBe("已通过");
    expect(
      getPrototypeState().tasks.find((item) => item.name === "夏季交易赛召回")
        ?.status,
    ).toBe("待发送");
    expect(
      getPrototypeState().tasks.find((item) => item.name === "夏季交易赛召回")
        ?.approvalStatus,
    ).toBe("通过");
  });

  it("starts an immediate artificial task when its approval passes", () => {
    const task = submitTask({
      name: "立即安全通知",
      category: "安全通知",
      nature: "事务",
      risk: "中",
      template: "security_notice v1",
      channels: ["站内信"],
      audience: "指定用户",
      audienceCount: 1,
      schedule: "立即",
      creator: "Gary Ma",
      team: "安全中心",
    });
    const approval = getPrototypeState().approvals.find(
      (item) => item.taskId === task.id,
    )!;

    reviewApproval(approval.id, {
      decision: "approve",
      reviewer: "Reviewer 02",
      opinion: "通过",
    });

    const approvedTask = getPrototypeState().tasks.find(
      (item) => item.id === task.id,
    );
    expect(approvedTask?.status).toBe("发送中");
    expect(approvedTask?.approvalStatus).toBe("通过");
    expect(approvedTask?.deliveryResult).toBe("处理中");
  });

  it("moves a rejected artificial task to modification instead of an approval result state", () => {
    reviewApproval("APR-8812", {
      decision: "reject",
      reviewer: "Reviewer 02",
      opinion: "需要修改受众",
    });

    const task = getPrototypeState().tasks.find(
      (item) => item.name === "夏季交易赛召回",
    );
    expect(task?.status).toBe("待修改");
    expect(task?.approvalStatus).toBe("驳回");
    expect(task?.deliveryResult).toBe("未开始");
  });

  it("applies standardized artificial task operations", () => {
    performManualTaskOperation("MSG-260712-002", "撤回审核");
    expect(
      getPrototypeState().tasks.find((item) => item.id === "MSG-260712-002"),
    ).toMatchObject({ status: "草稿", approvalStatus: "已撤回" });

    const task = submitTask({
      name: "发送控制测试",
      category: "系统公告",
      nature: "事务",
      risk: "中",
      template: "notice v1",
      channels: ["站内信"],
      audience: "指定用户",
      audienceCount: 1,
      schedule: "立即",
      creator: "Gary Ma",
      team: "消息运营",
    });
    const approval = getPrototypeState().approvals.find(
      (item) => item.taskId === task.id,
    )!;
    reviewApproval(approval.id, {
      decision: "approve",
      reviewer: "Reviewer 02",
      opinion: "通过",
    });

    performManualTaskOperation(task.id, "暂停发送");
    expect(
      getPrototypeState().tasks.find((item) => item.id === task.id),
    ).toMatchObject({ status: "已暂停", deliveryResult: "处理中" });

    performManualTaskOperation(task.id, "恢复发送");
    expect(
      getPrototypeState().tasks.find((item) => item.id === task.id),
    ).toMatchObject({ status: "发送中", deliveryResult: "处理中" });

    performManualTaskOperation("MSG-260712-003", "取消任务");
    expect(
      getPrototypeState().tasks.find((item) => item.id === "MSG-260712-003"),
    ).toMatchObject({ status: "已取消", approvalStatus: "已终止" });
  });

  it("keeps failed delivery as a result of a completed artificial task", () => {
    expect(
      getPrototypeState().tasks.find((item) => item.id === "MSG-260712-008"),
    ).toMatchObject({
      status: "已完成",
      approvalStatus: "通过",
      deliveryResult: "失败",
    });
  });

  it("publishes a template only after business approval", () => {
    const approval = submitTemplateForApproval("TPL-1001");
    expect(
      getPrototypeState().templates.find((item) => item.id === "TPL-1001")
        ?.status,
    ).toBe("待业务审核");
    reviewApproval(approval.id, {
      decision: "approve",
      reviewer: "Reviewer 02",
      opinion: "内容与变量已核对",
    });
    expect(
      getPrototypeState().templates.find((item) => item.id === "TPL-1001")
        ?.status,
    ).toBe("已发布");
  });

  it("withdraws the old approval when an existing task is edited back to draft", () => {
    const current = getPrototypeState().tasks.find(
      (item) => item.name === "夏季交易赛召回",
    )!;
    saveTaskDraft(
      {
        name: current.name,
        category: current.category,
        nature: current.nature,
        risk: current.risk,
        template: current.template,
        channels: current.channels,
        audience: current.audience,
        audienceCount: current.audienceCount,
        schedule: current.schedule,
        creator: current.creator,
        team: current.team,
        contentMode: current.contentMode,
        content: current.content,
      },
      current.id,
    );
    expect(
      getPrototypeState().tasks.find((item) => item.id === current.id)?.status,
    ).toBe("草稿");
    expect(
      getPrototypeState().approvals.find((item) => item.id === "APR-8812")
        ?.status,
    ).toBe("已撤回");
  });

  it("stores event trigger configuration and enables the task after approval", () => {
    const variableMappings = [
      "user_nickname",
      "amount",
      "currency",
      "symbol",
      "occurred_at",
    ].map((variable) => ({
      eventField: variable,
      templateVariable: variable,
      required: true,
    }));
    const task = submitTask({
      name: "提现成功通知规则",
      triggerType: "event",
      category: "资产通知",
      nature: "强事务",
      risk: "关键",
      template: "withdraw_success v12",
      templateId: "TPL-1001",
      templateVersion: "v12",
      channels: ["站内信", "Push"],
      audience: "事件主体用户",
      audienceCount: 1,
      schedule: "事件到达时",
      creator: "Gary Ma",
      team: "资金平台",
      eventConfig: {
        eventId: "withdrawal.succeeded",
        eventVersion: "1.0.0",
        conditionExpression: "",
        dedupeKey: "{{ event_id }}:{{ user_id }}",
        eventTtlSeconds: 300,
        maxRetries: 3,
        retryBackoffSeconds: 30,
        variableMappings,
      },
    });
    const approval = getPrototypeState().approvals.find(
      (item) => item.taskId === task.id,
    )!;
    reviewApproval(approval.id, {
      decision: "approve",
      reviewer: "Reviewer 02",
      opinion: "通过",
    });
    expect(
      getPrototypeState().tasks.find((item) => item.id === task.id)?.status,
    ).toBe("已启用");
    expect(
      getPrototypeState().approvals.find((item) => item.id === approval.id)
        ?.eventConfig?.eventId,
    ).toBe("withdrawal.succeeded");
  });

  it("publishes a new rule content version atomically while the rule stays enabled", () => {
    const rule = getPrototypeState().rules.find(
      (item) => item.eventId === "withdrawal.succeeded",
    )!;
    const oldVersionId = rule.currentVersionId;
    const version = createRuleContentVersion(rule.id);

    advanceRuleContentVersion(version.id, "提交机翻");
    advanceRuleContentVersion(version.id, "机翻完成");
    advanceRuleContentVersion(version.id, "人工审核通过");
    advanceRuleContentVersion(version.id, "通过审核");
    publishRuleContentVersion(version.id);

    const current = getPrototypeState();
    expect(current.rules.find((item) => item.id === rule.id)).toMatchObject({
      status: "已启用",
      currentVersionId: version.id,
    });
    expect(
      current.ruleVersions.find((item) => item.id === oldVersionId)?.status,
    ).toBe("已替换");
    expect(
      current.ruleVersions.find((item) => item.id === version.id)?.status,
    ).toBe("当前生效");
  });

  it("generates a trigger and linked deliveries through an enabled rule", () => {
    const result = testSystemEvent("withdrawal.succeeded", "EVT-TEST-001");
    expect(result.ok).toBe(true);
    expect(result.ruleId).toBeTruthy();
    expect(result.triggerId).toBeTruthy();
    expect(getPrototypeState().triggerRecords[0]).toMatchObject({
      id: result.triggerId,
      eventId: "withdrawal.succeeded",
      eventInstanceId: "EVT-TEST-001",
      status: "已完成",
    });
    expect(getPrototypeState().deliveries[0].triggerId).toBe(result.triggerId);
    expect(getPrototypeState().deliveries[0].eventCode).toBe(
      "withdrawal.succeeded",
    );
  });

  it("blocks a test event without an enabled task", () => {
    expect(testSystemEvent("trial_fund.credited")).toEqual({
      ok: false,
      reason: "没有已启用的事件通知规则",
    });
  });
});
