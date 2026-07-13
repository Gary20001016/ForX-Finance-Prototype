import { useState } from 'react';
import { Alert, Button, Checkbox, Descriptions, Drawer, Form, Input, Message, Radio, Space, Tabs, Timeline } from '@arco-design/web-react';
import type { ApprovalItem } from '../../domain/types';
import StatusTag from '../../components/StatusTag';

export default function ApprovalDrawer({ item, visible, onClose, currentAdminId }: { item?: ApprovalItem; visible: boolean; onClose:()=>void; currentAdminId:string }) {
  const [decision, setDecision] = useState<'approve'|'reject'>('approve');
  const isSelf = item?.submitterId === currentAdminId;
  return <Drawer width={720} visible={visible} title={item ? `审批 · ${item.name}` : '审批详情'} onCancel={onClose} footer={item && <div className="drawer-footer"><Button onClick={onClose}>取消</Button><Button status="danger" disabled={isSelf} onClick={()=>setDecision('reject')}>驳回</Button><Button type="primary" disabled={isSelf} onClick={()=>Message.success('审批结论已记录')}>确认通过</Button></div>}>
    {item && <div className="approval-drawer">{isSelf && <Alert type="warning" showIcon title="职责分离限制" content="不可审核本人创建的任务，请转交其他同级审核人。"/>}<Descriptions column={2} border data={[{label:'审批单',value:item.id},{label:'风险等级',value:item.risk},{label:'对象类型',value:item.objectType},{label:'当前节点',value:item.step},{label:'预计受众',value:item.audience.toLocaleString()},{label:'预计成本',value:item.cost},{label:'计划时间',value:item.schedule},{label:'状态',value:<StatusTag status={item.status}/>}]} />
      <Tabs defaultActiveTab="content"><Tabs.TabPane key="content" title="内容与差异"><div className="diff-panel"><div><span>当前审批版本</span><strong>夏季交易赛已开启</strong><p>瓜分 500,000 USDT 奖池，完成交易任务赢取奖励。</p></div><div className="diff-added">+ 新增 EU/EEA 一键退订区块<br/>+ 土耳其语风险提示</div></div></Tabs.TabPane><Tabs.TabPane key="audience" title="受众与合规"><Alert type="success" content="328,400 名用户通过地区、授权、退订、频控和地址有效性检查。"/></Tabs.TabPane><Tabs.TabPane key="audit" title="审批轨迹"><Timeline><Timeline.Item>17:52 林夏提交审批</Timeline.Item><Timeline.Item>17:54 内容扫描通过</Timeline.Item><Timeline.Item>等待当前审核人处理</Timeline.Item></Timeline></Tabs.TabPane></Tabs>
      <Form layout="vertical"><Form.Item label="审批结论"><Radio.Group value={decision} onChange={setDecision}><Radio value="approve">通过</Radio><Radio value="reject">驳回</Radio></Radio.Group></Form.Item>{item.risk==='高'||item.risk==='关键'?<Form.Item><Checkbox>我已核对目标范围、最终内容、发送时间和降级策略</Checkbox></Form.Item>:null}<Form.Item label="审批意见" required={decision==='reject'}><Input.TextArea placeholder={decision==='reject'?'请填写驳回原因':'可填写风险判断和补充意见'} /></Form.Item></Form>
    </div>}
  </Drawer>;
}
