import { useMemo, useState } from 'react';
import { Badge, Button, Modal, Space, Tag } from '@arco-design/web-react';
import { IconCheck, IconNotification } from '@arco-design/web-react/icon';
import { useNavigate } from 'react-router-dom';
import { messageCategories } from '../../mocks/data';
import type { MessageCategoryCode, UserMessage } from '../../domain/types';
import { markAllMessagesRead, markMessageRead, usePrototypeStore } from '../../store/prototypeStore';

export default function InboxPage() {
  const navigate = useNavigate();
  const { messages } = usePrototypeStore();
  const [category, setCategory] = useState<'all' | MessageCategoryCode>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const unread = messages.filter((message) => !message.read).length;
  const visible = useMemo(() => messages.filter((message) =>
    (category === 'all' || message.category === category) && (!unreadOnly || !message.read)), [messages, category, unreadOnly]);

  const openMessage = (message: UserMessage) => {
    markMessageRead(message.id);
    navigate(`/inbox/${message.id}`);
  };

  const markAllRead = () => Modal.confirm({
    title:'全部标记为已读？',
    content:`将把当前账户的 ${unread} 条未读消息标记为已读。`,
    okText:'确认全部已读',
    cancelText:'取消',
    onOk:markAllMessagesRead,
  });

  return <main className="inbox-shell">
    <header className="inbox-topbar"><div className="inbox-brand"><span>F</span><strong>ForX Finance</strong></div><Space><Button type="text" onClick={() => navigate('/dashboard')}>运营后台</Button><div className="inbox-avatar">GM</div></Space></header>
    <div className="inbox-container">
      <section className="inbox-hero"><div><h1>消息中心</h1><p><Badge count={unread} dot={unread > 0}><IconNotification /></Badge><strong>{unread} 条未读</strong> · 重要资金与风险消息会优先展示</p></div><Button icon={<IconCheck />} disabled={unread === 0} onClick={markAllRead}>全部已读</Button></section>
      <nav className="inbox-categories" aria-label="消息分类">
        <Button type={category === 'all' ? 'primary':'secondary'} onClick={() => setCategory('all')}>全部</Button>
        {messageCategories.map((item) => <Button key={item.code} type={category === item.code ? 'primary':'secondary'} onClick={() => setCategory(item.code)}>{item.name}</Button>)}
        <Button className="unread-filter" type={unreadOnly ? 'primary':'outline'} onClick={() => setUnreadOnly((value) => !value)}>只看未读</Button>
      </nav>
      <section className="inbox-list" aria-label="消息列表">
        {visible.map((message) => {
          const categoryInfo = messageCategories.find((item) => item.code === message.category)!;
          return <button key={message.id} className={`inbox-message ${message.read ? 'is-read':'is-unread'} risk-${message.risk}`} onClick={() => openMessage(message)}>
            <span className={`message-category-icon category-${message.category}`}>{categoryInfo.name.slice(0,1)}</span>
            <span className="message-main"><span className="message-meta"><Tag color={categoryInfo.color}>{categoryInfo.name}</Tag>{message.risk !== '普通' && <Tag color={message.risk === '紧急' ? 'red':'orange'}>{message.risk}</Tag>}<time>{message.createdAt}</time></span><strong>{message.title}</strong><span>{message.summary}</span></span>
            {!message.read && <i className="unread-dot" aria-label="未读" />}
          </button>;
        })}
        {visible.length === 0 && <div className="inbox-empty">当前分类没有消息</div>}
      </section>
    </div>
  </main>;
}
