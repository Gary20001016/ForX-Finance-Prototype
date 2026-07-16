import { useSyncExternalStore } from "react";
import type {
  ApprovalItem,
  Channel,
  DeliveryRecord,
  EventNotificationRule,
  EventRuleOperation,
  EventTaskValidationResult,
  EventTestResult,
  EventTriggerConfig,
  LanguageReviewPolicy,
  LinkAllowlistEntry,
  LocalizedMessageContent,
  ManualTaskApprovalStatus,
  ManualTaskDeliveryResult,
  ManualTaskOperation,
  ManualTaskStatus,
  MessageCategory,
  MessageTask,
  MessageTemplate,
  OperatorTestAccount,
  RuleContentVersion,
  RuleContentVersionOperation,
  SystemEventDefinition,
  TriggerRecord,
  TranslationBatch,
  TranslationContentLayer,
  TranslationSubjectType,
  TemplateTestSendResult,
  UserMessage,
} from "../domain/types";
import {
  approvals,
  deliveries,
  messageCategories,
  operatorTestAccounts,
  tasks,
  templates,
  translationBatches,
  userMessages,
} from "../mocks/data";
import {
  getManualTaskOperations,
  isManualTaskStatus,
  transitionManualTask,
} from "../pages/tasks/taskLifecycle";
import {
  nextEventRuleStatus,
  nextRuleVersionStatus,
  ruleEventIdempotencyKey,
} from "../pages/automation/automationLifecycle";
import { normalizeTemplateUsageScopes } from "../pages/templates/templateScope";
import {
  APPROVED_MANUAL_TEMPLATE_LOCK_MESSAGE,
  isApprovedManualTemplateLocked,
} from "../domain/templatePolicy";

export interface PrototypeState {
  messages: UserMessage[];
  categories: MessageCategory[];
  tasks: MessageTask[];
  templates: MessageTemplate[];
  translationBatches: TranslationBatch[];
  languageReviewPolicies: LanguageReviewPolicy[];
  approvals: ApprovalItem[];
  deliveries: DeliveryRecord[];
  allowlist: LinkAllowlistEntry[];
  testAccounts: OperatorTestAccount[];
  events: SystemEventDefinition[];
  rules: EventNotificationRule[];
  ruleVersions: RuleContentVersion[];
  triggerRecords: TriggerRecord[];
}

const languageReviewPolicySeed: LanguageReviewPolicy[] = [
  ["en-US", "英语", false, undefined, 1, true, 8, "提醒"],
  ["zh-TW", "繁体中文", false, undefined, 1, true, 8, "提醒"],
  ["fr-FR", "法语", false, undefined, 1, true, 12, "提醒"],
  ["es-ES", "西班牙语", false, undefined, 1, true, 12, "提醒"],
  ["ja-JP", "日语", true, "日韩专项审核组", 2, false, 8, "阻断发布"],
  ["ko-KR", "韩语", true, "日韩专项审核组", 2, false, 8, "阻断发布"],
  ["tr-TR", "土耳其语", true, "小语种专项审核组", 1, false, 12, "升级"],
  ["ru-RU", "俄语", true, "小语种专项审核组", 1, false, 12, "升级"],
].map(
  ([localeCode, localeName, specialReviewRequired, reviewGroup, reviewerCount, allowSubmitterReview, reviewSlaHours, timeoutAction]) => ({
    localeCode: localeCode as string,
    localeName: localeName as string,
    specialReviewRequired: specialReviewRequired as boolean,
    reviewGroup: reviewGroup as string | undefined,
    reviewerCount: reviewerCount as 1 | 2,
    allowSubmitterReview: allowSubmitterReview as boolean,
    reviewSlaHours: reviewSlaHours as number,
    timeoutAction: timeoutAction as LanguageReviewPolicy["timeoutAction"],
    enabled: true,
  }),
);

export const normalizeTranslationBatches = (
  batches: TranslationBatch[],
  policies: LanguageReviewPolicy[],
  availableTemplates: MessageTemplate[],
): TranslationBatch[] =>
  JSON.parse(JSON.stringify(batches)).map((batch: TranslationBatch) => {
    const subjectTemplate = availableTemplates.find(
      (template) => template.id === batch.templateId,
    );
    const subjectType: TranslationSubjectType =
      batch.subjectType ||
      (subjectTemplate?.owner === "临时任务"
        ? "manual_task_content"
        : "template_version");

    return {
      ...batch,
      subjectType,
      subjectId: batch.subjectId || batch.templateId,
      subjectName: batch.subjectName || subjectTemplate?.name || batch.templateId,
      contentVersion: batch.contentVersion || batch.templateVersion,
      returnPath:
        batch.returnPath ||
        (subjectType === "manual_task_content" ? "/tasks/create" : "/templates"),
      items: batch.items.map((item) => {
      const policy = policies.find(
        (candidate) => candidate.localeCode === item.targetLocale,
      );
      return {
        ...item,
        status:
          item.status === "审核通过"
            ? "已通过"
            : item.status === "待人工审核"
              ? policy?.specialReviewRequired
                ? "待小语种专审"
                : "待普通确认"
              : item.status,
        subjectType: item.subjectType || batch.subjectType || subjectType,
        subjectId: item.subjectId || batch.subjectId || batch.templateId,
        subjectName: item.subjectName || batch.subjectName || item.templateName,
        specialReviewRequired: policy?.specialReviewRequired || false,
        reviewGroup: policy?.reviewGroup,
        reviewSlaHours: policy?.reviewSlaHours,
      };
      }),
    };
  });

export const normalizeRuleContentVersions = (
  versions: RuleContentVersion[],
  availableTemplates: MessageTemplate[],
): RuleContentVersion[] =>
  versions.map((version) => ({
    ...version,
    translationBatchId:
      version.translationBatchId ||
      availableTemplates.find((template) => template.id === version.templateId)
        ?.translationBatchId,
  }));

const STORAGE_KEY = "forx-finance-message-center-prototype-v1";
const listeners = new Set<() => void>();

const contentFor = (
  title: string,
  category = "消息通知",
): LocalizedMessageContent => ({
  sourceLocale: "zh-CN",
  locales: ["zh-CN", "en-US"],
  web: {
    title,
    summary: `${category}：请查看最新消息详情。`,
    body: `尊敬的 {{ user_nickname }}，${title}。相关金额、币种、交易对与时间信息请以账户记录为准。`,
    riskCopy:
      category.includes("风控") || title.includes("风险")
        ? "市场波动较大，请立即核对账户与仓位。"
        : undefined,
    actionText: "查看详情",
    targetUrl: "forxfinance://security/devices",
  },
  push: {
    title,
    body: `${category}：请立即查看。`,
    deepLink: "forxfinance://security/devices",
    platform: "全部设备",
    priority: title.includes("风险") ? "紧急" : "高",
    collapseKey: `message-${title.slice(0, 8)}`,
  },
});

const allowlistSeed: LinkAllowlistEntry[] = [
  {
    id: "LINK-001",
    name: "提现详情",
    type: "Deep Link",
    pattern: "forxfinance://wallet/withdrawal/:id",
    platforms: ["iOS", "Android"],
    parameterRule: "id 为字母数字，最长 64 位",
    effectiveAt: "2026-01-01 00:00",
    expiresAt: "2027-12-31 23:59",
    status: "启用",
    owner: "资金平台",
  },
  {
    id: "LINK-002",
    name: "设备管理",
    type: "Deep Link",
    pattern: "forxfinance://security/devices",
    platforms: ["iOS", "Android"],
    parameterRule: "不允许额外参数",
    effectiveAt: "2026-01-01 00:00",
    expiresAt: "长期",
    status: "启用",
    owner: "安全中心",
  },
  {
    id: "LINK-003",
    name: "公告详情",
    type: "Web URL",
    pattern: "https://www.forxfinance.example/announcements/*",
    platforms: ["Web", "iOS", "Android"],
    parameterRule: "仅允许公告数字 ID",
    effectiveAt: "2026-01-01 00:00",
    expiresAt: "2027-12-31 23:59",
    status: "启用",
    owner: "内容运营",
  },
];

