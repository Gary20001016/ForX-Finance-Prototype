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
}

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
}

export type TranslationItemStatus =
  | "未提交"
  | "排队中"
  | "翻译中"
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

export interface TranslationItem {
  id: string;
  batchId: string;
  templateId: string;
  templateName: string;
  sourceLocale: string;
  targetLocale: string;
  externalTaskId: string;
  attemptNo: number;
  status: TranslationItemStatus;
  sourceContentHash: string;
  machineTitle?: string;
  machineSummary?: string;
  machineBody?: string;
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
}

export interface TranslationBatch {
  id: string;
  templateId: string;
  templateVersion: string;
  sourceLocale: string;
  targetLocales: string[];
  status: TranslationBatchStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
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
  taskId?: string;
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
