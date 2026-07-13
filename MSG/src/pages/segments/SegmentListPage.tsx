import { useState } from 'react';
import { Button, Descriptions, Drawer, Form, Grid, Input, InputNumber, Message, Modal, Progress, Radio, Select, Tag, Typography } from '@arco-design/web-react';
import { IconPlus } from '@arco-design/web-react/icon';
import type { TableColumnProps } from '@arco-design/web-react';
import PageHeader from '../../components/PageHeader';
import FilterBar from '../../components/FilterBar';
import ResourceTable from '../../components/ResourceTable';
import StatusTag from '../../components/StatusTag';
import { segments } from '../../mocks/data';
import type { AudienceSegment } from '../../domain/types';

export default function SegmentListPage() {
  const [selected, setSelected] = useState<AudienceSegment>();
  const [data,setData]=useState(segments);
  const [editing,setEditing]=useState<AudienceSegment | 'new'>();
  const [keyword,setKeyword]=useState('');
  const [type,setType]=useState<string>();
  const [purpose,setPurpose]=useState<string>();
  const [form]=Form.useForm();
  const filtered=data.filter((item)=>`${item.id}${item.name}`.toLowerCase().includes(keyword.toLowerCase())&&(!type||item.type===type)&&(!purpose||item.purpose===purpose));
  const save=async()=>{try{const values=await form.validate();if(editing==='new'){setData((items)=>[{id:`SEG-${Date.now().toString().slice(-4)}`,name:values.name,type:values.type,purpose:values.purpose,count:values.estimate||0,change:0,refresh:values.refresh,updatedAt:'刚刚',owner:values.owner,status:'计算中',rule:`${values.field} ${values.operator} ${values.threshold}`},...items]);}else if(editing){setData((items)=>items.map((item)=>item.id===editing.id?{...item,...values,rule:`${values.field} ${values.operator} ${values.threshold}`,updatedAt:'刚刚'}:item));}Message.success(editing==='new'?'分群已创建并开始计算':'分群规则已更新');setEditing(undefined);}catch{/* validation */}};
  const openEditor=(item:AudienceSegment|'new')=>{setEditing(item);if(item==='new')form.resetFields();else form.setFieldsValue({...item,field:'最近交易时间',operator:'距今超过',threshold:30,estimate:item.count});};
  const columns: TableColumnProps<AudienceSegment>[] = [
    { title:'分群', width:240, render:(_,r)=><div><Typography.Text className="strong">{r.name}</Typography.Text><div className="mono muted">{r.id}</div></div> },
    { title:'类型 / 用途', width:130, render:(_,r)=><div>{r.type}<div><Tag size="small">{r.purpose}</Tag></div></div> },
    { title:'当前人数', width:150, render:(_,r)=><div className="strong">{r.count.toLocaleString()}<div className={r.change>=0?'metric-change positive':'metric-change negative'}>{r.change>=0?'+':''}{r.change}%</div></div> },
    { title:'规则摘要', dataIndex:'rule', width:300 },
    { title:'刷新', width:140, render:(_,r)=><div>{r.refresh}<div className="muted">更新于 {r.updatedAt}</div></div> },
    { title:'数据健康', width:140, render:()=> <Progress percent={98} size="small" /> },
    { title:'所有者', dataIndex:'owner', width:120 },
    { title:'状态', width:100, render:(_,r)=><StatusTag status={r.status} /> },
    { title:'操作', fixed:'right', width:84, render:(_,r)=> <Button type="text" onClick={() => setSelected(r)}>查看</Button> },
  ];
  return <section className="page-stack">
    <PageHeader title="用户分群" description="按地区、资产、交易行为和消息偏好构建可审计受众。" actions={<Button type="primary" icon={<IconPlus />} onClick={() => openEditor('new')}>新建分群</Button>} />
    <FilterBar onReset={()=>{setKeyword('');setType(undefined);setPurpose(undefined);}}><Input.Search value={keyword} onChange={setKeyword} placeholder="搜索分群名称或 ID" style={{width:260}}/><Select placeholder="分群类型" value={type} onChange={setType} allowClear style={{width:140}} options={['动态条件','静态名单','组合分群'].map((value)=>({label:value,value}))}/><Select placeholder="业务用途" value={purpose} onChange={setPurpose} allowClear style={{width:140}} options={['营销','服务','事务','抑制'].map((value)=>({label:value,value}))}/></FilterBar>
    <ResourceTable data={filtered} columns={columns} rowKey="id" />
    <Drawer width={560} visible={Boolean(selected)} title={selected ? `分群详情 · ${selected.name}` : '分群详情'} onCancel={() => setSelected(undefined)} footer={<Button type="primary" onClick={() => {if(selected){openEditor(selected);setSelected(undefined);}}}>编辑规则</Button>}>
      {selected && <Descriptions column={1} border data={[{label:'分群 ID',value:selected.id},{label:'类型',value:selected.type},{label:'业务用途',value:selected.purpose},{label:'当前人数',value:selected.count.toLocaleString()},{label:'规则摘要',value:selected.rule},{label:'刷新方式',value:selected.refresh},{label:'所有者',value:selected.owner},{label:'状态',value:<StatusTag status={selected.status}/>}]} />}
    </Drawer>
    <Modal visible={Boolean(editing)} title={editing==='new'?'创建用户分群':`编辑分群 · ${editing?.name}`} onCancel={()=>setEditing(undefined)} onOk={save} okText="保存并计算" style={{width:820}} unmountOnExit><Form form={form} layout="vertical" initialValues={{type:'动态条件',purpose:'营销',owner:'增长运营',refresh:'每小时',field:'最近交易时间',operator:'距今超过',threshold:30,estimate:328400}}><Grid.Row gutter={16}><Grid.Col span={12}><Form.Item label="分群名称" field="name" required rules={[{required:true}]}><Input/></Form.Item></Grid.Col><Grid.Col span={12}><Form.Item label="分群类型" field="type"><Radio.Group type="button"><Radio value="动态条件">动态条件</Radio><Radio value="静态名单">静态名单</Radio><Radio value="组合分群">组合分群</Radio></Radio.Group></Form.Item></Grid.Col><Grid.Col span={8}><Form.Item label="业务用途" field="purpose"><Select options={['事务','服务','营销','抑制'].map((value)=>({label:value,value}))}/></Form.Item></Grid.Col><Grid.Col span={8}><Form.Item label="所有者团队" field="owner"><Select options={['增长运营','资产运营','合规','VIP 运营'].map((value)=>({label:value,value}))}/></Form.Item></Grid.Col><Grid.Col span={8}><Form.Item label="数据刷新" field="refresh"><Select options={['实时','每小时','每日','手动'].map((value)=>({label:value,value}))}/></Form.Item></Grid.Col></Grid.Row><h3>条件构建器</h3><Grid.Row gutter={12}><Grid.Col span={8}><Form.Item label="字段" field="field"><Select options={['注册时间','KYC 国家','总资产','最近交易时间','营销授权'].map((value)=>({label:value,value}))}/></Form.Item></Grid.Col><Grid.Col span={8}><Form.Item label="运算符" field="operator"><Select options={['等于','不等于','大于','小于','距今超过'].map((value)=>({label:value,value}))}/></Form.Item></Grid.Col><Grid.Col span={8}><Form.Item label="阈值" field="threshold"><InputNumber suffix="天" style={{width:'100%'}}/></Form.Item></Grid.Col></Grid.Row><Form.Item label="预估人数" field="estimate"><InputNumber disabled style={{width:'100%'}}/></Form.Item></Form></Modal>
  </section>;
}
