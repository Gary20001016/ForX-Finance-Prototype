import { useEffect, useState } from 'react';
import { Alert, Button, Checkbox, Descriptions, Drawer, Form, Input, Message, Radio, Space, Tabs, Tag, Timeline } from '@arco-design/web-react';
import type { ApprovalItem } from '../../domain/types';
import StatusTag from '../../components/StatusTag';
import MessagePreview from '../../components/MessagePreview';
import { reviewApproval } from '../../store/prototypeStore';

export default function ApprovalDrawer({ item,visible,onClose,currentAdminId }: { item?:ApprovalItem;visible:boolean;onClose:()=>void;currentAdminId:string }){
  const [decision,setDecision]=useState<'approve'|'reject'>('approve');
  const [opinion,setOpinion]=useState('');
  const [confirmed,setConfirmed]=useState(false);
  const isSelf=item?.submitterId===currentAdminId;
  const highRisk=item?.risk==='高'||item?.risk==='关键';
  useEffect(()=>{setDecision('approve');setOpinion('');setConfirmed(false);},[item]);
  const submit=(next:'approve'|'reject')=>{
    setDecision(next);
    if(!item)return;
    if(isSelf){Message.warning('不可审核本人创建的任务');return;}
    if(next==='reject'&&!opinion.trim()){Message.warning('请填写驳回原因');return;}
    if(next==='approve'&&highRisk&&!confirmed){Message.warning('高风险审批必须确认已核对全部关键配置');return;}
    reviewApproval(item.id,{decision:next,reviewer:'Gary Ma',opinion:opinion||'已核对内容、受众、渠道、时间与有效期'});
    Message.success(next==='approve'?'审批已通过，任务进入待发送状态':'已驳回，任务退回创建人');onClose();
  };
  return <Drawer width={980} visible={visible} title={item?`审批 · ${item.name}`:'审批详情'} onCancel={onClose} footer={item&&<div className="drawer-footer"><Button onClick={onClose}>取消</Button><Button status="danger" disabled={isSelf} onClick={()=>submit('reject')}>确认驳回</Button><Button type="primary" disabled={isSelf} onClick={()=>submit('approve')}>确认通过</Button></div>}>
    {item&&<div className="approval-drawer">{isSelf&&<Alert type="warning" showIcon title="职责分离限制" content="不可审核本人创建的任务，请转交其他同级审核人。"/>}<Descriptions column={3} border data={[{label:'审批单',value:item.id},{label:'风险等级',value:<Tag color={item.risk==='关键'?'red':'orange'}>{item.risk}</Tag>},{label:'对象类型',value:item.objectType},{label:'当前节点',value:item.step},{label:'预计受众',value:item.audience.toLocaleString()},{label:'预计成本',value:item.cost},{label:'计划时间',value:item.schedule},{label:'有效期',value:item.expiresAt||'未设置'},{label:'状态',value:<StatusTag status={item.status}/>}]} />
      <Tabs defaultActiveTab="preview"><Tabs.TabPane key="preview" title="内容预览">{item.content?<MessagePreview content={item.content}/>:<Alert type="warning" content="该历史审批对象没有冻结内容快照"/>}</Tabs.TabPane><Tabs.TabPane key="diff" title="版本差异"><div className="diff-panel"><div><span>当前审批版本</span><strong>{item.content?.web.title || item.name}</strong><p>{item.content?.web.summary}</p></div><div className="diff-added">{(item.changes||['首次提交审核']).map((change)=><div key={change}>+ {change}</div>)}</div></div></Tabs.TabPane><Tabs.TabPane key="audience" title="受众与合规"><Alert type="success" content={`${item.audience.toLocaleString()} 名用户已通过地区、授权、退订、频控和地址有效性检查。`}/><div className="approval-samples"><h3>受众样例</h3>{(item.sampleUsers||[]).map((user)=><Tag key={user}>{user}</Tag>)}</div></Tabs.TabPane><Tabs.TabPane key="audit" title="审批轨迹"><Timeline><Timeline.Item>{item.submittedAt} {item.submitter} 提交审批</Timeline.Item><Timeline.Item>内容、变量、链接与受众扫描通过</Timeline.Item>{item.reviewedAt&&<Timeline.Item>{item.reviewedAt} {item.reviewer} · {item.status}</Timeline.Item>}<Timeline.Item>等待当前审核人处理</Timeline.Item></Timeline></Tabs.TabPane></Tabs>
      <Form layout="vertical"><Form.Item label="审批结论"><Radio.Group value={decision} onChange={setDecision}><Radio value="approve">通过</Radio><Radio value="reject">驳回</Radio></Radio.Group></Form.Item>{highRisk&&<Form.Item><Checkbox checked={confirmed} onChange={setConfirmed}>我已核对目标范围、最终 Web/Push 内容、发送时间、有效期和失败策略</Checkbox></Form.Item>}<Form.Item label="审批意见" required={decision==='reject'}><Input.TextArea value={opinion} onChange={setOpinion} placeholder={decision==='reject'?'请填写驳回原因':'填写风险判断和补充意见'}/></Form.Item></Form>
    </div>}
  </Drawer>;
}
