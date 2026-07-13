import { Button, Card, Grid, Progress, Select, Statistic, Tag } from '@arco-design/web-react';
import { IconDownload } from '@arco-design/web-react/icon';
import PageHeader from '../../components/PageHeader';
import FilterBar from '../../components/FilterBar';
import { confirmPrototypeAction } from '../../utils/prototypeActions';

const categories = [
  ['系统公告',82.4,420],['交易通知',72.8,1280],['资产通知',91.6,860],['安全通知',94.2,310],
  ['奖励通知',67.5,580],['活动通知',48.9,920],['风控通知',96.8,190],
];

export default function AnalyticsPage(){
  return <section className="page-stack">
    <PageHeader eyebrow="MESSAGE INSIGHTS" title="数据分析" description="关注消息生成、阅读、点击、过期未读和重要风险消息的触达效果。" actions={<Button icon={<IconDownload/>} onClick={() => confirmPrototypeAction('导出分析报表','报表按当前筛选条件导出，不包含明文 UID。','报表导出任务已创建')}>导出报表</Button>} />
    <FilterBar>
      <Select defaultValue="近7天" style={{width:120}}><Select.Option value="近7天">近7天</Select.Option><Select.Option value="近30天">近30天</Select.Option></Select>
      <Select placeholder="消息分类" style={{width:140}} />
      <Select placeholder="消息来源" style={{width:140}}><Select.Option value="event">系统事件</Select.Option><Select.Option value="manual">人工发送</Select.Option></Select>
      <Select placeholder="风险等级" style={{width:140}} />
      <Select placeholder="受众类型" style={{width:140}} />
      <Select placeholder="语言" style={{width:120}} />
      <Select defaultValue="Web" style={{width:120}}><Select.Option value="Web">Web</Select.Option><Select.Option value="App" disabled>App · 未接入</Select.Option></Select>
    </FilterBar>
    <div className="analytics-kpis v2-kpis">{[
      ['生成消息数','26.40M','+6.8%'],['触达用户数','24.82M','去重 UID'],['阅读率','34.26%','+2.1pp'],['点击率','8.87%','+0.6pp'],['过期未读','18,420','-12.4%'],
    ].map(([title,value,note])=><Card key={title} bordered={false}><Statistic title={title} value={value}/><span className="kpi-note">{note}</span></Card>)}</div>
    <Grid.Row gutter={[16,16]}>
      <Grid.Col xs={24} lg={15}><Card bordered={false} className="surface" title="阅读与点击趋势" extra={<Tag>数据延迟 8 分钟</Tag>}><div className="reading-trend">{[
        ['07-07',42,12],['07-08',55,18],['07-09',48,15],['07-10',68,24],['07-11',62,20],['07-12',78,29],['07-13',72,26],
      ].map(([day,read,click])=><div key={day as string}><div className="trend-bars"><i style={{height:`${read}%`}}/><b style={{height:`${click}%`}}/></div><span>{day}</span></div>)}</div><div className="trend-legend"><span><i/>阅读用户</span><span><b/>点击用户</span></div></Card></Grid.Col>
      <Grid.Col xs={24} lg={9}><Card bordered={false} className="surface risk-metric-card" title="风险消息阅读时效" extra={<Tag color="red">紧急</Tag>}><div className="risk-read-metric"><span>5 分钟阅读率</span><strong>72.8%</strong><Progress percent={72.8} status="warning" showText={false}/></div><div className="risk-read-metric"><span>30 分钟阅读率</span><strong>94.6%</strong><Progress percent={94.6} status="success" showText={false}/></div><div className="risk-unread-alert"><span>过期仍未读</span><strong>286</strong><small>强平 42 · 提现风险 86 · 账户异常 158</small></div></Card></Grid.Col>
    </Grid.Row>
    <Grid.Row gutter={[16,16]}>
      <Grid.Col xs={24} lg={16}><Card bordered={false} className="surface" title="分类表现"><div className="category-performance"><div className="category-head"><span>消息分类</span><span>消息量</span><span>阅读率</span><span>表现</span></div>{categories.map(([name,rate,count])=><div key={name as string}><strong>{name}</strong><span>{count}K</span><span>{rate}%</span><Progress percent={rate as number} size="small" showText={false} status={(rate as number)>90?'success':'normal'}/></div>)}</div></Card></Grid.Col>
      <Grid.Col xs={24} lg={8}><Card bordered={false} className="surface" title="来源对比"><div className="source-comparison"><div><span>系统事件</span><strong>18.42M</strong><small>阅读率 81.6% · 点击率 12.4%</small></div><div><span>人工发送</span><strong>6.40M</strong><small>阅读率 48.9% · 点击率 6.2%</small></div></div></Card></Grid.Col>
    </Grid.Row>
  </section>;
}