const eventSeed: SystemEventDefinition[] = [
  ["deposit.credited", "充值到账", "资产", "wallet-gateway"],
  ["withdrawal.succeeded", "提现成功", "资产", "withdrawal-service"],
  ["withdrawal.failed", "提现失败", "资产", "withdrawal-service"],
  ["order.filled", "订单成交", "交易", "order-service"],
  ["liquidation.warning", "合约强平预警", "风控", "futures-risk"],
  ["trial_fund.credited", "体验金到账", "奖励", "reward-service"],
  ["points.credited", "积分到账", "奖励", "loyalty-service"],
  ["commission.credited", "返佣到账", "奖励", "broker-service"],
].map(([id, name, line, caller], index) => ({
  id,
  name,
  line,
  version: "1.0.0",
  caller,
  calls: index === 3 ? "1.28M" : `${12 + index * 6}.4K`,
  failure: index === 4 ? "1.84%" : "0.04%",
  last: "18:06:31",
  status: index === 4 ? "轻微延迟" : "运行正常",
  variables: ["user_nickname", "amount", "currency", "symbol", "occurred_at"],
  description: `${name}业务事件，由 ${caller} 推送。`,
}));

const createAutomationSeed = (seededTemplates: MessageTemplate[]) => {
  const definitions = [
    {
      id: "RULE-001",
      name: "提现成功自动通知",
      eventId: "withdrawal.succeeded",
      templateCode: "withdraw_success",
      conditionExpression: "事件到达即触发",
      status: "已启用" as const,
      channels: ["站内信", "Push"] as EventNotificationRule["channels"],
      owner: "资产运营",
      count: 18420,
      successRate: 99.96,
    },
    {
      id: "RULE-002",
      name: "合约强平风险预警",
      eventId: "liquidation.warning",
      templateCode: "liquidation_warning",
      conditionExpression: "margin_rate < 0.2",
      status: "已启用" as const,
      channels: ["站内信", "Push"] as EventNotificationRule["channels"],
      owner: "合约风控",
      count: 7620,
      successRate: 96.4,
    },
    {
      id: "RULE-003",
      name: "订单成交站内通知",
      eventId: "order.filled",
      templateCode: "order_filled",
      conditionExpression: "filled_amount > 0",
      status: "已停用" as const,
      channels: ["站内信"] as EventNotificationRule["channels"],
      owner: "交易运营",
      count: 1280000,
      successRate: 99.8,
    },
  ];
  const rules: EventNotificationRule[] = [];
  const versions: RuleContentVersion[] = [];
  for (const [index, item] of definitions.entries()) {
    const event = eventSeed.find((candidate) => candidate.id === item.eventId)!;
    const template =
      seededTemplates.find((candidate) => candidate.code === item.templateCode) ||
      seededTemplates[index];
    const versionId = `RV-${String(index + 1).padStart(3, "0")}`;
    rules.push({
      id: item.id,
      name: item.name,
      eventId: item.eventId,
      eventVersion: event.version,
      conditionExpression: item.conditionExpression,
      subjectMapping: "payload.user_id → UID",
      status: item.status,
      currentVersionId: versionId,
      channels: item.channels,
      dedupeKey: "{{ rule_id }}:{{ event_instance_id }}",
      frequencyCap: "同一事件实例仅一次",
      eventTtlSeconds: 300,
      maxRetries: 3,
      retryBackoffSeconds: 30,
      owner: item.owner,
      createdAt: "2026-06-18 10:30",
      updatedAt: "07-14 18:06",
      triggerCount24h: item.count,
      successRate: item.successRate,
    });
    versions.push({
      id: versionId,
      ruleId: item.id,
      version: `V${index + 4}`,
      templateId: template?.id || `TPL-AUTO-${index + 1}`,
      templateVersion: template?.version || "v1",
      status: "当前生效",
      sourceLocale: "zh-CN",
      targetLocales: template?.locales || ["zh-CN", "en-US"],
      translationBatchId: template?.translationBatchId,
      title: template?.content?.web.title || item.name,
      body: template?.content?.web.body || `${item.name}，请查看消息详情。`,
      createdBy: item.owner,
      createdAt: "2026-07-12 14:20",
      activatedAt: "2026-07-13 09:00",
    });
  }
  const triggerRecords: TriggerRecord[] = [
    {
      id: "TRG-260714-001",
      eventInstanceId: "EVT-WD-884201",
      eventId: "withdrawal.succeeded",
      ruleId: "RULE-001",
      ruleVersion: "R12",
      contentVersionId: "RV-001",
      templateVersion: versions[0]?.templateVersion || "v1",
      idempotencyKey: ruleEventIdempotencyKey("RULE-001", "EVT-WD-884201"),
      user: "UID 82***19",
      status: "已完成",
      receivedAt: "18:05:31.102",
      completedAt: "18:05:31.408",
      channelTotal: 2,
      successCount: 2,
      failureCount: 0,
    },
    {
      id: "TRG-260714-002",
      eventInstanceId: "EVT-LQ-302188",
      eventId: "liquidation.warning",
      ruleId: "RULE-002",
      ruleVersion: "R21",
      contentVersionId: "RV-002",
      templateVersion: versions[1]?.templateVersion || "v1",
      idempotencyKey: ruleEventIdempotencyKey("RULE-002", "EVT-LQ-302188"),
      user: "UID 51***02",
      status: "部分失败",
      receivedAt: "18:04:18.541",
      completedAt: "18:04:19.226",
      channelTotal: 2,
      successCount: 1,
      failureCount: 1,
      reason: "FCM_TEMP_UNAVAILABLE，Push 已进入退避重试",
    },
    {
      id: "TRG-260714-003",
      eventInstanceId: "EVT-LQ-302187",
      eventId: "liquidation.warning",
      ruleId: "RULE-002",
      ruleVersion: "R21",
      contentVersionId: "RV-002",
      templateVersion: versions[1]?.templateVersion || "v1",
      idempotencyKey: ruleEventIdempotencyKey("RULE-002", "EVT-LQ-302187"),
      user: "UID 18***87",
      status: "重复抑制",
      receivedAt: "18:03:50.030",
      completedAt: "18:03:50.041",
      channelTotal: 0,
      successCount: 0,
      failureCount: 0,
      reason: "相同事件实例已由当前规则处理",
    },
  ];
  return { rules, versions, triggerRecords };
};

const normalizeCategory = (name: string, category: string) => {
  if (name.includes("强平") || name.includes("风险")) return "风控通知";
  if (
    [
      "系统公告",
      "交易通知",
      "资产通知",
      "安全通知",
      "奖励通知",
      "活动通知",
      "风控通知",
    ].includes(category)
  )
    return category;
  if (name.includes("登录")) return "安全通知";
  if (name.includes("提现") || name.includes("充值")) return "资产通知";
  return "活动通知";
};

const enrichTemplates = (): MessageTemplate[] =>
  templates.map((template) => ({
    ...template,
    channels: template.channels.filter(
      (channel) => channel === "站内信" || channel === "Push",
    ),
    category: normalizeCategory(template.name, template.category),
    content:
      template.content ||
      contentFor(
        template.name,
        normalizeCategory(template.name, template.category),
      ),
    variables: ["user_nickname", "amount", "currency", "symbol", "occurred_at"],
    owner: template.owner || "消息运营",
  }));

const makeEventConfig = (event: SystemEventDefinition): EventTriggerConfig => ({
  eventId: event.id,
  eventVersion: event.version,
  conditionExpression:
    event.id === "liquidation.warning" ? "margin_rate < 0.2" : "",
  variableMappings: event.variables.map((variable) => ({
    eventField: variable,
    templateVariable: variable,
    required: true,
  })),
  dedupeKey: "{{ event_id }}:{{ user_id }}",
  eventTtlSeconds: 300,
  maxRetries: 3,
  retryBackoffSeconds: 30,
});

