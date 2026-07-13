import { useEffect, useState } from 'react';
import { Alert, Button, Descriptions, Drawer, Form, Input, Message, Space, Tag, Timeline } from '@arco-design/web-react';
import type { TranslationItem } from '../../domain/types';

export default function TranslationReviewDrawer({ item, visible, onClose }: { item?: TranslationItem; visible: boolean; onClose:()=>void }) {
  const [title,setTitle]=useState('');
  const [summary,setSummary]=useState('');
  const [body,setBody]=useState('');
  const [reason,setReason]=useState('');

  useEffect(()=>{
    setTitle(item?.machineTitle || '');
    setSummary(item?.machineSummary || '');
    setBody(item?.machineBody || '');
    setReason('');
  },[item]);

  const reject=()=>{
    if (!reason.trim()) { Message.warning('请先填写驳回重翻原因'); return; }
    Message.success(`${item?.targetLocale} 已驳回并进入单语言重翻队列`);
    onClose();
  };

  const approve=()=>{
    Message.success(`${item?.targetLocale} 修订结果已通过；全部语言通过后开放业务审核`);
    onClose();
  };

  return <Drawer width={920} visible={visible} title={item?`${item.templateName} · ${item.targetLocale} 翻译审核`:'翻译审核'} onCancel={onClose} footer={item&&<div className="drawer-footer"><Button onClick={onClose}>取消</Button><Button status="danger" onClick={reject}>驳回重翻</Button><Button type="primary" onClick={approve}>修订并通过</Button></div>}>
    {item&&<div className="translation-review">
      <Alert type="info" showIcon title="翻译成功后必须人工审核" content="请核对数字、币种、交易对、风险措辞和模板变量；人工修订内容会与机翻原文分别留档。"/>
      <Descriptions column={3} border data={[
        {label:'目标语言',value:<Tag color="arcoblue">{item.targetLocale}</Tag>},
        {label:'外部任务 ID',value:<span className="mono">{item.externalTaskId}</span>},
        {label:'翻译尝试',value:`第 ${item.attemptNo} 次`},
        {label:'源内容哈希',value:<span className="mono">{item.sourceContentHash}</span>},
        {label:'变量完整性',value:<Tag color={item.variablesValid?'green':'red'}>{item.variablesValid?'检查通过':'检查失败'}</Tag>},
        {label:'完成时间',value:item.translatedAt || '—'},
      ]}/>
      <div className="translation-compare">
        <section><div className="compare-heading"><span>ZH-CN · SOURCE</span><h3>默认语言源文案</h3></div><label>标题<div className="source-copy">夏季交易赛已开启</div></label><label>摘要<div className="source-copy">瓜分 500,000 USDT 奖池，完成交易任务赢取奖励。</div></label><label>正文<div className="source-copy body">尊敬的 &#123;&#123; user_nickname &#125;&#125;，夏季交易赛已经开启。使用 &#123;&#123; symbol &#125;&#125; 完成指定交易任务，即可参与奖励瓜分。</div></label></section>
        <section><div className="compare-heading"><span>{item.targetLocale} · MACHINE + HUMAN</span><h3>机器翻译与人工修订</h3></div><Form layout="vertical"><Form.Item label="标题"><Input value={title} onChange={setTitle}/></Form.Item><Form.Item label="摘要"><Input.TextArea value={summary} onChange={setSummary} rows={2}/></Form.Item><Form.Item label="正文"><Input.TextArea value={body} onChange={setBody} rows={6}/></Form.Item></Form></section>
      </div>
      <div className="translation-checks"><Tag color="green">变量 2/2 保留</Tag><Tag color="green">金额与币种一致</Tag><Tag color="green">交易对未翻译</Tag><Tag color="orange">风险用语需人工确认</Tag></div>
      <Form layout="vertical"><Form.Item label="驳回重翻原因" extra="选择驳回时必填，原因会传入新的单语言外部任务。"><Input.TextArea value={reason} onChange={setReason} placeholder="例如：活动有效期措辞不准确，请按术语库重新翻译"/></Form.Item></Form>
      <div className="review-history"><strong>审核与任务轨迹</strong><Timeline><Timeline.Item>{item.submittedAt} {item.submitter} 提交外部机翻</Timeline.Item><Timeline.Item>{item.translatedAt} 外部服务回调成功，签名与内容哈希校验通过</Timeline.Item><Timeline.Item>当前 · 等待人工审核</Timeline.Item></Timeline></div>
    </div>}
  </Drawer>;
}
