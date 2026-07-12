import { Alert, Button, Card, Grid, Progress, Select, Space, Table, Tag, Timeline, Typography } from '@arco-design/web-react';
import { IconCalendar, IconCheckCircle, IconClockCircle, IconEmail, IconExclamationCircle, IconSend } from '@arco-design/web-react/icon';
import PageHeader from '../../components/PageHeader';
import MetricCard from '../../components/MetricCard';
import StatusTag from '../../components/StatusTag';
import { tasks } from '../../mocks/data';

const { Row, Col } = Grid;
const days = [58,72,66,84,75,92,88];

export default function DashboardPage() {
  return <section className="page-stack">
    <PageHeader eyebrow="CONTROL TOWER" title="消息运营工作台" description="监控全球消息触达、审核队列与渠道健康状态。" actions={<><Select defaultValue="今日" style={{width:110}}><Select.Option value="今日">今日</Select.Option><Select.Option value="近7天">近7天</Select.Option></Select><Button icon={<IconCalendar />}>2026-07-13 · UTC+8</Button></>} />
    <Alert type="warning" showIcon content="SendGrid US-East 延迟升高 18%，系统已将 EU 事务邮件切换至 AWS SES。" action={<Button size="small">查看告警</Button>} />
    <Row gutter={[16,16]}>
      <Col xs={24} sm={12} lg={6}><MetricCard title="今日发送" value="12.84M" change="8.2%" icon={<IconSend />} /></Col>
      <Col xs={24} sm={12} lg={6}><MetricCard title="送达率" value="99.42" suffix="%" change="0.18%" icon={<IconCheckCircle />} /></Col>
      <Col xs={24} sm={12} lg={6}><MetricCard title="待审核" value={12} change="3 项新增" positive={false} icon={<IconClockCircle />} /></Col>
      <Col xs={24} sm={12} lg={6}><MetricCard title="今日成本" value="¥86,420" change="4.1%" positive={false} icon={<IconEmail />} /></Col>
    </Row>
    <div className="dashboard-grid">
      <Card className="surface chart-card" title="发送趋势" extra={<Space><Tag>站内信</Tag><Tag color="purple">Push</Tag><Tag color="cyan">邮件</Tag><Tag color="orange">短信</Tag></Space>} bordered={false}>
        <div className="bar-chart">{days.map((height, index) => <div className="bar-group" key={index}><div className="bar-stack" style={{height:`${height}%`}}><i /><i /><i /></div><span>{['07/07','07/08','07/09','07/10','07/11','07/12','07/13'][index]}</span></div>)}</div>
      </Card>
      <Card className="surface" title="渠道健康" bordered={false}>
        {[['站内信','99.999%',100,'正常'],['Push','99.82%',98,'正常'],['邮件','99.41%',91,'轻微延迟'],['短信','98.94%',95,'正常']].map(([name,rate,percent,status]) => <div className="health-row" key={name as string}><div><strong>{name}</strong><span>{rate} 成功</span></div><Progress percent={percent as number} size="small" showText={false} status={status === '正常' ? 'success':'warning'} /><StatusTag status={status as string === '正常' ? '运行正常' : '轻微延迟'} /></div>)}
      </Card>
    </div>
    <div className="dashboard-grid wide-left">
      <Card className="surface" title="进行中的关键任务" bordered={false}><Table pagination={false} rowKey="id" data={tasks.slice(0,5)} columns={[{title:'任务',dataIndex:'name'},{title:'目标用户',render:(_,r) => r.audienceCount.toLocaleString()},{title:'状态',render:(_,r) => <StatusTag status={r.status} />},{title:'成功率',render:(_,r) => r.successRate ? `${r.successRate}%`:'—'}]} /></Card>
      <Card className="surface" title="实时动态" bordered={false}><Timeline pending="持续监控中">{['18:03 提现通知完成第 12 个分片','18:02 短信供应商故障切换待审批','17:58 夏季交易赛模板通过内容审核','17:44 风控规则 POL-EU-07 发布'].map((item,index) => <Timeline.Item key={item} dot={index===1?<IconExclamationCircle style={{color:'#f79009'}}/>:undefined}><Typography.Text>{item}</Typography.Text></Timeline.Item>)}</Timeline></Card>
    </div>
  </section>;
}