const enrichTasks = (seededTemplates: MessageTemplate[]): MessageTask[] =>
  tasks
    .map((task) => {
      const template = seededTemplates.find((item) =>
        task.template.startsWith(`${item.code} `),
      );
      const eventId = task.template.startsWith("withdraw_success ")
        ? "withdrawal.succeeded"
        : task.template.startsWith("liquidation_warning ")
          ? "liquidation.warning"
          : undefined;
      const event = eventSeed.find((item) => item.id === eventId);
      const isEvent = Boolean(event && template);
      const manualStatus: ManualTaskStatus =
        task.status === "已驳回"
          ? "待修改"
          : task.status === "部分完成" || task.status === "失败"
            ? "已完成"
            : (task.status as ManualTaskStatus);
      const approvalStatus: ManualTaskApprovalStatus = task.approval.includes(
        "通过",
      )
        ? "通过"
        : task.status === "已驳回"
          ? "驳回"
          : task.approval.includes("未提交")
            ? "未提交"
            : "审核中";
      const deliveryResult: ManualTaskDeliveryResult =
        task.status === "发送中" || task.status === "已暂停"
          ? "处理中"
          : task.status === "部分完成"
            ? "部分失败"
            : task.status === "失败"
              ? "失败"
              : task.status === "已完成"
                ? "成功"
                : "未开始";
      return {
        ...task,
        channels: task.channels.filter(
          (channel) => channel === "站内信" || channel === "Push",
        ),
        category: normalizeCategory(task.name, task.category),
        contentMode: "template" as const,
        content:
          template?.content ||
          contentFor(task.name, normalizeCategory(task.name, task.category)),
        expiresAt: "2026-07-14 20:00",
        audienceType: isEvent ? undefined : ("all" as const),
        sampleUsers: [
          "UID 82***19 · zh-CN · iOS",
          "UID 51***02 · en-US · Android",
          "UID 18***87 · zh-CN · Web",
        ],
        triggerType: isEvent ? ("event" as const) : ("manual" as const),
        type: isEvent ? "事件触发" : task.type,
        templateId: template?.id,
        templateVersion: template?.version,
        translationBatchId: template?.translationBatchId,
        eventConfig: event ? makeEventConfig(event) : undefined,
        audience: isEvent ? "事件主体用户" : task.audience,
        audienceCount: isEvent ? 1 : task.audienceCount,
        schedule: isEvent ? "事件到达时" : task.schedule,
        status: isEvent
          ? template?.status === "已发布" &&
            template.translationReadiness === "全部审核通过"
            ? "已启用"
            : task.status === "草稿" || task.status === "待审核"
              ? task.status
              : "已停用"
          : manualStatus,
        approvalStatus: isEvent ? undefined : approvalStatus,
        deliveryResult: isEvent ? undefined : deliveryResult,
      };
    })
    .filter((task) => task.channels.length > 0 && task.type !== "自动化");

const createSeed = (): PrototypeState => {
  const templateCandidates = enrichTemplates();
  const seededTasks = enrichTasks(templateCandidates);
  const automation = createAutomationSeed(templateCandidates);
  const seededTemplates = normalizeTemplateUsageScopes(
    templateCandidates,
    seededTasks,
    automation.versions,
  );
  const firstPhaseApprovals: ApprovalItem[] = [
    ...approvals.filter(
      (item) =>
        item.objectType === "消息任务" || item.objectType === "消息模板",
    ),
    {
      id: "APR-8816",
      objectType: "紧急任务",
      name: "强平预警 App Push 紧急补发",
      version: "v1",
      risk: "关键",
      nature: "强事务",
      audience: 18400,
      cost: "Web ¥0 · Push ¥0",
      schedule: "立即",
      step: "业务 + 风控双审",
      submitter: "赵辰",
      submitterId: "platform-11",
      submittedAt: "18:02",
      status: "紧急",
      emergency: true,
    },
  ];
  return {
    messages: JSON.parse(JSON.stringify(userMessages)),
    categories: JSON.parse(JSON.stringify(messageCategories)),
    tasks: seededTasks,
    templates: seededTemplates,
    translationBatches: normalizeTranslationBatches(
      translationBatches,
      languageReviewPolicySeed,
      seededTemplates,
    ),
    languageReviewPolicies: JSON.parse(JSON.stringify(languageReviewPolicySeed)),
    approvals: firstPhaseApprovals.map((item) => {
      const task = seededTasks.find(
        (candidate) => candidate.name === item.name,
      );
      const template = seededTemplates.find(
        (candidate) => candidate.name === item.name,
      );
      return {
        ...item,
        cost: "Web ¥0 · Push ¥0",
        taskId: task?.id,
        templateId: task?.templateId || template?.id,
        templateVersion: task?.templateVersion || template?.version,
        triggerType: task?.triggerType,
        eventConfig: task?.eventConfig,
        channels: task?.channels || template?.channels || ["站内信", "Push"],
        locales: task?.content?.locales || template?.locales || ["zh-CN"],
        content:
          task?.content ||
          template?.content ||
          contentFor(item.name, item.nature),
        sampleUsers: task?.sampleUsers || [
          "UID 82***19 · zh-CN · iOS",
          "UID 51***02 · en-US · Android",
        ],
        expiresAt: task?.expiresAt || "2026-07-14 20:00",
        changes: ["新增 App Push 紧急优先级", "更新 Deep Link 为已备案路径"],
      };
    }),
    deliveries: deliveries
      .filter(
        (record) => record.channel === "站内信" || record.channel === "Push",
      )
      .map((record, index) => ({
        ...record,
        eventCode: index < eventSeed.length ? eventSeed[index].id : undefined,
        category: record.task.includes("风险") ? "风控通知" : "资产通知",
        risk: record.task.includes("风险") ? "紧急" : "普通",
        devicePlatform:
          record.channel === "Push"
            ? (index % 2 ? "iOS" : "Android")
            : index % 3 === 1
              ? "iOS"
              : "Web",
        providerMessageId: `PM-${90001 + index}`,
        clickedAt: record.status === "已点击" ? "17:59:02.118" : undefined,
        errorCode: record.error?.split(" · ")[0],
        retryable: record.error?.includes("TEMP"),
        tokenStatus: record.error?.includes("Invalid device token")
          ? "已失效"
          : record.channel === "Push"
            ? "有效"
            : "不适用",
        triggerId:
          index < automation.triggerRecords.length
            ? automation.triggerRecords[index].id
            : undefined,
      })),
    allowlist: allowlistSeed,
    testAccounts: JSON.parse(JSON.stringify(operatorTestAccounts)),
    events: eventSeed,
    rules: automation.rules,
    ruleVersions: automation.versions,
    triggerRecords: automation.triggerRecords,
  };
};

