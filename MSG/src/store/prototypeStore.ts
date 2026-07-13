import { useSyncExternalStore } from 'react';
import type {
  ApprovalItem,
  DeliveryRecord,
  LinkAllowlistEntry,
  LocalizedMessageContent,
  MessageTask,
  MessageTemplate,
  SystemEventDefinition,
  TranslationBatch,
  UserMessage,
} from '../domain/types';
import { approvals, deliveries, tasks, templates, translationBatches, userMessages } from '../mocks/data';

export interface PrototypeState {
  messages: UserMessage[];
  tasks: MessageTask[];
  templates: MessageTemplate[];
  translationBatches: TranslationBatch[];
  approvals: ApprovalItem[];
  deliveries: DeliveryRecord[];
  allowlist: LinkAllowlistEntry[];
  events: SystemEventDefinition[];
}

const STORAGE_KEY = 'forx-finance-message-center-prototype-v1';
const listeners = new Set<() => void>();

const contentFor = (title: string, category = '消息通知'): LocalizedMessageContent => ({
  sourceLocale:'zh-CN',
  locales:['zh-CN','en-US'],
  web:{
    title,
    summary:`${category}：请查看最新消息详情。`,
    body:`尊敬的 {{ user_nickname }}，${title}。相关金额、币种、交易对与时间信息请以账户记录为准。`,
    riskCopy:category.includes('风控') || title.includes('风险') ? '市场波动较大，请立即核对账户与仓位。' : undefined,
    actionText:'查看详情',
    targetUrl:'forxfinance://security/devices',
  },
  push:{ title, body:`${category}：请立即查看。`, deepLink:'forxfinance://security/devices', platform:'全部设备', priority:title.includes('风险') ? '紧急' : '高', collapseKey:`message-${title.slice(0,8)}` },
});

const allowlistSeed: LinkAllowlistEntry[] = [
  { id:'LINK-001', name:'提现详情', type:'Deep Link', pattern:'forxfinance://wallet/withdrawal/:id', platforms:['iOS','Android'], parameterRule:'id 为字母数字，最长 64 位', effectiveAt:'2026-01-01 00:00', expiresAt:'2027-12-31 23:59', status:'启用', owner:'资金平台' },
  { id:'LINK-002', name:'设备管理', type:'Deep Link', pattern:'forxfinance://security/devices', platforms:['iOS','Android'], parameterRule:'不允许额外参数', effectiveAt:'2026-01-01 00:00', expiresAt:'长期', status:'启用', owner:'安全中心' },
  { id:'LINK-003', name:'公告详情', type:'Web URL', pattern:'https://www.forxfinance.example/announcements/*', platforms:['Web','iOS','Android'], parameterRule:'仅允许公告数字 ID', effectiveAt:'2026-01-01 00:00', expiresAt:'2027-12-31 23:59', status:'启用', owner:'内容运营' },
];

const eventSeed: SystemEventDefinition[] = [
  ['deposit.credited','充值到账','资产','deposit_credited v1','wallet-gateway'],
  ['withdrawal.succeeded','提现成功','资产','withdrawal_succeeded v1','withdrawal-service'],
  ['withdrawal.failed','提现失败','资产','withdrawal_failed v1','withdrawal-service'],
  ['order.filled','订单成交','交易','order_filled v1','order-service'],
  ['liquidation.warning','合约强平预警','风控','liquidation_warning v21','futures-risk'],
  ['trial_fund.credited','体验金到账','奖励','trial_fund_credited v1','reward-service'],
  ['points.credited','积分到账','奖励','points_credited v1','loyalty-service'],
  ['commission.credited','返佣到账','奖励','commission_credited v1','broker-service'],
].map(([id,name,line,template,caller], index) => ({ id,name,line,version:'1.0.0',template,caller,calls:index===3?'1.28M':`${12 + index * 6}.4K`,failure:index===4?'1.84%':'0.04%',last:'18:06:31',status:index===4?'轻微延迟':'运行正常',variables:['user_nickname','amount','currency','symbol','occurred_at'] }));

const normalizeCategory = (name:string, category:string) => {
  if (name.includes('强平') || name.includes('风险')) return '风控通知';
  if (['系统公告','交易通知','资产通知','安全通知','奖励通知','活动通知','风控通知'].includes(category)) return category;
  if (name.includes('登录')) return '安全通知';
  if (name.includes('提现') || name.includes('充值')) return '资产通知';
  return '活动通知';
};

