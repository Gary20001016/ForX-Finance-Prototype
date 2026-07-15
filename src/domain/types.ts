export type Channel = "站内信" | "Push" | "邮件" | "短信";
export type RiskLevel = "低" | "中" | "高" | "关键";

export interface WebMessageContent {
  title: string;
  summary: string;
  body: string;
  riskCopy?: string;
  actionText?: string;
  targetUrl?: string;
}

export interface PushMessageContent {
  title: string;
  body: string;
  imageUrl?: string;
  deepLink?: string;
  platform: "全部设备" | "iOS" | "Android";
  priority: "普通" | "高" | "紧急";
  collapseKey?: string;
}

export interface LocalizedMessageContent {
  sourceLocale: string;
  locales: string[];
  web: WebMessageContent;
  push: PushMessageContent;
}

export type TaskTriggerType = "manual" | "event";

export interface EventVariableMapping {
  eventField: string;
  templateVariable: string;
  required: boolean;
}

export interface EventTriggerConfig {
  eventId: string;
  eventVersion: string;
  conditionExpression: string;
  variableMappings: EventVariableMapping[];
  dedupeKey: string;
  eventTtlSeconds: number;
  maxRetries: number;
  retryBackoffSeconds: number;
}

export type EventRuleStatus =
  | "草稿"
  | "待审核"
  | "待修改"
  | "已启用"
  | "已停用"
  | "已取消"
  | "已过期";

export type EventRuleOperation =
  | "查看详情"
  | "编辑规则"
  | "提交审核"
  | "撤回审核"
  | "启用规则"
  | "停用规则"
  | "取消规则"
  | "创建内容版本";

export type RuleContentVersionStatus =
  | "草稿"
  | "机翻处理中"
  | "待人工审核"
  | "待审核"
  | "待生效"
  | "当前生效"
  | "已替换"
  | "已取消"
  | "已回滚";

export type RuleContentVersionOperation =
  | "提交机翻"
  | "机翻完成"
  | "人工审核通过"
  | "通过审核"
  | "取消版本";

export interface EventNotificationRule {
  id: string;
  name: string;
  eventId: string;
  eventVersion: string;
  conditionExpression: string;
  subjectMapping: string;
  status: EventRuleStatus;
  currentVersionId?: string;
  channels: Channel[];
  dedupeKey: string;
  frequencyCap: string;
  eventTtlSeconds: number;
  maxRetries: number;
  retryBackoffSeconds: number;
  owner: string;
  createdAt: string;
  updatedAt: string;
  triggerCount24h: number;
  successRate: number;
}

export interface RuleContentVersion {
  id: string;
  ruleId: string;
  version: string;
  templateId: string;
  templateVersion: string;
  status: RuleContentVersionStatus;
  sourceLocale: string;
  targetLocales: string[];
  translationBatchId?: string;
  title: string;
  body: string;
  createdBy: string;
  createdAt: string;
  activatedAt?: string;
}

export type TriggerRecordStatus =
  | "已接收"
  | "已过滤"
  | "重复抑制"
  | "处理中"
  | "已完成"
  | "部分失败"
  | "失败"
  | "已过期";

export interface TriggerRecord {
  id: string;
  eventInstanceId: string;
  eventId: string;
  ruleId: string;
  ruleVersion: string;
  contentVersionId: string;
  templateVersion: string;
  idempotencyKey: string;
  user: string;
  status: TriggerRecordStatus;
  receivedAt: string;
  completedAt?: string;
  channelTotal: number;
  successCount: number;
  failureCount: number;
  reason?: string;
}

export interface UidAudienceSnapshot {
  manualUids: string[];
  csvFileName?: string;
  csvTotalRows: number;
  csvValidUids: string[];
  csvInvalidRows: Array<{ row: number; uid: string; reason: string }>;
  duplicateCount: number;
  csvConfirmed: boolean;
  finalUids: string[];
}

export type ManualTaskStatus =
  | "草稿"
  | "待审核"
  | "待修改"
  | "待发送"
  | "发送中"
  | "已暂停"
  | "已完成"
  | "已取消"
  | "已过期";

export type ManualTaskApprovalStatus =
  | "未提交"
  | "审核中"
  | "通过"
  | "驳回"
  | "已撤回"
  | "已终止";