const migrateSavedState = (saved: PrototypeState): PrototypeState => {
  const fresh = createSeed();
  const savedTemplates = saved.templates || [];
  const mergedTemplateCandidates = [
    ...savedTemplates.map((template) => ({
      ...fresh.templates.find((item) => item.id === template.id),
      ...template,
    })),
    ...fresh.templates.filter(
      (template) => !savedTemplates.some((item) => item.id === template.id),
    ),
  ];
  const savedTranslationBatches = saved.translationBatches || [];
  const mergedTranslationBatches = [
    ...savedTranslationBatches,
    ...fresh.translationBatches.filter(
      (batch) =>
        !savedTranslationBatches.some((item) => item.id === batch.id),
    ),
  ];
  const mergedTasks = (saved.tasks || fresh.tasks).map((task) => {
    const baseline = fresh.tasks.find((item) => item.id === task.id);
    const triggerType = task.triggerType || baseline?.triggerType || (task.type === "事件触发" ? "event" : "manual");
    return {
      ...baseline,
      ...task,
      triggerType,
      type: triggerType === "event" ? "事件触发" : task.type,
      templateId: task.templateId || baseline?.templateId,
      templateVersion: task.templateVersion || baseline?.templateVersion,
      eventConfig: task.eventConfig || baseline?.eventConfig,
      status: baseline?.triggerType === "event" ? baseline.status : task.status,
    };
  });
  const mergedRuleVersions = normalizeRuleContentVersions(
    saved.ruleVersions || fresh.ruleVersions,
    mergedTemplateCandidates,
  );
  const mergedTemplates = normalizeTemplateUsageScopes(
    mergedTemplateCandidates,
    mergedTasks,
    mergedRuleVersions,
  );
  const mergedEvents = fresh.events.map((event) => {
    const persisted = saved.events?.find((item) => item.id === event.id);
    if (!persisted) return event;
    const { template: _template, templateId: _templateId, ...definition } = persisted;
    return { ...event, ...definition, variables: persisted.variables || event.variables };
  });
  for (const event of saved.events || []) {
    if (!mergedEvents.some((item) => item.id === event.id)) {
      const { template: _template, templateId: _templateId, ...definition } = event;
      mergedEvents.push(definition);
    }
  }
  const mergedApprovals = (saved.approvals || fresh.approvals).map((approval) => {
    const task = mergedTasks.find((item) => item.id === approval.taskId || item.name === approval.name);
    return {
      ...approval,
      triggerType: approval.triggerType || task?.triggerType,
      templateId: approval.templateId || task?.templateId,
      templateVersion: approval.templateVersion || task?.templateVersion,
      eventConfig: approval.eventConfig || task?.eventConfig,
    };
  });
  return {
    ...fresh,
    ...saved,
    templates: mergedTemplates,
    tasks: mergedTasks,
    events: mergedEvents,
    approvals: mergedApprovals,
    categories: saved.categories || fresh.categories,
    testAccounts: saved.testAccounts || fresh.testAccounts,
    translationBatches: normalizeTranslationBatches(
      mergedTranslationBatches,
      saved.languageReviewPolicies || fresh.languageReviewPolicies,
      mergedTemplates,
    ),
    languageReviewPolicies:
      saved.languageReviewPolicies || fresh.languageReviewPolicies,
    rules: saved.rules || fresh.rules,
    ruleVersions: mergedRuleVersions,
    triggerRecords: saved.triggerRecords || fresh.triggerRecords,
  };
};

const load = (): PrototypeState => {
  if (typeof window === "undefined") return createSeed();
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? migrateSavedState(JSON.parse(saved) as PrototypeState) : createSeed();
  } catch {
    return createSeed();
  }
};

let state = load();

const persist = () => {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage is optional */
    }
  }
};

const emit = () => {
  persist();
  listeners.forEach((listener) => listener());
};
const update = (recipe: (current: PrototypeState) => PrototypeState) => {
  state = recipe(state);
  emit();
};

export const getPrototypeState = () => state;
export const subscribePrototypeStore = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const usePrototypeStore = () =>
  useSyncExternalStore(
    subscribePrototypeStore,
    getPrototypeState,
    getPrototypeState,
  );

export const getOperatorTestAccounts = (operatorId: string) =>
  state.testAccounts.filter((account) => account.operatorId === operatorId);

export const addOperatorTestAccount = (input: {
  operatorId: string;
  uid: string;
  remark?: string;
}) => {
  const uid = input.uid.trim();
  if (!uid) throw new Error("请输入测试 UID");
  const accounts = getOperatorTestAccounts(input.operatorId);
  if (accounts.length >= 4)
    throw new Error("每名操作者最多配置 4 个测试账号");
  if (accounts.some((account) => account.uid === uid))
    throw new Error("该 UID 已在你的测试账号中");

  const account: OperatorTestAccount = {
    id: `TEST-ACCOUNT-${Date.now().toString().slice(-7)}`,
    operatorId: input.operatorId,
    uid,
    remark: input.remark?.trim() || "未备注",
    verified: true,
    createdAt: "刚刚",
    updatedAt: "刚刚",
  };
  update((current) => ({
    ...current,
    testAccounts: [...current.testAccounts, account],
  }));
  return account;
};

export const updateOperatorTestAccount = (
  id: string,
  operatorId: string,
  changes: Pick<OperatorTestAccount, "remark">,
) => {
  const account = state.testAccounts.find((item) => item.id === id);
  if (!account) throw new Error("测试账号不存在");
  if (account.operatorId !== operatorId)
    throw new Error("无权修改该测试账号");

  const result = {
    ...account,
    remark: changes.remark.trim() || "未备注",
    updatedAt: "刚刚",
  };
  update((current) => ({
    ...current,
    testAccounts: current.testAccounts.map((item) =>
      item.id === id ? result : item,
    ),
  }));
  return result;
};

export const removeOperatorTestAccount = (
  id: string,
  operatorId: string,
) => {
  const account = state.testAccounts.find((item) => item.id === id);
  if (!account) throw new Error("测试账号不存在");
  if (account.operatorId !== operatorId)
    throw new Error("无权删除该测试账号");
  update((current) => ({
    ...current,
    testAccounts: current.testAccounts.filter((item) => item.id !== id),
  }));
};

export const sendTemplateTest = (input: {
  operatorId: string;
  channels: Channel[];
  variables: Record<string, string>;
  content: LocalizedMessageContent;
}): TemplateTestSendResult => {
  const accounts = getOperatorTestAccounts(input.operatorId);
  if (!accounts.length) throw new Error("请先配置本人测试账号");
  const channels = Array.from(
    new Set(
      input.channels.filter(
        (channel) => channel === "站内信" || channel === "Push",
      ),
    ),
  );
  if (!channels.length) throw new Error("请至少选择一个测试发送渠道");
  if (
    channels.includes("站内信") &&
    (!input.content.web.title ||
      !input.content.web.summary ||
      !input.content.web.body)
  )
    throw new Error("请完整填写站内信标题、摘要和正文");
  if (
    channels.includes("Push") &&
    (!input.content.push.title || !input.content.push.body)
  )
    throw new Error("请完整填写 Push 标题和正文");
  if (Object.values(input.variables).some((value) => !value.trim()))
    throw new Error("请完整填写模板变量测试值");

  return {
    operatorId: input.operatorId,
    recipientUids: accounts.map((account) => account.uid),
    accountCount: accounts.length,
    channelCount: channels.length,
    totalDeliveries: accounts.length * channels.length,
  };
};
export const resetPrototypeStore = () => {
  state = createSeed();
  if (
    typeof window !== "undefined" &&
    typeof window.localStorage?.removeItem === "function"
  )
    window.localStorage.removeItem(STORAGE_KEY);
  listeners.forEach((listener) => listener());
};

export const markMessageRead = (id: string) =>
  update((current) => ({
    ...current,
    messages: current.messages.map((item) =>
      item.id === id ? { ...item, read: true } : item,
    ),
  }));
export const markAllMessagesRead = () =>
  update((current) => ({
    ...current,
    messages: current.messages.map((item) => ({ ...item, read: true })),
  }));
export const acknowledgeRiskMessage = (id: string) =>
  update((current) => ({
    ...current,
    messages: current.messages.map((item) =>
      item.id === id ? { ...item, read: true, acknowledgedAt: "刚刚" } : item,
    ),
  }));

type LegacyTranslationBatchInput = {
  templateId: string;
  targetLocales: string[];
  createdBy: string;
};

type GeneralTranslationBatchInput = {
  subject: {
    type: TranslationSubjectType;
    id: string;
    name: string;
    version: string;
    returnPath: string;
  };
  sourceLocale: string;
  sourceContent: TranslationContentLayer;
  targetLocales: string[];
  createdBy: string;
};

