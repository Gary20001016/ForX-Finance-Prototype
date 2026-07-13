import type {
  ApprovalItem,
  AudienceSegment,
  ChannelProvider,
  CompliancePolicy,
  DeliveryRecord,
  MessageTask,
  MessageTemplate,
  MessageCategory,
  UserMessage,
} from '../domain/types';

export const messageCategories: MessageCategory[] = [
  { code:'system_notice', name:'系统公告', color:'gray', defaultRisk:'普通' },
  { code:'trade_notice', name:'交易通知', color:'blue', defaultRisk:'普通' },
  { code:'asset_notice', name:'资产通知', color:'green', defaultRisk:'重要' },
  { code:'security_notice', name:'安全通知', color:'orange', defaultRisk:'重要' },
  { code:'reward_notice', name:'奖励通知', color:'gold', defaultRisk:'普通' },
  { code:'campaign_notice', name:'活动通知', color:'purple', defaultRisk:'普通' },
  { code:'risk_notice', name:'风控通知', color:'red', defaultRisk:'紧急' },
];

export const userMessages: UserMessage[] = [
  { id:'UM-1001', title:'BTC/USDT 强平风险预警', summary:'您的合约账户保证金率已降至 18.6%，请及时处理仓位。', body:'BTC/USDT 永续仓位当前保证金率为 18.6%，标记价格为 58,420.5 USDT。市场波动可能导致仓位被强制平仓，请及时追加保证金或降低仓位。', category:'risk_notice', createdAt:'今天 18:06', read:false, risk:'紧急', source:'系统事件', actionText:'查看仓位', targetUrl:'/futures/positions', expiresAt:'2026-07-13 20:06' },
  { id:'UM-1002', title:'充值到账 1,250 USDT', summary:'您充值的 1,250 USDT 已到账，可以开始交易。', body:'充值网络 TRON，到账金额 1,250 USDT，到账时间 2026-07-13 17:52 UTC+8。', category:'asset_notice', createdAt:'今天 17:52', read:false, risk:'重要', source:'系统事件', actionText:'查看资产', targetUrl:'/wallet/assets' },
  { id:'UM-1003', title:'ETH/USDT 订单已成交', summary:'买入 2.5 ETH，成交均价 3,248.20 USDT。', body:'您的 ETH/USDT 限价买单已全部成交。成交数量 2.5 ETH，成交均价 3,248.20 USDT。', category:'trade_notice', createdAt:'今天 16:28', read:true, risk:'普通', source:'系统事件', actionText:'查看订单', targetUrl:'/orders' },
  { id:'UM-1004', title:'检测到新的登录设备', summary:'您的账户在 macOS · Singapore 登录。', body:'如果本次登录不是您本人操作，请立即冻结账户并修改密码。', category:'security_notice', createdAt:'今天 14:10', read:false, risk:'重要', source:'系统事件', actionText:'管理设备', targetUrl:'/security/devices' },
  { id:'UM-1005', title:'500 USDT 体验金已到账', summary:'合约体验金有效期至 2026-07-20。', body:'您获得的 500 USDT 合约体验金已经到账，请在有效期内使用。', category:'reward_notice', createdAt:'昨天 20:30', read:true, risk:'普通', source:'系统事件', actionText:'查看奖励', targetUrl:'/rewards' },
  { id:'UM-1006', title:'夏季交易赛正式开启', summary:'完成交易任务，瓜分 500,000 USDT 奖池。', body:'夏季交易赛已正式开启。活动期间完成指定交易量即可解锁奖励。', category:'campaign_notice', createdAt:'昨天 10:00', read:false, risk:'普通', source:'人工发送', actionText:'查看活动', targetUrl:'/campaigns/summer-trade' },
  { id:'UM-1007', title:'ETH 网络维护完成', summary:'ETH 充值与提现服务已恢复。', body:'ETH 网络维护已经完成，充值与提现服务均已恢复正常。', category:'system_notice', createdAt:'07-12 08:40', read:true, risk:'普通', source:'人工发送' },
];

