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
import { useCurrentPagePermission } from '../../components/PagePermissionBoundary';

export default function ApprovalCenterPage({ currentAdminId='admin-01' }: { currentAdminId?:string }) {
  const { canWrite } = useCurrentPagePermission();
  const store=usePrototypeStore();
  const approvals=store.approvals;
  const [tab,setTab]=useState('mine');
  const [selected,setSelected]=useState<ApprovalItem>();
  const [keyword,setKeyword]=useState('');
  const [filterOne,setFilterOne]=useState<string>();
  const [filterTwo,setFilterTwo]=useState<string>();
  const isRuleReplacement=(item:ApprovalItem)=>item.objectType==='事件通知规则'&&Boolean(item.replacementRuleIds?.length);
  const pendingApprovals=useMemo(()=>approvals.filter((item)=>item.assigneeId===currentAdminId&&['待我审核','待审核','紧急'].includes(item.status)),[approvals,currentAdminId]);
  const data=useMemo(()=>approvals.filter((item)=>(tab==='all'||tab==='mine'&&item.assigneeId===currentAdminId&&['待我审核','待审核','紧急'].includes(item.status)||tab==='emergency'&&item.assigneeId===currentAdminId&&item.emergency)&&`${item.id}${item.name}${item.submitter}${item.assignee||''}`.toLowerCase().includes(keyword.toLowerCase())&&(!filterOne||item.risk===filterOne)&&(!filterTwo||item.objectType===filterTwo)),[approvals,currentAdminId,tab,keyword,filterOne,filterTwo]);
  const approvalColumns:TableColumnProps<ApprovalItem>[]=[
    {title:'审批对象',width:260,render:(_,item)=><div><Typography.Text className="strong">{item.name}</Typography.Text>{isRuleReplacement(item)&&<div><Tag color="orange">规则交替</Tag></div>}<div className="mono muted">{item.id} · {item.objectType}</div></div>},
    {title:'风险',width:90,render:(_,item)=><Tag color={item.risk==='关键'?'red':item.risk==='高'?'orangered':'orange'}>{item.risk}</Tag>},
    {title:'影响范围',width:160,render:(_,item)=>isRuleReplacement(item)?<div><div>启用 1 条新规则</div><div className="muted">停用 {item.replacementRuleIds!.length} 条旧规则</div></div>:<div>{item.audience?item.audience.toLocaleString()+' 人':'模板发布'}<div className="muted">{item.cost}</div></div>},
    {title:'计划时间',dataIndex:'schedule',width:180},
    {title:'提交人',width:130,render:(_,item)=><div>{item.submitter}<div className="muted">{item.submittedAt}</div></div>},
    {title:'审核人',width:120,render:(_,item)=><div>{item.assignee||'未指派'}<div className="mono muted">{item.assigneeId||'—'}</div></div>},
    {title:'状态',width:110,render:(_,item)=><StatusTag status={item.status}/>},
    {title:'操作',fixed:'right',width:90,render:(_,item)=><Button type="text" onClick={()=>setSelected(item)}>{canWrite&&item.assigneeId===currentAdminId&&item.submitterId!==currentAdminId?'审核':'查看'}</Button>},
  ];

  return <section className="page-stack">
    <PageHeader title="审核中心" description="统一处理人工任务、消息模板和事件通知规则审核。"/>
    <Alert type="info" showIcon content="每张待审核工单随机指派给一名具备审核中心写权限的审核人，发起者不会收到自己的工单；审核人失去权限时系统自动改派。"/>
    <Tabs activeTab={tab} onChange={setTab}><Tabs.TabPane key="mine" title={`待我审核 (${pendingApprovals.length})`}/><Tabs.TabPane key="all" title={`全部工单 (${approvals.length})`}/><Tabs.TabPane key="emergency" title={`紧急审批 (${pendingApprovals.filter((item)=>item.emergency).length})`}/></Tabs>
    <FilterBar onReset={()=>{setKeyword('');setFilterOne(undefined);setFilterTwo(undefined);}}><Input.Search value={keyword} onChange={setKeyword} placeholder="搜索审批单或对象" style={{width:280}}/><Select value={filterOne} onChange={setFilterOne} allowClear placeholder="风险等级" style={{width:140}} options={['低','中','高','关键'].map((value)=>({label:value,value}))}/><Select value={filterTwo} onChange={setFilterTwo} allowClear placeholder="对象类型" style={{width:170}} options={['消息任务','消息模板','事件消息模板','事件通知规则','紧急任务'].map((value)=>({label:value,value}))}/></FilterBar>
    <ResourceTable data={data} columns={approvalColumns} rowKey="id"/>
    <ApprovalDrawer item={selected} visible={Boolean(selected)} onClose={()=>setSelected(undefined)} currentAdminId={currentAdminId} canWrite={canWrite}/>
  </section>;
}
