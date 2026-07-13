import { Alert, Button, Descriptions, Message, Progress, Space, Steps, Tag } from '@arco-design/web-react';
import type { MessageTemplate, TranslationBatch, TranslationItemStatus } from '../../domain/types';

const statusColor: Record<TranslationItemStatus, string> = {
  未提交:'gray', 排队中:'gray', 翻译中:'arcoblue', 待人工审核:'orange', 审核通过:'green', 翻译失败:'red', 审核驳回:'orangered', 已取消:'gray',
};

export default function TranslationWorkflowPanel({ template, batch }: { template: MessageTemplate; batch?: TranslationBatch }) {
  if (!batch) return <Alert type="warning" showIcon content="该模板尚未创建翻译批次。" />;

  const approved = batch.items.filter((item) => item.status === '审核通过').length;
  const progress = Math.round((approved / Math.max(batch.items.length, 1)) * 100);
  const ready = batch.status === '全部审核通过';

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
        {item.status==='翻译失败'?<Button size="small" status="danger" onClick={()=>Message.success(`${item.targetLocale} 已重新提交外部机翻任务`)}>重试该语言</Button>:item.status==='待人工审核'?<Button size="small" type="primary" onClick={()=>Message.info(`请前往审核中心处理 ${item.targetLocale}`)}>进入人工审核</Button>:<Button size="small" disabled>{item.status==='审核通过'?'已由 '+item.reviewer+' 审核':'等待结果'}</Button>}
        {item.errorMessage && <div className="translation-error"><span className="mono">{item.errorCode || 'REVIEW_REJECTED'}</span> · {item.errorMessage}</div>}
      </div>)}
    </div>
    <div className={`translation-gate ${ready?'ready':'blocked'}`}>
      <div><strong>发布门禁 · {ready?'已通过':'未通过'}</strong><p>{ready?'全部目标语言已完成人工审核，可以提交业务审核。':'仍有目标语言未人工审核通过，模板不可发布，也不可用于消息任务。'}</p></div>
      <Space><Button onClick={()=>Message.info('源文案变更将使全部翻译审核失效')}>编辑源文案</Button><Button type="primary" disabled={!ready} onClick={()=>Message.success('已提交业务审核')}>提交业务审核</Button></Space>
    </div>
  </div>;
}
