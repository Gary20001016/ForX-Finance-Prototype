import { useState } from 'react';
import { Alert, Button, Card, Descriptions, Drawer, Grid, Input, Message, Progress, Space, Statistic, Tag } from '@arco-design/web-react';
import { IconPlus, IconSettings } from '@arco-design/web-react/icon';
import PageHeader from '../../components/PageHeader';
import StatusTag from '../../components/StatusTag';
import { providers } from '../../mocks/data';
import type { ChannelProvider } from '../../domain/types';
import { openDetailedForm } from '../../utils/prototypeActions';

export default function ChannelManagementPage(){
  const [selected,setSelected]=useState<ChannelProvider>();
  return <section className="page-stack">
    <PageHeader title="渠道管理" description="配置发送账号、供应商路由、限流、成本和故障切换。" actions={<Button type="primary" icon={<IconPlus/>} onClick={() => openDetailedForm('provider', '接入渠道供应商')}>接入供应商</Button>} />
    <Alert type="warning" content="生产凭证存放在密钥管理系统，后台只展示引用和轮换状态，不回显明文。"/>
    <Grid.Row gutter={[16,16]}>{providers.map(p=><Grid.Col xs={24} md={12} key={p.id}><Card className="provider-card" bordered={false} title={<Space><span className="provider-logo">{p.channel.slice(0,1)}</span><div><strong>{p.name}</strong><div className="muted">{p.channel} · {p.regions}</div></div></Space>} extra={<Button type="text" icon={<IconSettings/>} onClick={()=>setSelected(p)}>配置</Button>}><div className="provider-status"><StatusTag status={p.status}/><Tag>路由优先级 P{p.priority}</Tag></div><Grid.Row gutter={16}><Grid.Col span={6}><Statistic title="成功率" value={p.successRate} suffix="%" precision={2}/></Grid.Col><Grid.Col span={6}><Statistic title="P95 延迟" value={p.latency} suffix="ms"/></Grid.Col><Grid.Col span={6}><Statistic title="限流" value={p.qps} suffix=" QPS"/></Grid.Col><Grid.Col span={6}><Statistic title="余额" value={p.balance}/></Grid.Col></Grid.Row><Progress percent={p.successRate} showText={false} size="small" status={p.successRate<99.5?'warning':'success'}/></Card></Grid.Col>)}</Grid.Row>
    <Drawer width={600} visible={Boolean(selected)} title={selected?`配置 ${selected.name}`:'渠道配置'} onCancel={()=>setSelected(undefined)} footer={<Space><Button onClick={()=>setSelected(undefined)}>取消</Button><Button onClick={()=>Message.success('测试连接成功')}>测试连接</Button><Button type="primary" onClick={()=>Message.success('配置变更已提交审核')}>提交变更</Button></Space>}>{selected&&<div className="channel-form"><Descriptions column={2} border data={[{label:'供应商 ID',value:selected.id},{label:'渠道',value:selected.channel},{label:'适用地区',value:selected.regions},{label:'状态',value:<StatusTag status={selected.status}/>}]} /><label>API Endpoint<Input defaultValue="https://api.provider.example/v2/messages"/></label><label>凭证引用<Input.Password defaultValue="kms://prod/message-provider/primary" visibilityToggle={false}/></label><label>回调地址<Input defaultValue="https://callback.forxfinance.example/delivery"/></label><div className="field-pair"><label>QPS<Input defaultValue={String(selected.qps)}/></label><label>超时<Input defaultValue="3000 ms"/></label></div></div>}</Drawer>
  </section>;
}
