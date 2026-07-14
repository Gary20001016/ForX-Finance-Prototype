import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Input, Select, Tabs, Tag, Typography } from '@arco-design/web-react';
import { useLocation } from 'react-router-dom';
import type { TableColumnProps } from '@arco-design/web-react';
import PageHeader from '../../components/PageHeader';
import FilterBar from '../../components/FilterBar';
import ResourceTable from '../../components/ResourceTable';
import StatusTag from '../../components/StatusTag';
import ApprovalDrawer from './ApprovalDrawer';
import TranslationReviewDrawer from './TranslationReviewDrawer';
import type { ApprovalItem, TranslationItem } from '../../domain/types';
import { usePrototypeStore } from '../../store/prototypeStore';

export default function ApprovalCenterPage({ currentAdminId='admin-01' }: { currentAdminId?:string }) {
  const store=usePrototypeStore();
  const location=useLocation();
  const approvals=store.approvals;
  const translationReviews=useMemo(()=>store.translationBatches.flatMap((batch)=>batch.items).filter((item)=>item.status==='待人工审核'),[store.translationBatches]);
  const routeState=location.state as {tab?:string;translationItemId?:string} | null;
  const [tab,setTab]=useState(routeState?.tab||'mine');
  const [selected,setSelected]=useState<ApprovalItem>();
  const [translationItem,setTranslationItem]=useState<TranslationItem>();
  const [keyword,setKeyword]=useState('');
  const [filterOne,setFilterOne]=useState<string>();
  const [filterTwo,setFilterTwo]=useState<string>();
  const pendingApprovals=useMemo(()=>approvals.filter((item)=>['待我审核','待审核','紧急'].includes(item.status)),[approvals]);
  const data=useMemo(()=>approvals.filter((item)=>(tab==='all'||tab==='mine'&&['待我审核','待审核','紧急'].includes(item.status)||tab==='emergency'&&item.emergency)&&`${item.id}${item.name}${item.submitter}`.toLowerCase().includes(keyword.toLowerCase())&&(!filterOne||item.risk===filterOne)&&(!filterTwo||item.objectType===filterTwo)),[approvals,tab,keyword,filterOne,filterTwo]);
  const translationData=translationReviews.filter((item)=>`${item.templateName}${item.targetLocale}${item.externalTaskId}`.toLowerCase().includes(keyword.toLowerCase())&&(!filterOne||item.targetLocale===filterOne)&&(!filterTwo||item.status===filterTwo));
  const selfItem=pendingApprovals.find((item)=>item.submitterId===currentAdminId);
  useEffect(()=>{if(routeState?.translationItemId){const item=translationReviews.find((candidate)=>candidate.id===routeState.translationItemId);if(item)setTranslationItem(item);}},[routeState?.translationItemId,translationReviews]);

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

  const translationColumns:TableColumnProps<TranslationItem>[]=[
    {title:'模板 / 目标语言',width:250,render:(_,item)=><div><Typography.Text className="strong">{item.templateName}</Typography.Text><div><Tag color="arcoblue">{item.sourceLocale} → {item.targetLocale}</Tag></div></div>},
    {title:'平台子任务',dataIndex:'id',width:140,render:(value)=><span className="mono">{value}</span>},
    {title:'外部任务 ID',dataIndex:'externalTaskId',width:190,render:(value)=><span className="mono">{value}</span>},
    {title:'变量检查',width:110,render:(_,item)=><Tag color={item.variablesValid?'green':'red'}>{item.variablesValid?'通过':'失败'}</Tag>},
    {title:'机翻完成',dataIndex:'translatedAt',width:130},
    {title:'提交人',width:120,render:(_,item)=><div>{item.submitter}<div className="muted">{item.submittedAt}</div></div>},
    {title:'状态',width:120,render:(_,item)=><StatusTag status={item.status}/>},
    {title:'操作',fixed:'right',width:100,render:(_,item)=><Button type="text" onClick={()=>setTranslationItem(item)}>审核翻译</Button>},
  ];

  const isTranslation=tab==='translation';
  return <section className="page-stack">
    <PageHeader title="审核中心" description="先完成人工翻译审核，再按风险等级执行独立业务审批。"/>
    <Alert type="info" showIcon content="多语言模板必须所有目标语言人工审核通过后，才能进入业务审核和发布；高风险任务仍需独立双审。"/>
    {!isTranslation&&selfItem&&<div className="self-review-note"><strong>不可审核本人创建的任务</strong><span> · {selfItem.name} 已自动限制操作，可转交同级审核人。</span></div>}
    <Tabs activeTab={tab} onChange={setTab}><Tabs.TabPane key="mine" title={`待我审核 (${pendingApprovals.length})`}/><Tabs.TabPane key="translation" title={`翻译审核 (${translationReviews.length})`}/><Tabs.TabPane key="all" title={`全部工单 (${approvals.length})`}/><Tabs.TabPane key="emergency" title={`紧急审批 (${pendingApprovals.filter((item)=>item.emergency).length})`}/></Tabs>
    <FilterBar onReset={()=>{setKeyword('');setFilterOne(undefined);setFilterTwo(undefined);}}><Input.Search value={keyword} onChange={setKeyword} placeholder={isTranslation?'搜索模板、语言或外部任务 ID':'搜索审批单或对象'} style={{width:280}}/><Select value={filterOne} onChange={setFilterOne} allowClear placeholder={isTranslation?'目标语言':'风险等级'} style={{width:140}} options={(isTranslation?['en-US','tr-TR','ru-RU','ja-JP']:['低','中','高','关键']).map((value)=>({label:value,value}))}/><Select value={filterTwo} onChange={setFilterTwo} allowClear placeholder={isTranslation?'翻译状态':'对象类型'} style={{width:150}} options={(isTranslation?['待人工审核','审核通过','审核驳回']:['消息任务','消息模板','紧急任务']).map((value)=>({label:value,value}))}/></FilterBar>
    {isTranslation?<ResourceTable data={translationData} columns={translationColumns} rowKey="id"/>:<ResourceTable data={data} columns={approvalColumns} rowKey="id"/>}
    <ApprovalDrawer item={selected} visible={Boolean(selected)} onClose={()=>setSelected(undefined)} currentAdminId={currentAdminId}/>
    <TranslationReviewDrawer item={translationItem} visible={Boolean(translationItem)} onClose={()=>setTranslationItem(undefined)} currentAdmin="reviewer-02"/>
  </section>;
}