export const tasks: MessageTask[] = [
  { id: 'MSG-260712-001', name: '提现安全通知', type: '事件触发', category: '资金通知', nature: '强事务', risk: '关键', template: 'withdraw_success v12', channels: ['站内信','Push','邮件','短信'], audience: '事件用户', audienceCount: 18420, schedule: '实时', status: '发送中', approval: '双审通过', progress: 82, successRate: 99.8, creator: '系统事件', team: '资金平台' },
  { id: 'MSG-260712-002', name: '夏季交易赛召回', type: '定时群发', category: '产品运营', nature: '营销', risk: '中', template: 'summer_trade v4', channels: ['Push','邮件'], audience: '近30天沉默交易用户', audienceCount: 328400, schedule: '07-13 20:00 UTC+8', status: '待审核', approval: '一级审核中', progress: 0, successRate: 0, creator: '林夏', team: '增长运营' },
  { id: 'MSG-260712-003', name: 'ETH 网络维护公告', type: '定时群发', category: '系统公告', nature: '服务', risk: '高', template: 'network_maintenance v8', channels: ['站内信','Push','邮件'], audience: 'ETH 活跃用户', audienceCount: 842100, schedule: '07-13 09:30 UTC+8', status: '待发送', approval: '双审通过', progress: 0, successRate: 0, creator: '周屿', team: '资产运营' },
  { id: 'MSG-260712-004', name: '异常登录提醒', type: '事件触发', category: '账户安全', nature: '强事务', risk: '关键', template: 'login_risk v16', channels: ['Push','邮件','短信'], audience: '风险事件用户', audienceCount: 7620, schedule: '实时', status: '已完成', approval: '双审通过', progress: 100, successRate: 99.96, creator: '系统事件', team: '安全中心' },
  { id: 'MSG-260712-005', name: '新用户入金引导', type: '自动化', category: '产品运营', nature: '营销', risk: '低', template: 'first_deposit v3', channels: ['站内信','Push'], audience: '注册后24小时未入金', audienceCount: 47280, schedule: '用户本地 18:00', status: '已暂停', approval: '已通过', progress: 44, successRate: 98.7, creator: '陈一', team: '生命周期' },
  { id: 'MSG-260712-006', name: '合约强平风险预警', type: '事件触发', category: '交易通知', nature: '强事务', risk: '关键', template: 'liquidation_warning v21', channels: ['Push','短信'], audience: '风险事件用户', audienceCount: 12380, schedule: '实时', status: '部分完成', approval: '双审通过', progress: 100, successRate: 96.4, creator: '系统事件', team: '合约风控' },
  { id: 'MSG-260712-007', name: 'VIP 等级月度通知', type: '周期群发', category: '账户服务', nature: '事务', risk: '低', template: 'vip_monthly v2', channels: ['站内信','邮件'], audience: 'VIP 1-9', audienceCount: 86300, schedule: '每月 1 日 10:00', status: '草稿', approval: '未提交', progress: 0, successRate: 0, creator: '吴悦', team: 'VIP 运营' },
  { id: 'MSG-260712-008', name: '短信供应商恢复补发', type: '人工重试', category: '资金通知', nature: '强事务', risk: '高', template: 'deposit_success v9', channels: ['短信'], audience: '临时失败用户', audienceCount: 2480, schedule: '立即', status: '失败', approval: '重试待审核', progress: 100, successRate: 0, creator: '赵辰', team: '消息平台' },
];

export const templates: MessageTemplate[] = [
  { id:'TPL-1001', code:'withdraw_success', name:'提现成功通知', category:'资金通知', nature:'强事务', risk:'关键', channels:['站内信','Push','邮件','短信'], locales:['en-US','zh-CN','zh-TW','ja-JP','ko-KR'], version:'v12', status:'已发布', eventCode:'withdrawal.status.changed', updatedAt:'07-12 18:42' },
  { id:'TPL-1002', code:'login_risk', name:'异常登录提醒', category:'账户安全', nature:'强事务', risk:'关键', channels:['Push','邮件','短信'], locales:['en-US','zh-CN','es-ES'], version:'v16', status:'已发布', eventCode:'security.login.risk', updatedAt:'07-12 17:20' },
  { id:'TPL-1003', code:'summer_trade', name:'夏季交易赛', category:'产品运营', nature:'营销', risk:'中', channels:['站内信','Push','邮件'], locales:['en-US','zh-CN','tr-TR'], version:'v4', status:'审核中', updatedAt:'07-12 16:03' },
  { id:'TPL-1004', code:'network_maintenance', name:'网络维护公告', category:'系统公告', nature:'服务', risk:'高', channels:['站内信','Push','邮件'], locales:['en-US','zh-CN','ja-JP'], version:'v8', status:'已发布', updatedAt:'07-12 14:48' },
  { id:'TPL-1005', code:'liquidation_warning', name:'强平风险预警', category:'交易通知', nature:'强事务', risk:'关键', channels:['Push','短信'], locales:['en-US','zh-CN','ru-RU'], version:'v21', status:'已发布', eventCode:'futures.liquidation.warning', updatedAt:'07-12 11:26' },
  { id:'TPL-1006', code:'first_deposit', name:'首次入金引导', category:'产品运营', nature:'营销', risk:'低', channels:['站内信','Push'], locales:['en-US','zh-CN'], version:'v3', status:'已停用', updatedAt:'07-11 20:10' },
];