const enrichTemplates = (): MessageTemplate[] => templates.map((template) => ({
  ...template,
  channels:template.channels.filter((channel) => channel === '站内信' || channel === 'Push'),
  category:normalizeCategory(template.name,template.category),
  content:template.content || contentFor(template.name, normalizeCategory(template.name,template.category)),
  variables:['user_nickname','amount','currency','symbol','occurred_at'],
  owner:template.owner || '消息运营',
}));

const enrichTasks = (): MessageTask[] => tasks.map((task) => ({
  ...task,
  channels:task.channels.filter((channel) => channel === '站内信' || channel === 'Push'),
  category:normalizeCategory(task.name,task.category),
  contentMode:'template' as const,
  content:contentFor(task.name, normalizeCategory(task.name,task.category)),
  expiresAt:'2026-07-14 20:00',
  audienceType:'all' as const,
  sampleUsers:['UID 82***19 · zh-CN · iOS','UID 51***02 · en-US · Android','UID 18***87 · zh-CN · Web'],
})).filter((task) => task.channels.length > 0 && task.type !== '自动化');

const createSeed = (): PrototypeState => {
  const seededTasks = enrichTasks();
  const seededTemplates = enrichTemplates();
  const firstPhaseApprovals: ApprovalItem[] = [
    ...approvals.filter((item) => item.objectType === '消息任务' || item.objectType === '消息模板'),
    { id:'APR-8816', objectType:'紧急任务', name:'强平预警 App Push 紧急补发', version:'v1', risk:'关键', nature:'强事务', audience:18400, cost:'Web ¥0 · Push ¥0', schedule:'立即', step:'业务 + 风控双审', submitter:'赵辰', submitterId:'platform-11', submittedAt:'18:02', status:'紧急', emergency:true },
  ];
  return {
    messages:JSON.parse(JSON.stringify(userMessages)),
    tasks:seededTasks,
    templates:seededTemplates,
    translationBatches:JSON.parse(JSON.stringify(translationBatches)),
    approvals:firstPhaseApprovals.map((item) => {
      const task = seededTasks.find((candidate) => candidate.name === item.name);
      const template = seededTemplates.find((candidate) => candidate.name === item.name);
      return { ...item, cost:'Web ¥0 · Push ¥0', taskId:task?.id, templateId:template?.id, channels:task?.channels || template?.channels || ['站内信','Push'], locales:task?.content?.locales || template?.locales || ['zh-CN'], content:task?.content || template?.content || contentFor(item.name, item.nature), sampleUsers:task?.sampleUsers || ['UID 82***19 · zh-CN · iOS','UID 51***02 · en-US · Android'], expiresAt:task?.expiresAt || '2026-07-14 20:00', changes:['新增 App Push 紧急优先级','更新 Deep Link 为已备案路径'] };
    }),
    deliveries:deliveries.filter((record)=>record.channel==='站内信'||record.channel==='Push').map((record, index) => ({ ...record, eventCode:index < eventSeed.length ? eventSeed[index].id : undefined, category:record.task.includes('风险')?'风控通知':'资产通知', risk:record.task.includes('风险')?'紧急':'普通', devicePlatform:record.channel==='Push'?(index % 2 ? 'iOS':'Android'):'Web', providerMessageId:`PM-${90001 + index}`, clickedAt:record.status==='已点击'?'17:59:02.118':undefined, errorCode:record.error?.split(' · ')[0], retryable:record.error?.includes('TEMP'), tokenStatus:record.error?.includes('Invalid device token')?'已失效':record.channel==='Push'?'有效':'不适用' })),
    allowlist:allowlistSeed,
    events:eventSeed,
  };
};

const load = (): PrototypeState => {
  if (typeof window === 'undefined') return createSeed();
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) as PrototypeState : createSeed();
  } catch { return createSeed(); }
};

let state = load();

const persist = () => {
  if (typeof window !== 'undefined') {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage is optional */ }
  }
};

const emit = () => { persist(); listeners.forEach((listener) => listener()); };
const update = (recipe: (current: PrototypeState) => PrototypeState) => { state = recipe(state); emit(); };

export const getPrototypeState = () => state;
export const subscribePrototypeStore = (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener); };
export const usePrototypeStore = () => useSyncExternalStore(subscribePrototypeStore, getPrototypeState, getPrototypeState);
export const resetPrototypeStore = () => {
  state = createSeed();
  if (typeof window !== 'undefined' && typeof window.localStorage?.removeItem === 'function') window.localStorage.removeItem(STORAGE_KEY);
  listeners.forEach((listener) => listener());
};

