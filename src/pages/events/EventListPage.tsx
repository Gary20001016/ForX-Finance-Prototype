import { Button, Input, Select, Tag, Typography } from '@arco-design/web-react';
import { IconPlus } from '@arco-design/web-react/icon';
import PageHeader from '../../components/PageHeader';
import FilterBar from '../../components/FilterBar';
import ResourceTable from '../../components/ResourceTable';
import StatusTag from '../../components/StatusTag';
import { openDetailedForm } from '../../utils/prototypeActions';

const events = [
  {id:'deposit.credited',name:'充值到账',line:'资产',version:'1.0.0',template:'deposit_credited v1',caller:'wallet-gateway',calls:'42.8K',failure:'0.04%',last:'18:06:31',status:'运行正常'},
  {id:'withdrawal.succeeded',name:'提现成功',line:'资产',version:'1.0.0',template:'withdrawal_succeeded v1',caller:'withdrawal-service',calls:'18.4K',failure:'0.02%',last:'18:06:42',status:'运行正常'},
  {id:'withdrawal.failed',name:'提现失败',line:'资产',version:'1.0.0',template:'withdrawal_failed v1',caller:'withdrawal-service',calls:'316',failure:'0.08%',last:'18:05:18',status:'运行正常'},
  {id:'order.filled',name:'订单成交',line:'交易',version:'1.0.0',template:'order_filled v1',caller:'order-service',calls:'1.28M',failure:'0.01%',last:'18:06:45',status:'运行正常'},
  {id:'liquidation.warning',name:'合约强平预警',line:'风控',version:'1.0.0',template:'liquidation_warning v1',caller:'futures-risk',calls:'12.3K',failure:'1.84%',last:'18:06:35',status:'轻微延迟'},
  {id:'trial_fund.credited',name:'体验金到账',line:'奖励',version:'1.0.0',template:'trial_fund_credited v1',caller:'reward-service',calls:'8.2K',failure:'0.03%',last:'18:04:22',status:'运行正常'},
  {id:'points.credited',name:'积分到账',line:'奖励',version:'1.0.0',template:'points_credited v1',caller:'loyalty-service',calls:'36.5K',failure:'0.02%',last:'18:03:10',status:'运行正常'},
  {id:'commission.credited',name:'返佣到账',line:'奖励',version:'1.0.0',template:'commission_credited v1',caller:'broker-service',calls:'16.8K',failure:'0.05%',last:'18:02:48',status:'运行正常'},
];

export default function EventListPage(){
  return <section className="page-stack">
    <PageHeader title="系统事件" description="管理充值、提现、成交、风控和奖励事件的模板绑定与调用质量。" actions={<Button type="primary" icon={<IconPlus />} onClick={() => openDetailedForm('event','注册业务事件')}>注册事件</Button>}/>
    <FilterBar><Input.Search placeholder="搜索事件编码或名称" style={{width:280}}/><Select placeholder="业务线" style={{width:140}}><Select.Option value="asset">资产</Select.Option><Select.Option value="trade">交易</Select.Option><Select.Option value="risk">风控</Select.Option><Select.Option value="reward">奖励</Select.Option></Select><Select placeholder="调用状态" style={{width:140}}><Select.Option value="healthy">运行正常</Select.Option><Select.Option value="delayed">轻微延迟</Select.Option></Select></FilterBar>
    <ResourceTable data={events} rowKey="id" columns={[
      {title:'事件',width:280,render:(_,r)=><div><Typography.Text className="strong">{r.name}</Typography.Text><div className="mono muted">{r.id}</div></div>},
      {title:'业务线',dataIndex:'line',width:90},{title:'版本',dataIndex:'version',width:90},{title:'绑定模板',dataIndex:'template',width:180},
      {title:'调用方',dataIndex:'caller',width:170,render:v=><Tag>{v}</Tag>},{title:'近24h调用',dataIndex:'calls',width:110},{title:'失败率',dataIndex:'failure',width:90},{title:'最后调用',dataIndex:'last',width:120},{title:'状态',width:110,render:(_,r)=><StatusTag status={r.status}/>},
    ]} />
  </section>;
}
