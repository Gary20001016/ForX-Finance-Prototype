import { Alert, Card, Descriptions, Grid, Progress, Space, Tag, Timeline } from '@arco-design/web-react';

export default function TaskSummary() {
  return <div className="summary-grid">
    <div className="summary-main">
      <Alert type="warning" showIcon title="高影响任务" content="预计触达 328,400 人，包含 EU/EEA 营销用户，将执行授权、退订、安静时段和频控复核。" />
      <Card title="最终内容预览" bordered={false} className="inner-card"><div className="message-preview compact"><span className="preview-label">PUSH · zh-CN</span><h3>夏季交易赛已开启</h3><p>瓜分 500,000 USDT 奖池，完成交易任务赢取奖励。</p><Space><Tag color="purple">Push</Tag><Tag color="cyan">邮件</Tag><Tag>zh-CN + 2</Tag></Space></div></Card>
      <Card title="受众计算漏斗" bordered={false} className="inner-card"><Grid.Row gutter={12}>{[['原始分群','352,840'],['合规过滤','- 12,480'],['退订过滤','- 8,420'],['频控过滤','- 3,540'],['最终可发送','328,400']].map(([label,value],i)=><Grid.Col span={i===4?8:4} key={label}><div className={i===4?'funnel-box primary':'funnel-box'}><span>{label}</span><strong>{value}</strong></div></Grid.Col>)}</Grid.Row></Card>
    </div>
    <div className="summary-side">
      <Card title="任务摘要" bordered={false} className="inner-card"><Descriptions column={1} data={[{label:'消息性质',value:'营销 · 中风险'},{label:'发送时间',value:'2026-07-13 20:00 UTC+8'},{label:'渠道策略',value:'Push → 邮件降级'},{label:'预计成本',value:'¥ 8,420'},{label:'有效期',value:'发送后 24 小时'}]} /></Card>
      <Card title="审批链" bordered={false} className="inner-card"><Timeline><Timeline.Item dotColor="green">多语言人工审核 · 已通过</Timeline.Item><Timeline.Item>业务内容审核 · 增长负责人</Timeline.Item><Timeline.Item>风险与合规审核 · Risk Control</Timeline.Item><Timeline.Item>发送调度 · 自动执行</Timeline.Item></Timeline><Progress percent={50} status="warning" /></Card>
    </div>
  </div>;
}