export const markMessageRead = (id: string) => update((current) => ({ ...current, messages:current.messages.map((item) => item.id === id ? { ...item, read:true } : item) }));
export const markAllMessagesRead = () => update((current) => ({ ...current, messages:current.messages.map((item) => ({ ...item, read:true })) }));
export const acknowledgeRiskMessage = (id:string) => update((current)=>({ ...current,messages:current.messages.map((item)=>item.id===id?{...item,read:true,acknowledgedAt:'刚刚'}:item) }));

export const createTranslationBatch = ({ templateId, targetLocales, createdBy }: { templateId:string; targetLocales:string[]; createdBy:string }) => {
  const template = state.templates.find((item) => item.id === templateId);
  if (!template) throw new Error('模板不存在');
  const stamp = Date.now().toString().slice(-7);
  const batch: TranslationBatch = {
    id:`MT-${stamp}`, templateId, templateVersion:template.version, sourceLocale:template.sourceLocale, targetLocales, status:'待人工审核', createdBy, createdAt:'刚刚', updatedAt:'刚刚',
    items:targetLocales.map((locale,index) => ({ id:`MTI-${stamp}${index}`, batchId:`MT-${stamp}`, templateId, templateName:template.name, sourceLocale:template.sourceLocale, targetLocale:locale, externalTaskId:`EXT-MT-${stamp}${index}`, attemptNo:1, status:'待人工审核', sourceContentHash:`sha256:${stamp}${index}`, machineTitle:`${template.content?.web.title || template.name} · ${locale}`, machineSummary:template.content?.web.summary || '', machineBody:template.content?.web.body || '', submittedAt:'刚刚', translatedAt:'刚刚', submitter:createdBy, variablesValid:true })),
  };
  update((current) => ({ ...current, translationBatches:[batch, ...current.translationBatches], templates:current.templates.map((item) => item.id === templateId ? { ...item, translationBatchId:batch.id, translationReadiness:'待人工审核', locales:[item.sourceLocale,...targetLocales], content:item.content ? { ...item.content, locales:[item.sourceLocale,...targetLocales] } : item.content, status:'审核中', updatedAt:'刚刚' } : item) }));
  return batch;
};

const recomputeBatch = (batch: TranslationBatch): TranslationBatch => {
  const approved = batch.items.every((item) => item.status === '审核通过');
  const failed = batch.items.some((item) => item.status === '翻译失败' || item.status === '审核驳回');
  return { ...batch, status:approved?'全部审核通过':failed?'部分失败':'待人工审核', updatedAt:'刚刚' };
};

export const approveTranslation = (itemId: string, values: { title:string; summary:string; body:string; reviewer:string }) => update((current) => {
  const batches = current.translationBatches.map((batch) => recomputeBatch({ ...batch, items:batch.items.map((item) => item.id === itemId ? { ...item, status:'审核通过', reviewedTitle:values.title, reviewedSummary:values.summary, reviewedBody:values.body, reviewer:values.reviewer, reviewedAt:'刚刚' } : item) }));
  const readyIds = new Set(batches.filter((batch) => batch.status === '全部审核通过').map((batch) => batch.templateId));
  return { ...current, translationBatches:batches, templates:current.templates.map((template) => readyIds.has(template.id) ? { ...template, translationReadiness:'全部审核通过', status:'待业务审核' } : template) };
});

export const rejectTranslation = (itemId:string, reason:string) => update((current) => ({ ...current, translationBatches:current.translationBatches.map((batch) => recomputeBatch({ ...batch, items:batch.items.map((item) => item.id === itemId ? { ...item, status:'审核驳回', errorMessage:reason, reviewedAt:'刚刚' } : item) })) }));
export const retryTranslation = (itemId:string) => update((current) => ({ ...current, translationBatches:current.translationBatches.map((batch) => recomputeBatch({ ...batch, items:batch.items.map((item) => item.id === itemId ? { ...item, status:'待人工审核', attemptNo:item.attemptNo + 1, externalTaskId:`EXT-MT-${Date.now().toString().slice(-8)}`, errorCode:undefined, errorMessage:undefined, translatedAt:'刚刚' } : item) })) }));