export const createTranslationBatch = (
  input: LegacyTranslationBatchInput | GeneralTranslationBatchInput,
) => {
  const generalized = "subject" in input;
  const template = generalized
    ? undefined
    : state.templates.find((item) => item.id === input.templateId);
  if (!generalized && !template) throw new Error("模板不存在");
  if (template && isApprovedManualTemplateLocked(template))
    throw new Error(APPROVED_MANUAL_TEMPLATE_LOCK_MESSAGE);
  const subject = generalized
    ? input.subject
    : {
        type: "template_version" as const,
        id: template!.id,
        name: template!.name,
        version: template!.version,
        returnPath: "/templates",
      };
  const sourceLocale = generalized ? input.sourceLocale : template!.sourceLocale;
  const sourceContent: TranslationContentLayer = generalized
    ? input.sourceContent
    : {
        title: template!.content?.web.title,
        summary: template!.content?.web.summary,
        body: template!.content?.web.body,
      };
  const templateId = generalized ? subject.id : template!.id;
  const targetLocales = input.targetLocales;
  const createdBy = input.createdBy;
  const stamp = Date.now().toString().slice(-7);
  const batch: TranslationBatch = {
    id: `MT-${stamp}`,
    subjectType: subject.type,
    subjectId: subject.id,
    subjectName: subject.name,
    contentVersion: subject.version,
    returnPath: subject.returnPath,
    templateId,
    templateVersion: subject.version,
    sourceLocale,
    targetLocales,
    status: "待人工审核",
    createdBy,
    createdAt: "刚刚",
    updatedAt: "刚刚",
    sourceContent,
    items: targetLocales.map((locale, index) => {
      const policy = state.languageReviewPolicies.find(
        (candidate) => candidate.localeCode === locale && candidate.enabled,
      );
      const machineOutput = {
        title: `${sourceContent.title || subject.name} · ${locale}`,
        summary: sourceContent.summary || "",
        body: sourceContent.body || "",
      };
      return {
        id: `MTI-${stamp}${index}`,
        batchId: `MT-${stamp}`,
        templateId,
        templateName: subject.name,
        subjectType: subject.type,
        subjectId: subject.id,
        subjectName: subject.name,
        sourceLocale,
        targetLocale: locale,
        externalTaskId: `EXT-MT-${stamp}${index}`,
        attemptNo: 1,
        status: generalized
          ? policy?.specialReviewRequired
            ? "待小语种专审" as const
            : "待普通确认" as const
          : "待人工审核" as const,
        sourceContentHash: `sha256:${stamp}${index}`,
        machineTitle: machineOutput.title,
        machineSummary: machineOutput.summary,
        machineBody: machineOutput.body,
        machineOutput,
        humanDraft: { ...machineOutput },
        submittedAt: "刚刚",
        translatedAt: "刚刚",
        submitter: createdBy,
        variablesValid: true,
        specialReviewRequired: policy?.specialReviewRequired || false,
        reviewGroup: policy?.reviewGroup,
        reviewSlaHours: policy?.reviewSlaHours,
      };
    }),
  };
  update((current) => ({
    ...current,
    translationBatches: [batch, ...current.translationBatches],
    templates: current.templates.map((item) =>
      subject.type === "template_version" && item.id === templateId
        ? {
            ...item,
            translationBatchId: batch.id,
            translationReadiness: "待人工审核",
            locales: [item.sourceLocale, ...targetLocales],
            content: item.content
              ? {
                  ...item.content,
                  locales: [item.sourceLocale, ...targetLocales],
                }
              : item.content,
            status: "审核中",
            updatedAt: "刚刚",
          }
        : item,
    ),
  }));
  return batch;
};

const recomputeBatch = (batch: TranslationBatch): TranslationBatch => {
  const approved = batch.items.every(
    (item) => item.status === "审核通过" || item.status === "已通过",
  );
  const failed = batch.items.some(
    (item) => item.status === "翻译失败" || item.status === "审核驳回",
  );
  return {
    ...batch,
    status: approved ? "全部审核通过" : failed ? "部分失败" : "待人工审核",
    updatedAt: "刚刚",
  };
};

type TranslationApprovalValues = {
  title: string;
  summary: string;
  body: string;
  reviewer: string;
};

const approveTranslationWithMode = (
  itemId: string,
  values: TranslationApprovalValues,
  mode: "ordinary" | "special" | "legacy",
) => {
  const currentItem = state.translationBatches
    .flatMap((batch) => batch.items)
    .find((item) => item.id === itemId);
  if (!currentItem) throw new Error("翻译任务不存在");
  if (mode === "ordinary" && currentItem.specialReviewRequired)
    throw new Error("该语言必须进入小语种专审");
  if (mode === "special" && !currentItem.specialReviewRequired)
    throw new Error("该语言无需小语种专审");

  return update((current) => {
    const batches = current.translationBatches.map((batch) =>
      recomputeBatch({
        ...batch,
        items: batch.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                status: mode === "legacy" ? "审核通过" : "已通过",
                reviewedTitle: values.title,
                reviewedSummary: values.summary,
                reviewedBody: values.body,
                humanDraft: {
                  title: values.title,
                  summary: values.summary,
                  body: values.body,
                },
                approvedOutput: {
                  title: values.title,
                  summary: values.summary,
                  body: values.body,
                },
                reviewer: values.reviewer,
                reviewedAt: "刚刚",
              }
            : item,
        ),
      }),
    );
    const readyIds = new Set(
      batches
        .filter((batch) => batch.status === "全部审核通过")
        .map((batch) => batch.templateId),
    );
    const readyRuleVersionIds = new Set(
      batches
        .filter(
          (batch) =>
            batch.status === "全部审核通过" &&
            batch.subjectType === "rule_content_version",
        )
        .map((batch) => batch.subjectId),
    );
    return {
      ...current,
      translationBatches: batches,
      templates: current.templates.map((candidate) =>
        readyIds.has(candidate.id)
          ? {
              ...candidate,
              translationReadiness: "全部审核通过",
              status: "待业务审核",
            }
          : candidate,
      ),
      ruleVersions: current.ruleVersions.map((version) =>
        readyRuleVersionIds.has(version.id)
          ? { ...version, status: "待审核" }
          : version,
      ),
    };
  });
};

export const approveTranslation = (
  itemId: string,
  values: TranslationApprovalValues,
) => approveTranslationWithMode(itemId, values, "legacy");

export const approveOrdinaryTranslation = (
  itemId: string,
  values: TranslationApprovalValues,
) => approveTranslationWithMode(itemId, values, "ordinary");

export const approveSpecialReview = (
  itemId: string,
  values: TranslationApprovalValues,
) => approveTranslationWithMode(itemId, values, "special");

export const saveTranslationDraft = (
  itemId: string,
  values: Omit<TranslationApprovalValues, "reviewer">,
) =>
  update((current) => ({
    ...current,
    translationBatches: current.translationBatches.map((batch) =>
      recomputeBatch({
        ...batch,
        items: batch.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                status: item.specialReviewRequired ? "专审中" : "修改中",
                humanDraft: values,
                reviewedTitle: values.title,
                reviewedSummary: values.summary,
                reviewedBody: values.body,
              }
            : item,
        ),
      }),
    ),
  }));

export const startSpecialReview = (itemId: string) =>
  update((current) => ({
    ...current,
    translationBatches: current.translationBatches.map((batch) =>
      recomputeBatch({
        ...batch,
        items: batch.items.map((item) =>
          item.id === itemId && item.specialReviewRequired
            ? { ...item, status: "专审中" }
            : item,
        ),
      }),
    ),
  }));

export const rejectTranslation = (itemId: string, reason: string) =>
  update((current) => ({
    ...current,
    translationBatches: current.translationBatches.map((batch) =>
      recomputeBatch({
        ...batch,
        items: batch.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                status: "审核驳回",
                errorMessage: reason,
                reviewedAt: "刚刚",
              }
            : item,
        ),
      }),
    ),
  }));
export const retryTranslation = (itemId: string) =>
  update((current) => ({
    ...current,
    translationBatches: current.translationBatches.map((batch) =>
      recomputeBatch({
        ...batch,
        items: batch.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                status: item.specialReviewRequired
                  ? "待小语种专审"
                  : item.subjectType
                    ? "待普通确认"
                    : "待人工审核",
                attemptNo: item.attemptNo + 1,
                externalTaskId: `EXT-MT-${Date.now().toString().slice(-8)}`,
                errorCode: undefined,
                errorMessage: undefined,
                translatedAt: "刚刚",
              }
            : item,
        ),
      }),
    ),
  }));

