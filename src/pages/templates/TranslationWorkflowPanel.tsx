import { useState } from 'react';
import { Alert, Button, Descriptions, Message, Progress, Select, Space, Steps, Tag, Tooltip } from '@arco-design/web-react';
import { useNavigate } from 'react-router-dom';
import type { MessageTemplate, TranslationBatch, TranslationItemStatus } from '../../domain/types';
import { createTranslationBatch, retryTranslation, submitTemplateForApproval } from '../../store/prototypeStore';
import TranslationReviewDrawer from '../approvals/TranslationReviewDrawer';
import { deriveMultilingualProgress } from '../multilingual/multilingualProgress';
import { APPROVED_MANUAL_TEMPLATE_LOCK_MESSAGE, isApprovedManualTemplateLocked } from '../../domain/templatePolicy';

const statusColor: Record<TranslationItemStatus, string> = {
  未提交:'gray', 排队中:'gray', 翻译中:'arcoblue', 待普通确认:'orange', 修改中:'orange', 待小语种专审:'purple', 专审中:'purple', 源文案已变更:'orangered', 已通过:'green', 待人工审核:'orange', 审核通过:'green', 翻译失败:'red', 审核驳回:'orangered', 已取消:'gray',
};

export default function TranslationWorkflowPanel({ template, batch, onEdit, context = 'template' }: { template: MessageTemplate; batch?: TranslationBatch; onEdit?:()=>void; context?: 'template' | 'temporary-task' }) {
  const navigate=useNavigate();
  const [targets,setTargets]=useState<string[]>(['en-US']);
  const [ordinaryReviewId,setOrdinaryReviewId]=useState<string>();
  const sourceEditingLocked = isApprovedManualTemplateLocked(template);
  if (!batch) return <div className="translation-flow">{sourceEditingLocked?<Alert type="warning" showIcon title="模板已锁定" content={`${APPROVED_MANUAL_TEMPLATE_LOCK_MESSAGE}，当前模板没有可展示的翻译批次。`}/>:<><Alert type="warning" showIcon content="该模板尚未创建翻译批次。请选择目标语言并提交外部异步机翻任务。"/><Space direction="vertical" style={{width:'100%'}}><Select mode="multiple" value={targets} onChange={setTargets} options={['en-US','zh-TW','ja-JP','ko-KR','es-ES','tr-TR','ru-RU','fr-FR'].map((value)=>({label:value,value}))}/><Button type="primary" disabled={!targets.length} onClick={()=>{createTranslationBatch({templateId:template.id,targetLocales:targets,createdBy:'Gary Ma'});Message.success('外部机翻批次已创建');}}>创建外部机翻任务</Button></Space></>}</div>;

  const summary = deriveMultilingualProgress(batch);
  const approved = summary.approved;
  const progress = summary.percent;
  const ready = batch.status === '全部审核通过';
  const temporaryTask = context === 'temporary-task';

  return <div className="translation-flow">
    <Alert type="info" showIcon title="外部异步机翻" content="平台后台提交外部任务；完成回调为主，主动查询为超时兜底。浏览器不会直接调用翻译服务。" />
    <Descriptions column={2} border data={[
      { label:'翻译批次 ID', value:<span className="mono">{batch.id}</span> },
      { label:'默认语言', value:`${batch.sourceLocale} · 操作者原文` },
      { label:'目标语言', value:batch.targetLocales.join(' · ') },
      { label:'当前状态', value:<Tag color={ready?'green':batch.status==='部分失败'?'red':'orange'}>{batch.status}</Tag> },
      { label:'创建人', value:batch.createdBy },
      { label:'最后更新', value:batch.updatedAt },
    ]} />
    <div className="translation-progress-head"><div><strong>语言审核进度</strong><span>{approved}/{batch.items.length} 个目标语言已通过</span></div><Progress percent={progress} size="small" status={batch.status==='部分失败'?'error':undefined} /></div>
    <Steps current={ready?4:batch.status==='待人工审核'||batch.status==='部分失败'?2:1} size="small" className="translation-steps">
      <Steps.Step title="源文案" description={template.sourceLocale}/>
      <Steps.Step title="外部机翻" description="回调 / 查询"/>
      <Steps.Step title="人工审核" description="逐语言"/>
      <Steps.Step title="业务审核" description={ready?'已开放':'未开放'}/>
    </Steps>
    <div className="translation-locale-list">
      <div className="translation-locale-header"><strong>逐语言任务</strong><span>失败语言可单独重试，已成功语言不会重复翻译</span></div>
      {batch.items.map((item) => <div className="translation-locale-row" key={item.id}>
        <div className="locale-code"><strong>{item.targetLocale}</strong><span>{item.id}</span></div>
        <div><span className="muted">外部任务 ID</span><strong className="mono">{item.externalTaskId}</strong></div>
        <div><span className="muted">尝试 / 更新时间</span><strong>第 {item.attemptNo} 次 · {item.translatedAt || batch.updatedAt}</strong></div>
        <Tag color={statusColor[item.status]}>{item.status}</Tag>
        {sourceEditingLocked?<Button size="small" disabled>已锁定</Button>:item.status==='翻译失败'||item.status==='审核驳回'||item.status==='源文案已变更'?<Button size="small" status="danger" onClick={()=>{retryTranslation(item.id);Message.success(`${item.targetLocale} 已重新提交外部机翻任务`);}}>重试该语言</Button>:item.status==='待小语种专审'||item.status==='专审中'?<Button size="small" type="primary" onClick={()=>navigate(`/multilingual-review?item=${item.id}`)}>前往专项审核</Button>:item.status==='待普通确认'||item.status==='修改中'?<Button size="small" type="primary" onClick={()=>setOrdinaryReviewId(item.id)}>当场校对并确认</Button>:item.status==='待人工审核'?<Button size="small" type="primary" onClick={()=>setOrdinaryReviewId(item.id)}>进入人工审核</Button>:<Button size="small" disabled>{item.status==='审核通过'||item.status==='已通过'?'已由 '+item.reviewer+' 审核':'等待结果'}</Button>}
        {item.errorMessage && <div className="translation-error"><span className="mono">{item.errorCode || 'REVIEW_REJECTED'}</span> · {item.errorMessage}</div>}
      </div>)}
    </div>
    <div className={`translation-gate ${ready?'ready':'blocked'}`}>
      <div><strong>{temporaryTask?'任务提交门禁':'发布门禁'} · {ready?'已通过':'未通过'}</strong><p>{temporaryTask?(ready?'全部目标语言已完成人工审核，可以继续提交消息任务业务审核。':'仍有目标语言未人工审核通过，临时消息任务不可提交业务审核。'):(ready?'全部目标语言已完成人工审核，可以提交业务审核。':'仍有目标语言未人工审核通过，模板不可发布，也不可用于消息任务。')}</p></div>
      {!temporaryTask && <Space>{sourceEditingLocked?<Tooltip content={APPROVED_MANUAL_TEMPLATE_LOCK_MESSAGE}><span><Button disabled>编辑源文案</Button></span></Tooltip>:<Button onClick={onEdit}>编辑源文案</Button>}<Button type="primary" disabled={!ready || template.status === '已发布'} onClick={()=>{const approval=submitTemplateForApproval(template.id);Message.success(`已提交业务审核 ${approval.id}`);navigate('/approvals');}}>{template.status === '已发布'?'已发布':'提交业务审核'}</Button></Space>}
    </div>
    <TranslationReviewDrawer item={batch.items.find((item)=>item.id===ordinaryReviewId)} visible={Boolean(ordinaryReviewId)} onClose={()=>setOrdinaryReviewId(undefined)} currentAdmin="Gary Ma" reviewMode="ordinary" />
  </div>;
}