export type ManualTaskDeliveryResult =
  | "未开始"
  | "处理中"
  | "成功"
  | "部分失败"
  | "失败";

export type ManualTaskOperation =
  | "查看详情"
  | "编辑任务"
  | "复制任务"
  | "提交审核"
  | "撤回审核"
  | "通过审核"
  | "驳回审核"
  | "取消任务"
  | "暂停发送"
  | "恢复发送"
  | "重试失败项";

export type ManualTaskSystemAction =
  | "系统启动发送"
  | "系统完成发送"
  | "系统终止发送"
  | "系统标记过期";

export interface ManualFrequencyPolicy {
  enabled: boolean;
  maxCount?: number;
  windowValue?: number;
  windowUnit?: "hour" | "day";
  scope: "同消息分类";
}

export interface MessageTask {
  id: string;
  name: string;
  type: string;
  category: string;
  nature: string;
  risk: RiskLevel;
  template: string;
  channels: Channel[];
  audience: string;
  audienceCount: number;
  schedule: string;
  status: string;
  approval: string;
  approvalStatus?: ManualTaskApprovalStatus;
  deliveryResult?: ManualTaskDeliveryResult;
  progress: number;
  successRate: number;
  creator: string;
  team: string;
  contentMode?: "template" | "temporary";
  content?: LocalizedMessageContent;
  expiresAt?: string;
  retentionDays?: number;
  audienceType?: "all" | "uid" | "vip" | "agent" | "campaign";
  sampleUsers?: string[];
  translationBatchId?: string;
  createdAt?: string;
  triggerType?: TaskTriggerType;
  templateId?: string;
  templateVersion?: string;
  eventConfig?: EventTriggerConfig;
  uidAudience?: UidAudienceSnapshot;
  frequencyPolicy?: ManualFrequencyPolicy;
}

export type TemplateUsageScope = "manual" | "event" | "shared";

export interface MessageTemplate {
  id: string;
  code: string;
  name: string;
  category: string;
  nature: string;
  risk: RiskLevel;
  channels: Channel[];
  locales: string[];
  sourceLocale: string;
  translationBatchId: string;
  translationReadiness: TranslationBatchStatus;
  version: string;
  status: string;
  updatedAt: string;
  content?: LocalizedMessageContent;
  variables?: string[];
  owner?: string;
  usageScope: TemplateUsageScope;
}

export type TranslationItemStatus =
  | "未提交"
  | "排队中"
  | "翻译中"
  | "待普通确认"
  | "修改中"
  | "待小语种专审"
  | "专审中"
  | "源文案已变更"
  | "已通过"
  | "待人工审核"
  | "审核通过"
  | "翻译失败"
  | "审核驳回"
  | "已取消";
export type TranslationBatchStatus =
  | "未提交"
  | "机翻处理中"
  | "待人工审核"
  | "全部审核通过"
  | "部分失败"
  | "审核被驳回"
  | "已取消";

export type TranslationSubjectType =
  | "template_version"
  | "manual_task_content"
  | "rule_content_version";

export interface LanguageReviewPolicy {
  localeCode: string;
  localeName: string;
  specialReviewRequired: boolean;
  reviewGroup?: string;
  reviewerCount: 1 | 2;
  allowSubmitterReview: boolean;
  reviewSlaHours?: number;
  timeoutAction: "提醒" | "升级" | "阻断发布";
  enabled: boolean;
}

export interface TranslationContentLayer {
  title?: string;
  summary?: string;
  body?: string;
}

export interface TranslationItem {
  id: string;
  batchId: string;
  templateId: string;
  templateName: string;
  subjectType?: TranslationSubjectType;
  subjectId?: string;
  subjectName?: string;
  sourceLocale: string;
  targetLocale: string;
  externalTaskId: string;
  attemptNo: number;
  status: TranslationItemStatus;
  sourceContentHash: string;
  machineTitle?: string;
  machineSummary?: string;
  machineBody?: string;
  machineOutput?: TranslationContentLayer;
  humanDraft?: TranslationContentLayer;
  approvedOutput?: TranslationContentLayer;
  reviewedTitle?: string;
  reviewedSummary?: string;
  reviewedBody?: string;
  errorCode?: string;
  errorMessage?: string;
  submittedAt: string;
  translatedAt?: string;
  reviewedAt?: string;
  reviewer?: string;
  submitter: string;
  variablesValid: boolean;
  specialReviewRequired?: boolean;
  reviewGroup?: string;
  reviewSlaHours?: number;
  changedFields?: Array<"title" | "summary" | "body">;
}