export const updateLanguageReviewPolicy = (
  localeCode: string,
  values: Partial<LanguageReviewPolicy>,
) =>
  update((current) => ({
    ...current,
    languageReviewPolicies: current.languageReviewPolicies.map((policy) =>
      policy.localeCode === localeCode ? { ...policy, ...values } : policy,
    ),
  }));

export const updateMessageCategory = (
  code: MessageCategory["code"],
  changes: Partial<MessageCategory>,
) =>
  update((current) => ({
    ...current,
    categories: current.categories.map((category) =>
      category.code === code ? { ...category, ...changes, code } : category,
    ),
  }));

export type TaskSubmission = Pick<
  MessageTask,
  | "name"
  | "category"
  | "nature"
  | "risk"
  | "template"
  | "channels"
  | "audience"
  | "audienceCount"
  | "schedule"
  | "creator"
  | "team"
  | "contentMode"
  | "content"
> &
  Partial<
    Pick<
      MessageTask,
      | "expiresAt"
      | "retentionDays"
      | "audienceType"
      | "sampleUsers"
      | "translationBatchId"
      | "triggerType"
      | "templateId"
      | "templateVersion"
      | "eventConfig"
      | "uidAudience"
    >
  >;

export const validateEventTaskConfig = (
  config: EventTriggerConfig | undefined,
  event: SystemEventDefinition | undefined,
  template: MessageTemplate | undefined,
): EventTaskValidationResult => {
  if (!config || !event) return { valid: false, reason: "请选择系统事件" };
  if (
    !template ||
    template.status !== "已发布" ||
    template.translationReadiness !== "全部审核通过"
  )
    return { valid: false, reason: "模板尚未发布或多语言审核未完成" };
  if (!config.dedupeKey.trim())
    return { valid: false, reason: "去重键不能为空" };
  if (config.eventTtlSeconds <= 0)
    return { valid: false, reason: "事件有效期必须大于 0 秒" };
  if (config.eventTtlSeconds > 604800)
    return { valid: false, reason: "事件有效期不能超过 604800 秒" };
  if (config.maxRetries < 0 || config.maxRetries > 10)
    return { valid: false, reason: "最大重试次数必须在 0–10 之间" };
  if (config.retryBackoffSeconds < 1 || config.retryBackoffSeconds > 3600)
    return { valid: false, reason: "首次退避必须在 1–3600 秒之间" };
  const eventFields = new Set(event.variables);
  const mapped = new Map(
    config.variableMappings.map((item) => [
      item.templateVariable,
      item.eventField,
    ]),
  );
  const missing = (template.variables || []).filter(
    (item) => !mapped.get(item),
  );
  if (missing.length)
    return { valid: false, reason: `缺少变量映射：${missing.join("、")}` };
  const invalid = config.variableMappings.find(
    (item) => item.required && !eventFields.has(item.eventField),
  );
  if (invalid)
    return { valid: false, reason: `事件字段不存在：${invalid.eventField}` };
  return { valid: true };
};

export const saveTaskDraft = (
  input: TaskSubmission,
  existingTaskId?: string,
) => {
  const triggerType = input.triggerType || "manual";
  const task: MessageTask = {
    ...input,
    triggerType,
    id: existingTaskId || `MSG-DRAFT-${Date.now().toString().slice(-5)}`,
    type: triggerType === "event" ? "事件触发" : "人工群发",
    status: "草稿",
    approval: "未提交",
    approvalStatus: "未提交",
    deliveryResult: "未开始",
    progress: 0,
    successRate: 0,
    createdAt: "刚刚",
  };
  update((current) => ({
    ...current,
    tasks: existingTaskId
      ? current.tasks.map((item) => (item.id === existingTaskId ? task : item))
      : [task, ...current.tasks],
    approvals: existingTaskId
      ? current.approvals.map((item) =>
          item.taskId === existingTaskId &&
          ["待我审核", "待审核", "紧急"].includes(item.status)
            ? {
                ...item,
                status: "已撤回",
                reviewedAt: "刚刚",
                opinion: "任务创建人重新编辑，旧审批自动失效",
              }
            : item,
        )
      : current.approvals,
  }));
  return task;
};

export const submitTask = (input: TaskSubmission, existingTaskId?: string) => {
  const triggerType = input.triggerType || "manual";
  if (triggerType === "event") {
    const validation = validateEventTaskConfig(
      input.eventConfig,
      state.events.find((item) => item.id === input.eventConfig?.eventId),
      state.templates.find((item) => item.id === input.templateId),
    );
    if (!validation.valid) throw new Error(validation.reason);
  }
  const task: MessageTask = {
    ...input,
    triggerType,
    id: existingTaskId || `MSG-${Date.now().toString().slice(-9)}`,
    type: triggerType === "event" ? "事件触发" : "人工群发",
    status: "待审核",
    approval:
      input.risk === "高" || input.risk === "关键"
        ? "业务 + 风控双审"
        : "一级审核",
    approvalStatus: "审核中",
    deliveryResult: "未开始",
    progress: 0,
    successRate: 0,
    createdAt: "刚刚",
    sampleUsers: input.sampleUsers || [
      "UID 82***19 · zh-CN · iOS",
      "UID 51***02 · en-US · Android",
    ],
  };
  const approval: ApprovalItem = {
    id: `APR-${Date.now().toString().slice(-6)}`,
    objectType: "消息任务",
    name: task.name,
    version: "v1",
    risk: task.risk,
    nature: task.nature,
    audience: task.audienceCount,
    cost: "Web ¥0 · Push ¥0",
    schedule: task.schedule,
    step:
      task.risk === "高" || task.risk === "关键"
        ? "业务 + 风控双审"
        : "一级审核",
    submitter: task.creator,
    submitterId: "admin-01",
    submittedAt: "刚刚",
    status: "待我审核",
    taskId: task.id,
    templateId: task.templateId,
    templateVersion: task.templateVersion,
    triggerType: task.triggerType,
    eventConfig: task.eventConfig,
    channels: task.channels,
    locales: task.content?.locales,
    content: task.content,
    sampleUsers: task.sampleUsers,
    expiresAt: task.expiresAt,
    changes: ["首次提交审核，内容与配置已冻结"],
  };
  update((current) => ({
    ...current,
    tasks: existingTaskId
      ? current.tasks.map((item) => (item.id === existingTaskId ? task : item))
      : [task, ...current.tasks],
    approvals: [
      approval,
      ...current.approvals.map((item) =>
        existingTaskId &&
        item.taskId === existingTaskId &&
        ["待我审核", "待审核", "紧急"].includes(item.status)
          ? {
              ...item,
              status: "已撤回",
              reviewedAt: "刚刚",
              opinion: "任务内容重新提交，旧审批自动失效",
            }
          : item,
      ),
    ],
  }));
  return task;
};

export const updateTaskStatus = (taskId: string, status: string) =>
  update((current) => ({
    ...current,
    tasks: current.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            status,
            approval: status === "已取消" ? "已终止" : task.approval,
          }
        : task,
    ),
  }));

export const performManualTaskOperation = (
  taskId: string,
  operation: ManualTaskOperation,
) =>
  update((current) => ({
    ...current,
    tasks: current.tasks.map((task) => {
      if (
        task.id !== taskId ||
        task.triggerType === "event" ||
        !isManualTaskStatus(task.status) ||
        !getManualTaskOperations({
          status: task.status,
          deliveryResult: task.deliveryResult,
        }).includes(operation)
      )
        return task;

      const status = transitionManualTask(task.status, operation);
      return {
        ...task,
        status,
        approval:
          operation === "撤回审核"
            ? "已撤回"
            : operation === "取消任务"
              ? "已终止"
              : task.approval,
        approvalStatus:
          operation === "撤回审核"
            ? "已撤回"
            : operation === "取消任务"
              ? "已终止"
              : operation === "编辑任务" && task.status === "待发送"
                ? "未提交"
                : task.approvalStatus,
        deliveryResult:
          operation === "暂停发送" || operation === "恢复发送"
            ? "处理中"
            : operation === "编辑任务"
              ? "未开始"
              : task.deliveryResult,
      };
    }),
    approvals: current.approvals.map((approval) =>
      approval.taskId === taskId &&
      operation === "撤回审核" &&
      ["待我审核", "待审核", "紧急"].includes(approval.status)
        ? {
            ...approval,
            status: "已撤回",
            reviewedAt: "刚刚",
            opinion: "任务创建人撤回审核",
          }
        : approval,
    ),
  }));

