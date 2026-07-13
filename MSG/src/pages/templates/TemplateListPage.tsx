import { useState } from 'react';
import { Button, Drawer, Input, Select, Space, Tag, Typography } from '@arco-design/web-react';
import { IconPlus } from '@arco-design/web-react/icon';
import type { TableColumnProps } from '@arco-design/web-react';
import PageHeader from '../../components/PageHeader';
import FilterBar from '../../components/FilterBar';
import ResourceTable from '../../components/ResourceTable';
import StatusTag from '../../components/StatusTag';
import type { MessageTemplate } from '../../domain/types';
import TranslationWorkflowPanel from './TranslationWorkflowPanel';
import TemplateEditorDrawer from './TemplateEditorDrawer';
import { usePrototypeStore } from '../../store/prototypeStore';

export default function TemplateListPage() {
  const [preview, setPreview] = useState<MessageTemplate>();
  const [editing,setEditing]=useState<MessageTemplate | 'new'>();
  const [keyword,setKeyword]=useState('');
  const [status,setStatus]=useState<string>();
  const [nature,setNature]=useState<string>();
  const [channel,setChannel]=useState<string>();
  const store=usePrototypeStore();
  const data=store.templates.filter((item)=>item.owner!=='临时任务' && `${item.id}${item.code}${item.name}`.toLowerCase().includes(keyword.toLowerCase()) && (!status || item.status===status) && (!nature || item.nature===nature) && (!channel || item.channels.includes(channel as MessageTemplate['channels'][number])));
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
    { title:'操作', fixed:'right', width:180, render:(_,r) => <Space><Button type="text" onClick={() => setEditing(r)}>编辑</Button><Button type="text" onClick={() => setPreview(r)}>多语言流程</Button></Space> },
  ];
  return <section className="page-stack"><PageHeader title="消息模板" description="维护多语言、多渠道内容、变量和不可变发布版本。" actions={<Button type="primary" icon={<IconPlus />} onClick={() => setEditing('new')}>新建模板</Button>} />
    <FilterBar onReset={()=>{setKeyword('');setStatus(undefined);setNature(undefined);setChannel(undefined);}}><Input.Search value={keyword} onChange={setKeyword} placeholder="搜索模板 ID、编码或名称" style={{width:280}} /><Select placeholder="消息性质" value={nature} onChange={setNature} style={{width:140}} allowClear options={['事务','服务','营销'].map((value)=>({label:value,value}))}/><Select placeholder="渠道" value={channel} onChange={setChannel} style={{width:140}} allowClear options={['站内信','Push'].map((value)=>({label:value,value}))}/><Select placeholder="状态" value={status} onChange={setStatus} style={{width:140}} allowClear options={['草稿','审核中','待业务审核','已发布','已停用'].map((value)=>({label:value,value}))}/></FilterBar>
    <ResourceTable data={data} columns={columns} rowKey="id" />
    <Drawer width={820} title={preview ? `${preview.name} · ${preview.version} · 多语言生产` : '多语言生产'} visible={Boolean(preview)} onCancel={() => setPreview(undefined)} footer={null}>
      {preview && <TranslationWorkflowPanel template={store.templates.find((item)=>item.id===preview.id) || preview} batch={store.translationBatches.find((batch)=>batch.id===(store.templates.find((item)=>item.id===preview.id)?.translationBatchId || preview.translationBatchId))} onEdit={()=>{setPreview(undefined);setEditing(store.templates.find((item)=>item.id===preview.id)||preview);}} />}
    </Drawer>
    <TemplateEditorDrawer visible={Boolean(editing)} template={editing==='new'?undefined:editing} onClose={()=>setEditing(undefined)} onCreated={(item)=>setPreview(item)}/>
  </section>;
}
