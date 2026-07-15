import { useMemo, useState } from 'react';
import { Alert, Button, Input, Select, Tabs, Tag, Typography } from '@arco-design/web-react';
import type { TableColumnProps } from '@arco-design/web-react';
import PageHeader from '../../components/PageHeader';
import FilterBar from '../../components/FilterBar';
import ResourceTable from '../../components/ResourceTable';
import StatusTag from '../../components/StatusTag';
import ApprovalDrawer from './ApprovalDrawer';
import type { ApprovalItem } from '../../domain/types';
import { usePrototypeStore } from '../../store/prototypeStore';

export default function ApprovalCenterPage({ currentAdminId='admin-01' }: { currentAdminId?:string }) {
  const store=usePrototypeStore();
  const approvals=store.approvals;
  const [tab,setTab]=useState('mine');
  const [selected,setSelected]=useState<ApprovalItem>();
  const [keyword,setKeyword]=useState('');
  const [filterOne,setFilterOne]=useState<string>();
  const [filterTwo,setFilterTwo]=useState<string>();
  const pendingApprovals=useMemo(()=>approvals.filter((item)=>['待我审核','待审核','紧急'].includes(item.status)),[approvals]);
  const data=useMemo(()=>approvals.filter((item)=>(tab==='all'||tab==='mine'&&['待我审核','待审核','紧急'].includes(item.status)||tab==='emergency'&&item.emergency)&&`${item.id}${item.name}${item.submitter}`.toLowerCase().includes(keyword.toLowerCase())&&(!filterOne||item.risk===filterOne)&&(!filterTwo||item.objectType===filterTwo)),[approvals,tab,keyword,filterOne,filterTwo]);
  const selfItem=pendingApprovals.find((item)=>item.submitterId===currentAdminId);

  const approvalColumns:TableColumnProps<ApprovalItem>[]=[
    {title:'审批对象',width:260,render:(_,item)=><div><Typography.Text className="strong">{item.name}</Typography.Text><div className="mono muted">{item.id} · {item.objectType} · {item.version}</div></div>},
    {title:'风险',width:90,render:(_,item)=><Tag color={item.risk==='关键'?'red':item.risk==='高'?'orangered':'orange'}>{item.risk}</Tag>},
    {title:'影响范围',width:140,render:(_,item)=><div>{item.audience?item.audience.toLocaleString()+' 人':'模板发布'}<div className="muted">{item.cost}</div></div>},
    {title:'计划时间',dataIndex:'schedule',width:180},
    {title:'当前节点',dataIndex:'step',width:130},
    {title:'提交人',width:130,render:(_,item)=><div>{item.submitter}<div className="muted">{item.submittedAt}</div></div>},
    {title:'状态',width:110,render:(_,item)=><StatusTag status={item.status}/>},
    {title:'操作',fixed:'right',width:90,render:(_,item)=><Button type="text" onClick={()=>setSelected(item)}>审核</Button>},
  ];

  return <section className="page-stack">
    <PageHeader title="审核中心" description="统一处理消息任务和模板发布的业务与风控审批。"/>
    <Alert type="info" showIcon content="多语言生产与小语种专项审核在来源页面及多语言审核中完成；本页仅处理业务与风控审批。"/>
    {selfItem&&<div className="self-review-note"><strong>不可审核本人创建的任务</strong><span> · {selfItem.name} 已自动限制操作，可转交同级审核人。</span></div>}
    <Tabs activeTab={tab} onChange={setTab}><Tabs.TabPane key="mine" title={`待我审核 (${pendingApprovals.length})`}/><Tabs.TabPane key="all" title={`全部工单 (${approvals.length})`}/><Tabs.TabPane key="emergency" title={`紧急审批 (${pendingApprovals.filter((item)=>item.emergency).length})`}/></Tabs>
    <FilterBar onReset={()=>{setKeyword('');setFilterOne(undefined);setFilterTwo(undefined);}}><Input.Search value={keyword} onChange={setKeyword} placeholder="搜索审批单或对象" style={{width:280}}/><Select value={filterOne} onChange={setFilterOne} allowClear placeholder="风险等级" style={{width:140}} options={['低','中','高','关键'].map((value)=>({label:value,value}))}/><Select value={filterTwo} onChange={setFilterTwo} allowClear placeholder="对象类型" style={{width:150}} options={['消息任务','消息模板','紧急任务'].map((value)=>({label:value,value}))}/></FilterBar>
    <ResourceTable data={data} columns={approvalColumns} rowKey="id"/>
    <ApprovalDrawer item={selected} visible={Boolean(selected)} onClose={()=>setSelected(undefined)} currentAdminId={currentAdminId}/>
  </section>;
}