export const reviewApproval = (
  approvalId: string,
  result: { decision: "approve" | "reject"; reviewer: string; opinion: string },
) =>
  update((current) => {
    const approval = current.approvals.find((item) => item.id === approvalId);
    const status = result.decision === "approve" ? "已通过" : "已驳回";
    return {
      ...current,
      approvals: current.approvals.map((item) =>
        item.id === approvalId
          ? {
              ...item,
              status,
              reviewer: result.reviewer,
              reviewedAt: "刚刚",
              opinion: result.opinion,
            }
          : item,
      ),
      tasks: current.tasks.map((task) =>
        task.id === approval?.taskId || task.name === approval?.name
          ? task.triggerType === "event"
            ? {
                ...task,
                status:
                  result.decision === "approve" ? "已启用" : "已驳回",
                approval: status,
              }
            : {
                ...task,
                status:
                  result.decision === "approve"
                    ? task.schedule === "立即"
                      ? "发送中"
                      : "待发送"
                    : "待修改",
                approval: status,
                approvalStatus:
                  result.decision === "approve" ? "通过" : "驳回",
                deliveryResult:
                  result.decision === "approve" && task.schedule === "立即"
                    ? "处理中"
                    : "未开始",
              }
          : task,
      ),
      templates: current.templates.map((template) =>
        template.id === approval?.templateId ||
        (approval?.objectType === "消息模板" && template.name === approval.name)
          ? {
              ...template,
              status: result.decision === "approve" ? "已发布" : "已驳回",
              updatedAt: "刚刚",
            }
          : template,
      ),
    };
  });

export const saveTemplate = (
  input: Omit<
    MessageTemplate,
    | "id"
    | "translationBatchId"
    | "translationReadiness"
    | "version"
    | "status"
    | "updatedAt"
  >,
) => {
  const template: MessageTemplate = {
    ...input,
    id: `TPL-${Date.now().toString().slice(-6)}`,
    translationBatchId: "",
    translationReadiness: "未提交",
    version: "v1",
    status: "草稿",
    updatedAt: "刚刚",
  };
  update((current) => ({
    ...current,
    templates: [template, ...current.templates],
  }));
  return template;
};

export const updateTemplate = (
  id: string,
  changes: Partial<MessageTemplate>,
) => {
  const existing = state.templates.find((item) => item.id === id);
  if (!existing) throw new Error("模板不存在");
  if (isApprovedManualTemplateLocked(existing))
    throw new Error(APPROVED_MANUAL_TEMPLATE_LOCK_MESSAGE);

  let result = existing;
  update((current) => ({
    ...current,
    templates: current.templates.map((item) => {
      if (item.id !== id) return item;
      result = {
        ...item,
        ...changes,
        translationReadiness: "未提交",
        translationBatchId: "",
        status: "草稿",
        version: `v${Number(item.version.replace(/\D/g, "")) + 1}`,
        updatedAt: "刚刚",
      };
      return result;
    }),
  }));
  return result;
};

export const submitTemplateForApproval = (templateId: string) => {
  const template = state.templates.find((item) => item.id === templateId);
  if (!template) throw new Error("模板不存在");
  if (isApprovedManualTemplateLocked(template))
    throw new Error(APPROVED_MANUAL_TEMPLATE_LOCK_MESSAGE);
  if (template.translationReadiness !== "全部审核通过")
    throw new Error("多语言人工审核尚未全部通过");
  const existing = state.approvals.find(
    (item) =>
      item.templateId === templateId &&
      ["待我审核", "待审核"].includes(item.status),
  );
  if (existing) return existing;
  const approval: ApprovalItem = {
    id: `APR-${Date.now().toString().slice(-6)}`,
    objectType: "消息模板",
    name: template.name,
    version: template.version,
    risk: template.risk,
    nature: template.nature,
    audience: 0,
    cost: "Web ¥0 · Push ¥0",
    schedule: "审核通过后发布",
    step:
      template.risk === "高" || template.risk === "关键"
        ? "业务 + 风控双审"
        : "一级审核",
    submitter: "Gary Ma",
    submitterId: "admin-01",
    submittedAt: "刚刚",
    status: "待我审核",
    templateId: template.id,
    channels: template.channels,
    locales: template.locales,
    content: template.content,
    expiresAt: "长期",
    changes: ["全部目标语言已完成人工审核", "提交不可变模板版本发布"],
  };
  update((current) => ({
    ...current,
    approvals: [approval, ...current.approvals],
    templates: current.templates.map((item) =>
      item.id === templateId
        ? { ...item, status: "待业务审核", updatedAt: "刚刚" }
        : item,
    ),
  }));
  return approval;
};

export const addAllowlistEntry = (input: Omit<LinkAllowlistEntry, "id">) =>
  update((current) => ({
    ...current,
    allowlist: [
      { ...input, id: `LINK-${Date.now().toString().slice(-5)}` },
      ...current.allowlist,
    ],
  }));
export const updateAllowlistEntry = (
  id: string,
  changes: Partial<LinkAllowlistEntry>,
) =>
  update((current) => ({
    ...current,
    allowlist: current.allowlist.map((item) =>
      item.id === id ? { ...item, ...changes } : item,
    ),
  }));

export const createEventRule = (input: {
  name: string;
  eventId: string;
  conditionExpression: string;
  subjectMapping: string;
  channels: EventNotificationRule["channels"];
  templateId: string;
  templateVersion: string;
  title: string;
  body: string;
  targetLocales: string[];
  owner: string;
}) => {
  const stamp = Date.now().toString().slice(-6);
  const event = state.events.find((item) => item.id === input.eventId);
  if (!event) throw new Error("事件定义不存在");
  const ruleId = `RULE-${stamp}`;
  const versionId = `RV-${stamp}`;
  const rule: EventNotificationRule = {
    id: ruleId,
    name: input.name,
    eventId: input.eventId,
    eventVersion: event.version,
    conditionExpression: input.conditionExpression || "事件到达即触发",
    subjectMapping: input.subjectMapping || "payload.user_id → UID",
    status: "草稿",
    channels: input.channels,
    dedupeKey: "{{ rule_id }}:{{ event_instance_id }}",
    frequencyCap: "同一事件实例仅一次",
    eventTtlSeconds: 300,
    maxRetries: 3,
    retryBackoffSeconds: 30,
    owner: input.owner,
    createdAt: "刚刚",
    updatedAt: "刚刚",
    triggerCount24h: 0,
    successRate: 0,
  };
  const version: RuleContentVersion = {
    id: versionId,
    ruleId,
    version: "V1",
    templateId: input.templateId,
    templateVersion: input.templateVersion,
    status: "草稿",
    sourceLocale: "zh-CN",
    targetLocales: input.targetLocales,
    title: input.title,
    body: input.body,
    createdBy: input.owner,
    createdAt: "刚刚",
  };
  update((current) => ({
    ...current,
    rules: [rule, ...current.rules],
    ruleVersions: [version, ...current.ruleVersions],
  }));
  return rule;
};

export const changeEventRuleStatus = (
  ruleId: string,
  operation: EventRuleOperation,
) =>
  update((current) => ({
    ...current,
    rules: current.rules.map((rule) =>
      rule.id === ruleId
        ? {
            ...rule,
            status: nextEventRuleStatus(rule.status, operation),
            updatedAt: "刚刚",
          }
        : rule,
    ),
  }));