export type TaskSubmission = Pick<MessageTask,'name'|'category'|'nature'|'risk'|'template'|'channels'|'audience'|'audienceCount'|'schedule'|'creator'|'team'|'contentMode'|'content'> & Partial<Pick<MessageTask,'expiresAt'|'retentionDays'|'audienceType'|'sampleUsers'|'translationBatchId'>>;

export const saveTaskDraft = (input: TaskSubmission, existingTaskId?:string) => {
  const task: MessageTask = { ...input, id:existingTaskId||`MSG-DRAFT-${Date.now().toString().slice(-5)}`, type:'人工群发', status:'草稿', approval:'未提交', progress:0, successRate:0, createdAt:'刚刚' };
  update((current) => ({
    ...current,
    tasks:existingTaskId ? current.tasks.map((item)=>item.id===existingTaskId?task:item) : [task,...current.tasks],
    approvals:existingTaskId ? current.approvals.map((item)=>item.taskId===existingTaskId&&['待我审核','待审核','紧急'].includes(item.status)?{...item,status:'已撤回',reviewedAt:'刚刚',opinion:'任务创建人重新编辑，旧审批自动失效'}:item) : current.approvals,
  }));
  return task;
};

export const submitTask = (input: TaskSubmission, existingTaskId?:string) => {
  const task: MessageTask = { ...input, id:existingTaskId||`MSG-${Date.now().toString().slice(-9)}`, type:'人工群发', status:'待审核', approval:input.risk==='高'||input.risk==='关键'?'业务 + 风控双审':'一级审核', progress:0, successRate:0, createdAt:'刚刚', sampleUsers:input.sampleUsers || ['UID 82***19 · zh-CN · iOS','UID 51***02 · en-US · Android'] };
  const approval: ApprovalItem = { id:`APR-${Date.now().toString().slice(-6)}`, objectType:'消息任务', name:task.name, version:'v1', risk:task.risk, nature:task.nature, audience:task.audienceCount, cost:'Web ¥0 · Push ¥0', schedule:task.schedule, step:task.risk==='高'||task.risk==='关键'?'业务 + 风控双审':'一级审核', submitter:task.creator, submitterId:'admin-01', submittedAt:'刚刚', status:'待我审核', taskId:task.id, channels:task.channels, locales:task.content?.locales, content:task.content, sampleUsers:task.sampleUsers, expiresAt:task.expiresAt, changes:['首次提交审核，内容与配置已冻结'] };
  update((current) => ({
    ...current,
    tasks:existingTaskId ? current.tasks.map((item)=>item.id===existingTaskId?task:item) : [task,...current.tasks],
    approvals:[approval,...current.approvals.map((item)=>existingTaskId&&item.taskId===existingTaskId&&['待我审核','待审核','紧急'].includes(item.status)?{...item,status:'已撤回',reviewedAt:'刚刚',opinion:'任务内容重新提交，旧审批自动失效'}:item)],
  }));
  return task;
};

export const updateTaskStatus = (taskId:string, status:string) => update((current) => ({ ...current, tasks:current.tasks.map((task) => task.id === taskId ? { ...task, status, approval:status==='已取消'?'已终止':task.approval } : task) }));

export const reviewApproval = (approvalId:string, result:{ decision:'approve'|'reject'; reviewer:string; opinion:string }) => update((current) => {
  const approval = current.approvals.find((item) => item.id === approvalId);
  const status = result.decision === 'approve' ? '已通过' : '已驳回';
  return {
    ...current,
    approvals:current.approvals.map((item) => item.id === approvalId ? { ...item, status, reviewer:result.reviewer, reviewedAt:'刚刚', opinion:result.opinion } : item),
    tasks:current.tasks.map((task) => task.id === approval?.taskId || task.name === approval?.name ? { ...task, status:result.decision==='approve'?'待发送':'已驳回', approval:status } : task),
    templates:current.templates.map((template) => template.id === approval?.templateId || (approval?.objectType === '消息模板' && template.name === approval.name) ? { ...template, status:result.decision==='approve'?'已发布':'已驳回', updatedAt:'刚刚' } : template),
  };
});

export const saveTemplate = (input: Omit<MessageTemplate,'id'|'translationBatchId'|'translationReadiness'|'version'|'status'|'updatedAt'>) => {
  const template: MessageTemplate = { ...input, id:`TPL-${Date.now().toString().slice(-6)}`, translationBatchId:'', translationReadiness:'未提交', version:'v1', status:'草稿', updatedAt:'刚刚' };
  update((current) => ({ ...current, templates:[template,...current.templates] }));
  return template;
};

