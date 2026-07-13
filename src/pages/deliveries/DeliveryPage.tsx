import { useState } from 'react';
import { Alert, Button, Descriptions, Drawer, Input, Message, Modal, Select, Space, Tabs, Tag, Typography } from '@arco-design/web-react';
import { IconDownload, IconRefresh } from '@arco-design/web-react/icon';
import type { TableColumnProps } from '@arco-design/web-react';
import PageHeader from '../../components/PageHeader';
import FilterBar from '../../components/FilterBar';
import ResourceTable from '../../components/ResourceTable';
import StatusTag from '../../components/StatusTag';
import { deliveries } from '../../mocks/data';
import type { DeliveryRecord } from '../../domain/types';
import { confirmPrototypeAction } from '../../utils/prototypeActions';

export default function DeliveryPage(){
  const [selected,setSelected]=useState<DeliveryRecord>();
  const columns:TableColumnProps<DeliveryRecord>[]=[
    {title:'发送实例',width:200,render:(_,r)=><div><span className="mono">{r.id}</span><div className="muted">{r.task}</div></div>},
    {title:'用户',dataIndex:'user',width:130},
    {title:'目标地址',dataIndex:'destination',width:170,render:v=><span className="mono">{v}</span>},
    {title:'渠道 / 供应商',width:160,render:(_,r)=><div><Tag>{r.channel}</Tag><div className="muted">{r.provider}</div></div>},
    {title:'状态',width:120,render:(_,r)=><StatusTag status={r.status}/>},
    {title:'提交 / 送达',width:190,render:(_,r)=><div>{r.submittedAt}<div className="muted">{r.deliveredAt}</div></div>},
    {title:'错误',width:250,render:(_,r)=><span className={r.error?'error-copy':'muted'}>{r.error||'—'}</span>},
    {title:'重试',dataIndex:'retryCount',width:70},{title:'费用',dataIndex:'cost',width:90},
    {title:'操作',fixed:'right',width:80,render:(_,r)=><Button type="text" onClick={()=>setSelected(r)}>详情</Button>},
  ];
  return <section className="page-stack">
    <PageHeader title="发送记录" description="按用户消息和渠道实例追踪受理、送达、打开、失败与成本。" actions={<><Button icon={<IconRefresh/>} onClick={()=>Message.success('已刷新最新供应商回执')}>刷新回执</Button><Button icon={<IconDownload/>} onClick={()=>Modal.confirm({title:'申请导出',content:'导出文件默认脱敏，包含 PII 时需要单独审批。',okText:'提交申请',onOk:()=>{ Message.success('导出申请已提交'); }})}>申请导出</Button></>} />
    <Alert type="info" content="目标地址默认脱敏。查看完整手机号、邮箱或供应商原始回执需要 PII 权限并记录审计日志。"/>
    <Tabs defaultActiveTab="channel"><Tabs.TabPane key="messages" title="用户消息 (8.42M)"/><Tabs.TabPane key="channel" title="渠道明细 (12.84M)"/><Tabs.TabPane key="failures" title="失败记录 (18,420)"/></Tabs>
    <FilterBar><Input.Search placeholder="搜索实例 ID、任务或 UID" style={{width:280}}/><Select placeholder="渠道" style={{width:130}}><Select.Option value="push">Push</Select.Option><Select.Option value="sms">短信</Select.Option></Select><Select placeholder="状态" style={{width:150}}><Select.Option value="delivered">已送达</Select.Option><Select.Option value="failed">失败</Select.Option></Select><Button status="danger" onClick={()=>setSelected(deliveries.find(d=>d.error))}>查看失败原因</Button></FilterBar>
    <ResourceTable data={deliveries} columns={columns} rowKey="id"/>
    <Drawer width={620} visible={Boolean(selected)} title={selected?`${selected.id} · 发送详情`:'发送详情'} onCancel={()=>setSelected(undefined)} footer={selected?.error?<Space><Button onClick={() => confirmPrototypeAction('加入抑制名单',`将 ${selected.destination} 加入 ${selected.channel} 抑制名单，后续营销触达会被阻止。`,'已加入抑制名单')}>加入抑制名单</Button><Button type="primary" disabled={!selected.error.includes('TEMP')} onClick={()=>Message.success('重试申请已提交审核')}>申请重试</Button></Space>:null}>
      {selected&&<><Descriptions column={2} border data={[{label:'任务',value:selected.task},{label:'UID',value:selected.user},{label:'渠道',value:selected.channel},{label:'供应商',value:selected.provider},{label:'目标',value:selected.destination},{label:'状态',value:<StatusTag status={selected.status}/>},{label:'提交时间',value:selected.submittedAt},{label:'送达时间',value:selected.deliveredAt},{label:'重试次数',value:selected.retryCount},{label:'费用',value:selected.cost}]} />{selected.error&&<Alert style={{marginTop:20}} type="error" title="失败原因" content={selected.error}/>}<div className="receipt-block"><Typography.Text bold>回执时间线</Typography.Text><p>18:01:21.091 · 提交供应商</p><p>18:01:23.881 · Gateway timeout</p><p>18:02:02.112 · 指数退避重试 #2</p></div></>}
    </Drawer>
  </section>;
}
