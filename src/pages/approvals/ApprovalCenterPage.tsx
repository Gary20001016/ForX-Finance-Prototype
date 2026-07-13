import { useMemo, useState } from 'react';
import { Alert, Button, Input, Select, Tabs, Tag, Typography } from '@arco-design/web-react';
import type { TableColumnProps } from '@arco-design/web-react';
import PageHeader from '../../components/PageHeader';
import FilterBar from '../../components/FilterBar';
import ResourceTable from '../../components/ResourceTable';
import StatusTag from '../../components/StatusTag';
import ApprovalDrawer from './ApprovalDrawer';
import TranslationReviewDrawer from './TranslationReviewDrawer';
import { approvals, translationBatches } from '../../mocks/data';
import type { ApprovalItem, TranslationItem } from '../../domain/types';

const translationReviews = translationBatches.flatMap((batch)=>batch.items).filter((item)=>item.status==='待人工审核');

export default function ApprovalCenterPage({ currentAdminId='admin-01' }: { currentAdminId?:string }) {
  const [tab,setTab]=useState('mine');
  const [selected,setSelected]=useState<ApprovalItem>();
  const [translationItem,setTranslationItem]=useState<TranslationItem>();
  const data=useMemo(()=>tab==='emergency'?approvals.filter((item)=>item.emergency):approvals,[tab]);
  const selfItem=approvals.find((item)=>item.submitterId===currentAdminId);

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
    <PageHeader eyebrow="MAKER–CHECKER" title="审核中心" description="先完成人工翻译审核，再按风险等级执行独立业务审批。"/>
    <Alert type="info" showIcon content="多语言模板必须所有目标语言人工审核通过后，才能进入业务审核和发布；高风险任务仍需独立双审。"/>
    {!isTranslation&&selfItem&&<div className="self-review-note"><strong>不可审核本人创建的任务</strong><span> · {selfItem.name} 已自动限制操作，可转交同级审核人。</span></div>}
    <Tabs activeTab={tab} onChange={setTab}><Tabs.TabPane key="mine" title={`待我审核 (${approvals.length})`}/><Tabs.TabPane key="translation" title={`翻译审核 (${translationReviews.length})`}/><Tabs.TabPane key="all" title="全部工单"/><Tabs.TabPane key="emergency" title="紧急审批 (1)"/></Tabs>
    <FilterBar><Input.Search placeholder={isTranslation?'搜索模板、语言或外部任务 ID':'搜索审批单或对象'} style={{width:280}}/><Select placeholder={isTranslation?'目标语言':'风险等级'} style={{width:140}}/><Select placeholder={isTranslation?'翻译状态':'对象类型'} style={{width:140}}/></FilterBar>
    {isTranslation?<ResourceTable data={translationReviews} columns={translationColumns} rowKey="id"/>:<ResourceTable data={data} columns={approvalColumns} rowKey="id"/>}
    <ApprovalDrawer item={selected} visible={Boolean(selected)} onClose={()=>setSelected(undefined)} currentAdminId={currentAdminId}/>
    <TranslationReviewDrawer item={translationItem} visible={Boolean(translationItem)} onClose={()=>setTranslationItem(undefined)}/>
  </section>;
}