export const updateTemplate = (id:string, changes:Partial<MessageTemplate>) => {
  let result=state.templates.find((item)=>item.id===id);
  update((current)=>({ ...current,templates:current.templates.map((item)=>{if(item.id!==id)return item;result={...item,...changes,translationReadiness:'未提交',translationBatchId:'',status:'草稿',version:`v${Number(item.version.replace(/\D/g,''))+1}`,updatedAt:'刚刚'};return result;}) }));
  if(!result)throw new Error('模板不存在');
  return result;
};

export const submitTemplateForApproval = (templateId:string) => {
  const template=state.templates.find((item)=>item.id===templateId);
  if(!template)throw new Error('模板不存在');
  if(template.translationReadiness!=='全部审核通过')throw new Error('多语言人工审核尚未全部通过');
  const existing=state.approvals.find((item)=>item.templateId===templateId&&['待我审核','待审核'].includes(item.status));
  if(existing)return existing;
  const approval:ApprovalItem={id:`APR-${Date.now().toString().slice(-6)}`,objectType:'消息模板',name:template.name,version:template.version,risk:template.risk,nature:template.nature,audience:0,cost:'Web ¥0 · Push ¥0',schedule:'审核通过后发布',step:template.risk==='高'||template.risk==='关键'?'业务 + 风控双审':'一级审核',submitter:'Gary Ma',submitterId:'admin-01',submittedAt:'刚刚',status:'待我审核',templateId:template.id,channels:template.channels,locales:template.locales,content:template.content,expiresAt:'长期',changes:['全部目标语言已完成人工审核','提交不可变模板版本发布']};
  update((current)=>({...current,approvals:[approval,...current.approvals],templates:current.templates.map((item)=>item.id===templateId?{...item,status:'待业务审核',updatedAt:'刚刚'}:item)}));
  return approval;
};

export const addAllowlistEntry = (input: Omit<LinkAllowlistEntry,'id'>) => update((current) => ({ ...current, allowlist:[{ ...input, id:`LINK-${Date.now().toString().slice(-5)}` },...current.allowlist] }));
export const updateAllowlistEntry = (id:string, changes:Partial<LinkAllowlistEntry>) => update((current) => ({ ...current, allowlist:current.allowlist.map((item) => item.id === id ? { ...item,...changes } : item) }));

export const retryDelivery = (id:string) => update((current) => ({ ...current, deliveries:current.deliveries.map((item) => item.id === id && item.retryable ? { ...item, status:'重试中', retryCount:item.retryCount + 1, error:undefined, errorCode:undefined } : item) }));
export const suppressDeliveryToken = (id:string) => update((current) => ({ ...current, deliveries:current.deliveries.map((item) => item.id === id ? { ...item, tokenStatus:'已失效', status:'已抑制' } : item) }));

export const testSystemEvent = (eventId:string) => update((current) => {
  const event = current.events.find((item) => item.id === eventId);
  if (!event) return current;
  const record:DeliveryRecord = { id:`DLV-TEST-${Date.now().toString().slice(-5)}`, task:`测试 · ${event.name}`, user:'UID TEST-001', destination:'device ***test', channel:'Push', provider:'FCM Sandbox', status:'已送达', submittedAt:'刚刚', deliveredAt:'刚刚', retryCount:0, cost:'—', eventCode:event.id, category:event.line, risk:event.line==='风控'?'紧急':'普通', devicePlatform:'Android', providerMessageId:`PM-TEST-${Date.now().toString().slice(-4)}`, tokenStatus:'有效' };
  return { ...current, events:current.events.map((item) => item.id === eventId ? { ...item, lastTestAt:'刚刚' } : item), deliveries:[record,...current.deliveries] };
});

export const registerSystemEvent = (input: Omit<SystemEventDefinition,'calls'|'failure'|'last'|'status'>) => update((current) => ({ ...current, events:[{ ...input,calls:'0',failure:'0%',last:'尚未调用',status:'待联调' },...current.events] }));

export const validateActionUrl = (url:string | undefined) => !url || state.allowlist.some((entry) => entry.status === '启用' && (entry.pattern === url || (entry.pattern.endsWith('*') && url.startsWith(entry.pattern.slice(0,-1))) || (entry.pattern.includes(':id') && url.startsWith(entry.pattern.split(':id')[0]))));