export const reviewEventRule = (
  ruleId: string,
  decision: "approve" | "reject",
) =>
  update((current) => ({
    ...current,
    rules: current.rules.map((rule) =>
      rule.id === ruleId
        ? {
            ...rule,
            status: decision === "approve" ? "已启用" : "待修改",
            updatedAt: "刚刚",
          }
        : rule,
    ),
  }));

export const createRuleContentVersion = (ruleId: string) => {
  const rule = state.rules.find((item) => item.id === ruleId);
  if (!rule) throw new Error("事件通知规则不存在");
  const current = state.ruleVersions.find(
    (item) => item.id === rule.currentVersionId,
  );
  if (!current) throw new Error("当前内容版本不存在");
  const versionNumber =
    Math.max(
      ...state.ruleVersions
        .filter((item) => item.ruleId === ruleId)
        .map((item) => Number(item.version.replace(/\D/g, "")) || 0),
    ) + 1;
  const version: RuleContentVersion = {
    ...current,
    id: `RV-${Date.now().toString().slice(-6)}`,
    version: `V${versionNumber}`,
    status: "草稿",
    createdBy: "Gary Ma",
    createdAt: "刚刚",
    activatedAt: undefined,
  };
  update((snapshot) => ({
    ...snapshot,
    ruleVersions: [version, ...snapshot.ruleVersions],
  }));
  return version;
};

export const updateRuleContentVersion = (
  versionId: string,
  changes: Pick<RuleContentVersion, "title" | "body" | "targetLocales">,
) =>
  update((current) => ({
    ...current,
    ruleVersions: current.ruleVersions.map((version) =>
      version.id === versionId && version.status === "草稿"
        ? { ...version, ...changes }
        : version,
    ),
  }));

export const createRuleTranslationBatch = (versionId: string) => {
  const version = state.ruleVersions.find((item) => item.id === versionId);
  const rule = version
    ? state.rules.find((item) => item.id === version.ruleId)
    : undefined;
  if (!version || !rule) throw new Error("规则内容版本不存在");
  const batch = createTranslationBatch({
    subject: {
      type: "rule_content_version",
      id: version.id,
      name: `${rule.name} · ${version.version}`,
      version: version.version,
      returnPath: "/automation",
    },
    sourceLocale: version.sourceLocale,
    sourceContent: { title: version.title, body: version.body },
    targetLocales: version.targetLocales.filter(
      (locale) => locale !== version.sourceLocale,
    ),
    createdBy: version.createdBy,
  });
  update((current) => ({
    ...current,
    ruleVersions: current.ruleVersions.map((item) =>
      item.id === versionId
        ? { ...item, translationBatchId: batch.id, status: "待人工审核" }
        : item,
    ),
  }));
  return batch;
};

export const advanceRuleContentVersion = (
  versionId: string,
  operation: RuleContentVersionOperation,
) =>
  update((current) => ({
    ...current,
    ruleVersions: current.ruleVersions.map((version) =>
      version.id === versionId
        ? {
            ...version,
            status: nextRuleVersionStatus(version.status, operation),
          }
        : version,
    ),
  }));

export const publishRuleContentVersion = (versionId: string) => {
  const version = state.ruleVersions.find((item) => item.id === versionId);
  if (!version) throw new Error("内容版本不存在");
  if (version.status !== "待生效") throw new Error("只有待生效版本可以发布");
  update((current) => ({
    ...current,
    rules: current.rules.map((rule) =>
      rule.id === version.ruleId
        ? { ...rule, currentVersionId: version.id, updatedAt: "刚刚" }
        : rule,
    ),
    ruleVersions: current.ruleVersions.map((item) =>
      item.ruleId !== version.ruleId
        ? item
        : item.id === version.id
          ? { ...item, status: "当前生效", activatedAt: "刚刚" }
          : item.status === "当前生效"
            ? { ...item, status: "已替换" }
            : item,
    ),
  }));
};

export const retryDelivery = (id: string) =>
  update((current) => ({
    ...current,
    deliveries: current.deliveries.map((item) =>
      item.id === id && item.retryable
        ? {
            ...item,
            status: "重试中",
            retryCount: item.retryCount + 1,
            error: undefined,
            errorCode: undefined,
          }
        : item,
    ),
  }));
export const suppressDeliveryToken = (id: string) =>
  update((current) => ({
    ...current,
    deliveries: current.deliveries.map((item) =>
      item.id === id
        ? { ...item, tokenStatus: "已失效", status: "已抑制" }
        : item,
    ),
  }));

export const testSystemEvent = (
  eventId: string,
  eventInstanceId = `EVT-TEST-${Date.now().toString().slice(-6)}`,
): EventTestResult => {
  const event = state.events.find((item) => item.id === eventId);
  if (!event) return { ok: false, reason: "系统事件不存在" };
  const rule = state.rules.find(
    (item) => item.eventId === eventId && item.status === "已启用",
  );
  if (!rule) return { ok: false, reason: "没有已启用的事件通知规则" };
  const version = state.ruleVersions.find(
    (item) => item.id === rule.currentVersionId,
  );
  if (!version) return { ok: false, reason: "规则没有当前生效内容版本" };
  const stamp = Date.now().toString().slice(-5);
  const triggerId = `TRG-TEST-${stamp}`;
  const newDeliveries: DeliveryRecord[] = rule.channels.map(
    (channel, index) => ({
      id: `DLV-TEST-${stamp}-${index + 1}`,
      task: `测试 · ${rule.name}`,
      user: "UID TEST-001",
      destination: channel === "Push" ? "device ***test" : "站内账户",
      channel,
      provider: channel === "Push" ? "FCM Sandbox" : "ForX Finance Inbox",
      status: "已送达",
      submittedAt: "刚刚",
      deliveredAt: "刚刚",
      retryCount: 0,
      cost: "—",
      eventCode: event.id,
      category: event.line === "风控" ? "风控通知" : "资产通知",
      risk: event.line === "风控" ? "紧急" : "普通",
      devicePlatform: channel === "Push" ? "Android" : "Web",
      providerMessageId: `PM-TEST-${stamp}-${index + 1}`,
      tokenStatus: channel === "Push" ? "有效" : "不适用",
      triggerId,
    }),
  );
  const trigger: TriggerRecord = {
    id: triggerId,
    eventInstanceId,
    eventId,
    ruleId: rule.id,
    ruleVersion: `R-${rule.updatedAt}`,
    contentVersionId: version.id,
    templateVersion: version.templateVersion,
    idempotencyKey: ruleEventIdempotencyKey(rule.id, eventInstanceId),
    user: "UID TEST-001",
    status: "已完成",
    receivedAt: "刚刚",
    completedAt: "刚刚",
    channelTotal: newDeliveries.length,
    successCount: newDeliveries.length,
    failureCount: 0,
  };
  update((current) => ({
    ...current,
    events: current.events.map((item) =>
      item.id === eventId ? { ...item, lastTestAt: "刚刚" } : item,
    ),
    rules: current.rules.map((item) =>
      item.id === rule.id
        ? {
            ...item,
            triggerCount24h: item.triggerCount24h + 1,
            updatedAt: "刚刚",
          }
        : item,
    ),
    triggerRecords: [trigger, ...current.triggerRecords],
    deliveries: [...newDeliveries, ...current.deliveries],
  }));
  return {
    ok: true,
    deliveryId: newDeliveries[0]?.id,
    triggerId,
    ruleId: rule.id,
  };
};

export const registerSystemEvent = (
  input: Omit<SystemEventDefinition, "calls" | "failure" | "last" | "status">,
) =>
  update((current) => ({
    ...current,
    events: [
      {
        ...input,
        calls: "0",
        failure: "0%",
        last: "尚未调用",
        status: "待联调",
      },
      ...current.events,
    ],
  }));

export const validateActionUrl = (url: string | undefined) =>
  !url ||
  state.allowlist.some(
    (entry) =>
      entry.status === "启用" &&
      (entry.pattern === url ||
        (entry.pattern.endsWith("*") &&
          url.startsWith(entry.pattern.slice(0, -1))) ||
        (entry.pattern.includes(":id") &&
          url.startsWith(entry.pattern.split(":id")[0]))),
  );
