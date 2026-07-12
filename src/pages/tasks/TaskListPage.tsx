import { useMemo, useState } from 'react';
import { Button, Dropdown, Input, Menu, Progress, Select, Space, Tag, Typography } from '@arco-design/web-react';
import { IconMore, IconPlus } from '@arco-design/web-react/icon';
import { useNavigate } from 'react-router-dom';
import type { TableColumnProps } from '@arco-design/web-react';
import PageHeader from '../../components/PageHeader';
import FilterBar from '../../components/FilterBar';
import ResourceTable from '../../components/ResourceTable';
import StatusTag from '../../components/StatusTag';
import { tasks } from '../../mocks/data';
import type { MessageTask } from '../../domain/types';

const channelColors: Record<string,string> = { 站内信:'arcoblue', Push:'purple', 邮件:'cyan', 短信:'orange' };

export default function TaskListPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string>();
  const filtered = useMemo(() => tasks.filter((task) => {
    const hit = `${task.id}${task.name}${task.creator}`.toLowerCase().includes(keyword.toLowerCase());
    return hit && (!status || task.status === status);
  }), [keyword, status]);

  const columns: TableColumnProps<MessageTask>[] = [
    { title:'任务', width:240, render:(_, row) => <div><Typography.Text className="strong">{row.name}</Typography.Text><div className="mono muted">{row.id}</div></div> },
    { title:'类型 / 分类', width:150, render:(_, row) => <div>{row.type}<div className="muted">{row.category} · {row.nature}</div></div> },
    { title:'风险', width:72, render:(_, row) => <span className={`risk-${row.risk === '关键' ? 'critical' : row.risk === '高' ? 'high' : row.risk === '中' ? 'medium' : 'low'}`}>{row.risk}</span> },
    { title:'模板版本', dataIndex:'template', width:170, render:(value) => <span className="mono">{value}</span> },
    { title:'渠道', width:190, render:(_, row) => <div className="channel-list">{row.channels.map((c) => <Tag key={c} color={channelColors[c]} bordered>{c}</Tag>)}</div> },
    { title:'目标用户', width:180, render:(_, row) => <div>{row.audience}<div className="muted">{row.audienceCount.toLocaleString()} 人</div></div> },
    { title:'计划时间', dataIndex:'schedule', width:170 },
    { title:'状态', width:118, render:(_, row) => <div><StatusTag status={row.status} /><div className="muted approval-copy">{row.approval}</div></div> },
    { title:'进度', width:120, render:(_, row) => row.progress ? <Progress percent={row.progress} size="small" showText={false} /> : <span className="muted">—</span> },
    { title:'创建人', width:120, render:(_, row) => <div>{row.creator}<div className="muted">{row.team}</div></div> },
    { title:'操作', fixed:'right', width:76, render:(_, row) => <Dropdown trigger="click" droplist={<Menu><Menu.Item key="view">查看详情</Menu.Item><Menu.Item key="copy">复制任务</Menu.Item><Menu.Item key="pause" disabled={row.status !== '发送中'}>暂停发送</Menu.Item><Menu.Item key="cancel">取消任务</Menu.Item></Menu>}><Button type="text" icon={<IconMore />} aria-label={`操作 ${row.name}`} /></Dropdown> },
  ];

  return <section className="page-stack">
    <PageHeader title="消息任务" description="统一创建、审核和追踪运营群发、系统事件与自动化消息。" actions={<Button type="primary" icon={<IconPlus />} onClick={() => navigate('/tasks/create')}>新建消息任务</Button>} />
    <FilterBar onReset={() => { setKeyword(''); setStatus(undefined); }}>
      <Input.Search value={keyword} onChange={setKeyword} allowClear style={{ width:280 }} placeholder="搜索任务 ID、名称或创建人" />
      <Select placeholder="任务状态" value={status} onChange={setStatus} allowClear style={{ width:150 }}>{['草稿','待审核','待发送','发送中','已暂停','已完成','部分完成','失败'].map((item) => <Select.Option key={item} value={item}>{item}</Select.Option>)}</Select>
      <Select placeholder="消息性质" allowClear style={{ width:140 }}>{['强事务','事务','服务','营销'].map((item) => <Select.Option key={item} value={item}>{item}</Select.Option>)}</Select>
      <Select placeholder="发送渠道" mode="multiple" maxTagCount={1} style={{ width:170 }}>{['站内信','Push','邮件','短信'].map((item) => <Select.Option key={item} value={item}>{item}</Select.Option>)}</Select>
    </FilterBar>
    <ResourceTable data={filtered} columns={columns} rowKey="id" />
  </section>;
}
