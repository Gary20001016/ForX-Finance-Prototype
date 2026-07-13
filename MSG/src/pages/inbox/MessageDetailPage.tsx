import { useEffect } from 'react';
import { Alert, Button, Message, Modal, Space, Tag } from '@arco-design/web-react';
import { IconArrowLeft, IconCheckCircle, IconExclamationCircle } from '@arco-design/web-react/icon';
import { useNavigate, useParams } from 'react-router-dom';
import { messageCategories } from '../../mocks/data';
import { acknowledgeRiskMessage, markMessageRead, usePrototypeStore } from '../../store/prototypeStore';

const expired=(value?:string)=>{
  if(!value)return false;
  const normalized=value.replace(' ','T')+'+08:00';
  const timestamp=Date.parse(normalized);
  return Number.isFinite(timestamp)&&timestamp<Date.now();
};

export default function MessageDetailPage(){
  const navigate=useNavigate();const {messageId}=useParams();const {messages}=usePrototypeStore();
  const message=messages.find((item)=>item.id===messageId);
  useEffect(()=>{if(messageId)markMessageRead(messageId);},[messageId]);
  if(!message)return <main className="inbox-shell"><div className="message-detail"><h1>消息不存在</h1><Button onClick={()=>navigate('/inbox')}>返回消息中心</Button></div></main>;
  const category=messageCategories.find((item)=>item.code===message.category)!;
  const isExpired=expired(message.expiresAt);
  const jump=()=>{if(message.targetUrl)window.open(message.targetUrl,'_blank','noopener,noreferrer');};
  const openAction=()=>{if(isExpired){Message.warning('消息已过有效期，业务动作不可继续');return;}if(message.risk==='紧急'&&!message.acknowledgedAt){Modal.confirm({title:'确认已知悉风险',content:'继续表示您已阅读风险提示。请及时处理仓位或账户异常。',okText:'已知悉并继续',onOk:()=>{acknowledgeRiskMessage(message.id);jump();}});return;}jump();};
  return <main className="inbox-shell"><header className="inbox-topbar"><div className="inbox-brand"><span>F</span><strong>ForX Finance</strong></div><Button type="text" onClick={()=>navigate('/dashboard')}>运营后台</Button></header><article className={`message-detail detail-risk-${message.risk}`}><Button type="text" icon={<IconArrowLeft/>} onClick={()=>navigate('/inbox')}>返回消息中心</Button>{message.risk==='紧急'&&<Alert className="risk-alert" type="error" showIcon icon={<IconExclamationCircle/>} title="紧急风险提示" content="请立即核对以下信息并及时处理。风险标签在消息已读后仍会保留。"/>}{message.risk==='重要'&&<Alert className="risk-alert" type="warning" showIcon title="重要消息" content="请及时核对账户与资产信息。"/>}<div className="detail-heading"><Space><Tag color={category.color}>{category.name}</Tag><Tag color={message.risk==='紧急'?'red':message.risk==='重要'?'orange':'gray'}>{message.risk}</Tag>{isExpired&&<Tag>已过期</Tag>}</Space><h1>{message.title}</h1><p>{message.createdAt} · {message.source} · <IconCheckCircle/> 已读</p></div><div className="detail-body"><p>{message.body}</p>{message.expiresAt&&<div className="detail-expiry">消息有效期至 {message.expiresAt} · {isExpired?'业务动作已关闭':'当前仍可处理'}</div>}</div>{message.actionText&&<Button type="primary" status={message.risk==='紧急'?'danger':undefined} size="large" disabled={isExpired} onClick={openAction}>{isExpired?'已过期':message.actionText}</Button>}</article></main>;
}
