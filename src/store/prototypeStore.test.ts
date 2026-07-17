import { beforeEach, describe, expect, it } from "vitest";
import {
  approveTranslation,
  approveOrdinaryTranslation,
  approveSpecialReview,
  addOperatorTestAccount,
  advanceRuleContentVersion,
  createRuleContentVersion,
  createTranslationBatch,
  getPrototypeState,
  markMessageRead,
  getOperatorTestAccounts,
  normalizeTranslationBatches,
  normalizeRuleContentVersions,
  performManualTaskOperation,
  publishRuleContentVersion,
  rejectTranslation,
  resetPrototypeStore,
  removeOperatorTestAccount,
  retryTranslation,
  sendTemplateTest,
  submitTask,
  reviewApproval,
  saveTaskDraft,
  submitTemplateForApproval,
  testSystemEvent,
  updateLanguageReviewPolicy,
  updateOperatorTestAccount,
} from "./prototypeStore";
import { translationBatches as legacyTranslationBatches } from "../mocks/data";

describe("prototype store workflow transitions", () => {
  beforeEach(() => resetPrototypeStore());

  it("persists a single message read transition", () => {
    markMessageRead("UM-1001");
    expect(
      getPrototypeState().messages.find((item) => item.id === "UM-1001")?.read,
    ).toBe(true);
  });

  it("limits each operator to four unique test accounts", () => {
    for (let index = 1; index <= 4; index += 1) {
      addOperatorTestAccount({
        operatorId: "operator-limit",
        uid: `UID-LIMIT-${index}`,
        remark: `设备 ${index}`,
      });
    }

    expect(getOperatorTestAccounts("operator-limit")).toHaveLength(4);
    expect(() =>
      addOperatorTestAccount({
        operatorId: "operator-limit",
        uid: "UID-LIMIT-5",
        remark: "第 5 个设备",
      }),
    ).toThrow("每名操作者最多配置 4 个测试账号");
  });

  it("rejects duplicate test UIDs for the same operator", () => {
    addOperatorTestAccount({
      operatorId: "operator-duplicate",
      uid: "UID-DUPLICATE",
      remark: "主设备",
    });

    expect(() =>
      addOperatorTestAccount({
        operatorId: "operator-duplicate",
        uid: " UID-DUPLICATE ",
        remark: "重复设备",
      }),
    ).toThrow("该 UID 已在你的测试账号中");
  });

  it("prevents operators from changing another operator's test account", () => {
    const account = addOperatorTestAccount({
      operatorId: "operator-owner",
      uid: "UID-OWNER",
      remark: "本人设备",
    });

    expect(() =>
      updateOperatorTestAccount(account.id, "operator-other", {
        remark: "越权修改",
      }),
    ).toThrow("无权修改该测试账号");
    expect(() =>
      removeOperatorTestAccount(account.id, "operator-other"),
    ).toThrow("无权删除该测试账号");
  });

  it("automatically sends to all test accounts owned by the operator", () => {
    addOperatorTestAccount({
      operatorId: "operator-send",
      uid: "UID-SEND-1",
      remark: "iPhone",
    });
    addOperatorTestAccount({
      operatorId: "operator-send",
      uid: "UID-SEND-2",
      remark: "Android",
    });
    addOperatorTestAccount({
      operatorId: "operator-other",
      uid: "UID-OTHER",
      remark: "其他人的设备",
    });

    const result = sendTemplateTest({
      operatorId: "operator-send",
      channels: ["站内信", "Push"],
      variables: { user_nickname: "Test User" },
      content: {
        sourceLocale: "zh-CN",
        locales: ["zh-CN"],
        web: { title: "测试", summary: "摘要", body: "正文" },
        push: {
          title: "Push 测试",
          body: "Push 正文",
          platform: "全部设备",
          priority: "高",
        },
      },
    });

    expect(result.recipientUids).toEqual(["UID-SEND-1", "UID-SEND-2"]);
    expect(result).toMatchObject({
      accountCount: 2,
      channelCount: 2,
      totalDeliveries: 4,
    });
  });

  it("creates an external translation batch and opens human review", () => {
    const batch = createTranslationBatch({
      templateId: "TPL-1001",
      targetLocales: ["fr-FR"],
      createdBy: "Gary Ma",
    });
    expect(batch.items[0].externalTaskId).toMatch(/^EXT-MT-/);
    expect(batch.status).toBe("翻译返回待审核");
    expect(batch.items[0].status).toBe("翻译返回待审核");
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
    ).toBe("已通过");
  });

  it("routes generalized translation items by language review policy", () => {
    const batch = createTranslationBatch({
      subject: {
        type: "manual_task_content",
        id: "TASK-DRAFT-1",
        name: "临时风险消息",
        version: "draft-1",
        returnPath: "/tasks/create",
      },
      sourceLocale: "zh-CN",
      sourceContent: {
        title: "风险提示",
        summary: "请及时查看",
        body: "请核对账户状态。",
      },
      targetLocales: ["en-US", "ja-JP"],
      createdBy: "Gary Ma",
    });

    expect(batch.items.find((item) => item.targetLocale === "en-US")?.status)
      .toBe("翻译返回待审核");
    expect(batch.items.find((item) => item.targetLocale === "ja-JP")?.status)
      .toBe("翻译返回待审核");
    expect(
      batch.items.find((item) => item.targetLocale === "ja-JP")
        ?.specialReviewRequired,
    ).toBe(true);
    expect(batch.subjectType).toBe("manual_task_content");
  });

  it("keeps ordinary confirmation and special review as separate operations", () => {
    const batch = createTranslationBatch({
      subject: {
        type: "rule_content_version",
        id: "RV-TEST",
        name: "提现成功自动通知",
        version: "v2",
        returnPath: "/automation",
      },
      sourceLocale: "zh-CN",
      sourceContent: { title: "提现成功", body: "您的提现已到账。" },
      targetLocales: ["en-US", "ja-JP"],
      createdBy: "operator-01",
    });
    const english = batch.items.find((item) => item.targetLocale === "en-US")!;
    const japanese = batch.items.find((item) => item.targetLocale === "ja-JP")!;

    expect(() =>
      approveOrdinaryTranslation(japanese.id, {
        title: "出金完了",
        summary: "",
        body: "出金が完了しました。",
        reviewer: "reviewer-02",
      }),
    ).toThrow("该语言必须进入小语种专审");

    approveOrdinaryTranslation(english.id, {
      title: "Withdrawal completed",
      summary: "",
      body: "Your withdrawal is complete.",
      reviewer: "operator-01",
    });
    approveSpecialReview(japanese.id, {
      title: "出金完了",
      summary: "",
      body: "出金が完了しました。",
      reviewer: "jp-reviewer-02",
    });

    expect(
      getPrototypeState().translationBatches.find((item) => item.id === batch.id),
    ).toMatchObject({ status: "已通过" });
  });

  it("keeps rejected results reviewable and retries missing results without transition states", () => {
    const batch = createTranslationBatch({
      templateId: "TPL-1001",
      targetLocales: ["fr-FR"],
      createdBy: "Gary Ma",
    });
    const itemId = batch.items[0].id;

    rejectTranslation(itemId, "术语不准确");
    expect(
      getPrototypeState().translationBatches
        .flatMap((item) => item.items)
        .find((item) => item.id === itemId),
    ).toMatchObject({
      status: "翻译返回待审核",
      errorMessage: "术语不准确",
    });

    retryTranslation(itemId);
    expect(
      getPrototypeState().translationBatches
        .flatMap((item) => item.items)
        .find((item) => item.id === itemId),
    ).toMatchObject({
      status: "翻译返回待审核",
      errorMessage: undefined,
    });
  });

  it("updates the special-language review policy", () => {
    updateLanguageReviewPolicy("fr-FR", {
      specialReviewRequired: true,
      reviewGroup: "法语专项审核组",
      reviewSlaHours: 8,
    });

    expect(
      getPrototypeState().languageReviewPolicies.find(
        (policy) => policy.localeCode === "fr-FR",
      ),
    ).toMatchObject({
      specialReviewRequired: true,
      reviewGroup: "法语专项审核组",
      reviewSlaHours: 8,
    });
  });

  it("hydrates template workflow scopes for current and legacy data", () => {
    const scopes = Object.fromEntries(
      getPrototypeState().templates.map((template) => [
        template.id,
        template.usageScope,
      ]),
    );

    expect(scopes).toMatchObject({
      "TPL-1001": "event",
      "TPL-1003": "shared",
      "TPL-1004": "manual",
    });
    expect(Object.values(scopes).every(Boolean)).toBe(true);
  });

  it("hydrates special-review routing when migrating legacy translation batches", () => {
    const migrated = normalizeTranslationBatches(
      legacyTranslationBatches,
      getPrototypeState().languageReviewPolicies,
      getPrototypeState().templates,
    );

    expect(
      migrated
        .flatMap((batch) => batch.items)
        .find((item) => item.targetLocale === "tr-TR"),
    ).toMatchObject({
      specialReviewRequired: true,
      reviewGroup: "小语种专项审核组",
      status: "翻译返回待审核",
    });
  });

  it("infers legacy temporary-message batches from hidden temporary templates", () => {
    const current = getPrototypeState();
    const temporaryTemplate = {
      ...current.templates[0],
      id: "TPL-TEMP-LEGACY",
      name: "临时消息 · 旧任务",
      owner: "临时任务",
    };
    const legacyBatch = {
      ...legacyTranslationBatches[0],
      templateId: temporaryTemplate.id,
      items: legacyTranslationBatches[0].items.map((item) => ({
        ...item,
        templateId: temporaryTemplate.id,
        templateName: temporaryTemplate.name,
      })),
    };

    const migrated = normalizeTranslationBatches(
      [legacyBatch],
      current.languageReviewPolicies,
      [...current.templates, temporaryTemplate],
    )[0];

    expect(migrated).toMatchObject({
      subjectType: "manual_task_content",
      returnPath: "/tasks/create",
    });
    expect(
      migrated.items.every(
        (item) => item.subjectType === "manual_task_content",
      ),
    ).toBe(true);
  });

  it("restores translation batch links on legacy rule content versions", () => {
    const current = getPrototypeState();
    const legacyVersions = current.ruleVersions.map((version) => ({
      ...version,
      translationBatchId: undefined,
    }));

    expect(
      normalizeRuleContentVersions(legacyVersions, current.templates)[0]
        .translationBatchId,
    ).toMatch(/^MT-/);
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