export const segments: AudienceSegment[] = [
  { id:'SEG-101', name:'近30天沉默交易用户', type:'动态条件', purpose:'营销', count:328400, change:4.8, refresh:'每小时', updatedAt:'18:00', owner:'增长运营', status:'可用', rule:'30天无成交 AND 资产 ≥ 100 USDT' },
  { id:'SEG-102', name:'ETH 活跃用户', type:'动态条件', purpose:'服务', count:842100, change:1.2, refresh:'每小时', updatedAt:'18:00', owner:'资产运营', status:'可用', rule:'近90天 ETH 充值、提现或交易' },
  { id:'SEG-103', name:'注册后24小时未入金', type:'动态条件', purpose:'营销', count:47280, change:-2.4, refresh:'实时', updatedAt:'18:06', owner:'生命周期', status:'可用', rule:'注册 ≥ 24h AND 净入金 = 0' },
  { id:'SEG-104', name:'VIP 1-9', type:'组合分群', purpose:'事务', count:86300, change:.6, refresh:'每日', updatedAt:'08:00', owner:'VIP 运营', status:'可用', rule:'VIP 等级属于 1-9，排除机构账户' },
  { id:'SEG-105', name:'EU 营销邮件退订', type:'静态名单', purpose:'抑制', count:120480, change:3.1, refresh:'实时', updatedAt:'18:05', owner:'合规', status:'受保护', rule:'EEA 地区 email_marketing = opted_out' },
];

export const approvals: ApprovalItem[] = [
  { id:'APR-8812', objectType:'消息任务', name:'夏季交易赛召回', version:'v1', risk:'中', nature:'营销', audience:328400, cost:'¥ 8,420', schedule:'07-13 20:00 UTC+8', step:'一级审核', submitter:'林夏', submitterId:'ops-22', submittedAt:'17:52', status:'待我审核' },
  { id:'APR-8813', objectType:'消息任务', name:'全站风控系统升级公告', version:'v3', risk:'关键', nature:'服务', audience:4280000, cost:'¥ 42,800', schedule:'07-13 02:00 UTC', step:'二级 + 风控', submitter:'Gary Ma', submitterId:'admin-01', submittedAt:'17:41', status:'待我审核' },
  { id:'APR-8814', objectType:'消息模板', name:'提现地址白名单变更', version:'v7', risk:'关键', nature:'强事务', audience:0, cost:'—', schedule:'发布后实时', step:'风控审核', submitter:'唐宁', submitterId:'risk-03', submittedAt:'16:36', status:'待我审核' },
  { id:'APR-8815', objectType:'自动化流程', name:'新用户首充 7 日旅程', version:'v5', risk:'中', nature:'营销', audience:58000, cost:'¥ 12,600/月', schedule:'审核后启用', step:'合规审核', submitter:'陈一', submitterId:'growth-08', submittedAt:'15:22', status:'待审核' },
  { id:'APR-8816', objectType:'紧急任务', name:'短信供应商故障切换', version:'v1', risk:'关键', nature:'强事务', audience:18400, cost:'¥ 2,120', schedule:'立即', step:'紧急授权', submitter:'赵辰', submitterId:'platform-11', submittedAt:'18:02', status:'紧急', emergency:true },
];