export interface TranslationBatch {
  id: string;
  subjectType?: TranslationSubjectType;
  subjectId?: string;
  subjectName?: string;
  contentVersion?: string;
  returnPath?: string;
  templateId: string;
  templateVersion: string;
  sourceLocale: string;
  targetLocales: string[];
  status: TranslationBatchStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  sourceContent?: TranslationContentLayer;
  items: TranslationItem[];
}

export interface AudienceSegment {
  id: string;
  name: string;
  type: string;
  purpose: string;
  count: number;
  change: number;
  refresh: string;
  updatedAt: string;
  owner: string;
  status: string;
  rule: string;
}

export interface ApprovalItem {
  id: string;
  objectType: string;
  name: string;
  version: string;
  risk: RiskLevel;
  nature: string;
  audience: number;
  cost: string;
  schedule: string;
  step: string;
  submitter: string;
  submitterId: string;
  submittedAt: string;
  status: string;
  emergency?: boolean;
  taskId?: string;
  templateId?: string;
  channels?: Channel[];
  locales?: string[];
  content?: LocalizedMessageContent;
  sampleUsers?: string[];
  expiresAt?: string;
  changes?: string[];
  reviewer?: string;
  reviewedAt?: string;
  opinion?: string;
  triggerType?: TaskTriggerType;
  templateVersion?: string;
  eventConfig?: EventTriggerConfig;
}

export interface DeliveryRecord {
  id: string;
  task: string;
  user: string;
  destination: string;
  channel: Channel;
  provider: string;
  status: string;
  submittedAt: string;
  deliveredAt: string;
  error?: string;
  retryCount: number;
  cost: string;
  eventCode?: string;
  category?: string;
  risk?: string;
  devicePlatform?: "iOS" | "Android" | "Web";
  providerMessageId?: string;
  clickedAt?: string;
  errorCode?: string;
  retryable?: boolean;
  tokenStatus?: "有效" | "已失效" | "不适用";
  triggerId?: string;
}

export interface LinkAllowlistEntry {
  id: string;
  name: string;
  type: "Deep Link" | "Web URL";
  pattern: string;
  platforms: Array<"Web" | "iOS" | "Android">;
  parameterRule: string;
  effectiveAt: string;
  expiresAt: string;
  status: "启用" | "停用" | "已过期";
  owner: string;
}

export interface SystemEventDefinition {
  id: string;
  name: string;
  line: string;
  version: string;
  /** @deprecated Templates are connected through event-triggered tasks. */
  template?: string;
  templateId?: string;
  caller: string;
  calls: string;
  failure: string;
  last: string;
  status: string;
  variables: string[];
  lastTestAt?: string;
  description?: string;
}

export interface EventTaskValidationResult {
  valid: boolean;
  reason?: string;
}

export interface EventTestResult {
  ok: boolean;
  reason?: string;
  deliveryId?: string;
  triggerId?: string;
  ruleId?: string;
}

export interface ChannelProvider {
  id: string;
  name: string;
  channel: Channel;
  regions: string;
  status: string;
  successRate: number;
  latency: number;
  qps: number;
  balance: string;
  priority: number;
}

export interface CompliancePolicy {
  id: string;
  name: string;
  region: string;
  nature: string;
  channels: Channel[];
  quietHours: string;
  consent: string;
  version: string;
  status: string;
  effectiveAt: string;
}

export type MessageCategoryCode =
  | "system_notice"
  | "trade_notice"
  | "asset_notice"
  | "security_notice"
  | "reward_notice"
  | "campaign_notice"
  | "risk_notice";
export type MessageRisk = "普通" | "重要" | "紧急";

export interface MessageCategory {
  code: MessageCategoryCode;
  name: string;
  color: string;
  defaultRisk: MessageRisk;
}

export interface UserMessage {
  id: string;
  title: string;
  summary: string;
  body: string;
  category: MessageCategoryCode;
  createdAt: string;
  read: boolean;
  risk: MessageRisk;
  source: "系统事件" | "人工发送";
  actionText?: string;
  targetUrl?: string;
  expiresAt?: string;
  acknowledgedAt?: string;
}
