import { useState } from 'react';
import { Button, Descriptions, Drawer, Input, Select, Space, Tabs, Tag, Typography } from '@arco-design/web-react';
import { IconPlus } from '@arco-design/web-react/icon';
import type { TableColumnProps } from '@arco-design/web-react';
import PageHeader from '../../components/PageHeader';
import FilterBar from '../../components/FilterBar';
import ResourceTable from '../../components/ResourceTable';
import StatusTag from '../../components/StatusTag';
import { templates } from '../../mocks/data';
import type { MessageTemplate } from '../../domain/types';
import { openPrototypeDialog } from '../../utils/prototypeActions';

export default function TemplateListPage() {
  const [preview, setPreview] = useState<MessageTemplate>();
  const columns: TableColumnProps<MessageTemplate>[] = [
    { title:'模板', width:240, render:(_,r) => <div><Typography.Text className="strong">{r.name}</Typography.Text><div className="mono muted">{r.code}</div></div> },
    { title:'分类 / 性质', width:150, render:(_,r) => <div>{r.category}<div className="muted">{r.nature}</div></div> },
    { title:'风险', dataIndex:'risk', width:80 },
    { title:'渠道', width:200, render:(_,r) => <Space wrap>{r.channels.map(c => <Tag key={c}>{c}</Tag>)}</Space> },
    { title:'语言覆盖', width:210, render:(_,r) => <div>{r.locales.slice(0,3).join(' · ')}{r.locales.length>3 && ` +${r.locales.length-3}`}<div className="muted">默认 en-US</div></div> },
    { title:'版本', dataIndex:'version', width:70 },
    { title:'事件编码', dataIndex:'eventCode', width:220, render:(v) => <span className="mono">{v || '—'}</span> },
    { title:'状态', width:100, render:(_,r) => <StatusTag status={r.status} /> },
    { title:'更新时间', dataIndex:'updatedAt', width:120 },
    { title:'操作', fixed:'right', width:84, render:(_,r) => <Button type="text" onClick={() => setPreview(r)}>预览</Button> },
  ];
  return <section className="page-stack"><PageHeader title="消息模板" description="维护多语言、多渠道内容、变量和不可变发布版本。" actions={<Button type="primary" icon={<IconPlus />} onClick={() => openPrototypeDialog('新建消息模板','选择业务线、消息性质、默认语言和渠道后，进入多语言内容编辑器。')}>新建模板</Button>} />
    <FilterBar><Input.Search placeholder="搜索模板 ID、编码或名称" style={{width:280}} /><Select placeholder="消息性质" style={{width:140}} allowClear /><Select placeholder="渠道" style={{width:140}} allowClear /><Select placeholder="状态" style={{width:140}} allowClear /></FilterBar>
    <ResourceTable data={templates} columns={columns} rowKey="id" />
    <Drawer width={620} title={preview ? `${preview.name} · ${preview.version}` : '模板预览'} visible={Boolean(preview)} onCancel={() => setPreview(undefined)} footer={null}>
      {preview && <><Descriptions column={2} border data={[{label:'模板编码',value:preview.code},{label:'风险等级',value:preview.risk},{label:'语言',value:preview.locales.join(', ')},{label:'状态',value:<StatusTag status={preview.status} />}]} /><Tabs defaultActiveTab="站内信">{preview.channels.map(channel => <Tabs.TabPane key={channel} title={channel}><div className="message-preview"><span className="preview-label">{channel} · zh-CN</span><h3>{preview.name}</h3><p>尊敬的用户，您的操作状态已更新。请登录 NEXUS 查看详细信息。</p><Button type="primary" onClick={() => openPrototypeDialog('跳转预览','该 CTA 将打开已备案深链，并自动携带任务归因参数。')}>查看详情</Button><div className="variable-block">变量：&#123;&#123; user_name &#125;&#125; · &#123;&#123; amount &#125;&#125; · &#123;&#123; occurred_at &#125;&#125;</div></div></Tabs.TabPane>)}</Tabs></>}
    </Drawer>
  </section>;
}