export const deliveries: DeliveryRecord[] = [
  { id:'DLV-90001', task:'提现安全通知', user:'UID 82***19', destination:'+65 *** 8812', channel:'短信', provider:'Twilio SG', status:'已送达', submittedAt:'18:03:12.202', deliveredAt:'18:03:14.408', retryCount:0, cost:'$0.041' },
  { id:'DLV-90002', task:'异常登录提醒', user:'UID 51***02', destination:'g***@mail.com', channel:'邮件', provider:'SendGrid', status:'已打开', submittedAt:'18:02:42.110', deliveredAt:'18:02:43.771', retryCount:0, cost:'$0.0008' },
  { id:'DLV-90003', task:'强平风险预警', user:'UID 18***87', destination:'+90 *** 2209', channel:'短信', provider:'Infobip TR', status:'临时失败', submittedAt:'18:01:21.091', deliveredAt:'—', error:'PROVIDER_TEMP · Gateway timeout', retryCount:2, cost:'—' },
  { id:'DLV-90004', task:'夏季交易赛召回', user:'UID 93***46', destination:'device ***c91', channel:'Push', provider:'FCM', status:'已点击', submittedAt:'17:58:32.244', deliveredAt:'17:58:33.002', retryCount:0, cost:'—' },
  { id:'DLV-90005', task:'ETH 网络维护公告', user:'UID 72***01', destination:'站内账户', channel:'站内信', provider:'NEXUS Inbox', status:'已送达', submittedAt:'17:55:10.002', deliveredAt:'17:55:10.018', retryCount:0, cost:'—' },
  { id:'DLV-90006', task:'新用户入金引导', user:'UID 33***29', destination:'m***@outlook.com', channel:'邮件', provider:'AWS SES', status:'合规拦截', submittedAt:'17:52:08.133', deliveredAt:'—', error:'COMPLIANCE · 用户已退订营销邮件', retryCount:0, cost:'—' },
  { id:'DLV-90007', task:'提现安全通知', user:'UID 16***88', destination:'device ***0ae', channel:'Push', provider:'APNs', status:'永久失败', submittedAt:'17:48:44.885', deliveredAt:'—', error:'ADDRESS · Invalid device token', retryCount:0, cost:'—' },
  { id:'DLV-90008', task:'异常登录提醒', user:'UID 40***16', destination:'+81 *** 2944', channel:'短信', provider:'Vonage JP', status:'已送达', submittedAt:'17:44:11.009', deliveredAt:'17:44:13.472', retryCount:0, cost:'$0.052' },
  { id:'DLV-90009', task:'VIP 等级月度通知', user:'UID 20***64', destination:'站内账户', channel:'站内信', provider:'NEXUS Inbox', status:'已打开', submittedAt:'17:42:32.420', deliveredAt:'17:42:32.438', retryCount:0, cost:'—' },
  { id:'DLV-90010', task:'网络维护公告', user:'UID 71***20', destination:'p***@proton.me', channel:'邮件', provider:'SendGrid', status:'已退信', submittedAt:'17:40:06.023', deliveredAt:'—', error:'ADDRESS · Mailbox unavailable', retryCount:0, cost:'$0.0008' },
];

export const providers: ChannelProvider[] = [
  { id:'CH-01', name:'NEXUS Inbox', channel:'站内信', regions:'全球', status:'运行正常', successRate:99.999, latency:18, qps:12000, balance:'内部服务', priority:1 },
  { id:'CH-02', name:'APNs / FCM', channel:'Push', regions:'全球', status:'运行正常', successRate:99.82, latency:164, qps:8000, balance:'免费', priority:1 },
  { id:'CH-03', name:'SendGrid Primary', channel:'邮件', regions:'Global / US', status:'轻微延迟', successRate:99.41, latency:820, qps:1200, balance:'$18,420', priority:1 },
  { id:'CH-04', name:'Twilio SMS', channel:'短信', regions:'62 个国家/地区', status:'运行正常', successRate:98.94, latency:1280, qps:420, balance:'$42,680', priority:1 },
];

export const policies: CompliancePolicy[] = [
  { id:'POL-EU-07', name:'EEA 营销触达', region:'EU/EEA', nature:'营销', channels:['Push','邮件','短信'], quietHours:'21:00–08:00 本地', consent:'单渠道明确授权', version:'v7', status:'已生效', effectiveAt:'2026-06-01' },
  { id:'POL-SG-04', name:'新加坡零售用户', region:'SG', nature:'全部', channels:['站内信','Push','邮件','短信'], quietHours:'22:00–08:00 本地', consent:'营销需授权', version:'v4', status:'已生效', effectiveAt:'2026-04-18' },
  { id:'POL-JP-09', name:'日本风险披露', region:'JP', nature:'服务/营销', channels:['站内信','Push','邮件'], quietHours:'21:00–09:00 本地', consent:'必须附风险文案', version:'v9', status:'已生效', effectiveAt:'2026-05-10' },
  { id:'POL-US-02', name:'美国受限地区', region:'US', nature:'全部', channels:['站内信','邮件'], quietHours:'20:00–09:00 本地', consent:'产品和州级限制', version:'v2', status:'审核中', effectiveAt:'2026-08-01' },
  { id:'POL-GLOBAL-12', name:'全球强事务通知', region:'Global', nature:'强事务', channels:['站内信','Push','邮件','短信'], quietHours:'可授权突破', consent:'不可退订', version:'v12', status:'已生效', effectiveAt:'2026-01-01' },
];
