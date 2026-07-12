export type Channel = '站内信' | 'Push' | '邮件' | '短信';
export type RiskLevel = '低' | '中' | '高' | '关键';

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
  version: string;
  status: string;
  eventCode?: string;
  updatedAt: string;
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
