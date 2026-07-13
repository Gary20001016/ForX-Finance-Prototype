import { useState } from 'react';
import { Button, Drawer, Input, Select, Space, Tag, Typography } from '@arco-design/web-react';
import { IconPlus } from '@arco-design/web-react/icon';
import type { TableColumnProps } from '@arco-design/web-react';
import PageHeader from '../../components/PageHeader';
import FilterBar from '../../components/FilterBar';
import ResourceTable from '../../components/ResourceTable';
import StatusTag from '../../components/StatusTag';
import { templates, translationBatches } from '../../mocks/data';
import type { MessageTemplate } from '../../domain/types';
import { openDetailedForm } from '../../utils/prototypeActions';
import TranslationWorkflowPanel from './TranslationWorkflowPanel';

export default function TemplateListPage() {
  const [preview, setPreview] = useState<MessageTemplate>();
  const columns: TableColumnProps<MessageTemplate>[] = [
    { title:'模板', width:240, render:(_,r) => <div><Typography.Text className="strong">{r.name}</Typography.Text><div className="mono muted">{r.code}</div></div> },
    { title:'分类 / 性质', width:150, render:(_,r) => <div>{r.category}<div className="muted">{r.nature}</div></div> },
    { title:'风险', dataIndex:'risk', width:80 },
    { title:'渠道', width:200, render:(_,r) => <Space wrap>{r.channels.map(c => <Tag key={c}>{c}</Tag>)}</Space> },
    { title:'语言覆盖', width:190, render:(_,r) => <div>{r.locales.slice(0,3).join(' · ')}{r.locales.length>3 && ` +${r.locales.length-3}`}<div className="muted">默认 {r.sourceLocale}</div></div> },
    { title:'翻译进度', width:150, render:(_,r) => <div><StatusTag status={r.translationReadiness}/><div className="mono muted">{r.translationBatchId}</div></div> },
    { title:'版本', dataIndex:'version', width:70 },
    { title:'事件编码', dataIndex:'eventCode', width:220, render:(v) => <span className="mono">{v || '—'}</span> },
    { title:'状态', width:100, render:(_,r) => <StatusTag status={r.status} /> },
    { title:'更新时间', dataIndex:'updatedAt', width:120 },
    { title:'操作', fixed:'right', width:110, render:(_,r) => <Button type="text" onClick={() => setPreview(r)}>多语言流程</Button> },
  ];
  return <section className="page-stack"><PageHeader title="消息模板" description="维护多语言、多渠道内容、变量和不可变发布版本。" actions={<Button type="primary" icon={<IconPlus />} onClick={() => openDetailedForm('template','新建消息模板')}>新建模板</Button>} />
    <FilterBar><Input.Search placeholder="搜索模板 ID、编码或名称" style={{width:280}} /><Select placeholder="消息性质" style={{width:140}} allowClear /><Select placeholder="渠道" style={{width:140}} allowClear /><Select placeholder="状态" style={{width:140}} allowClear /></FilterBar>
    <ResourceTable data={templates} columns={columns} rowKey="id" />
    <Drawer width={820} title={preview ? `${preview.name} · ${preview.version} · 多语言生产` : '多语言生产'} visible={Boolean(preview)} onCancel={() => setPreview(undefined)} footer={null}>
      {preview && <TranslationWorkflowPanel template={preview} batch={translationBatches.find((batch)=>batch.id===preview.translationBatchId)} />}
    </Drawer>
  </section>;
}
