import { useState } from 'react';
import { Alert, Button, Card, Checkbox, DatePicker, Form, Grid, Input, InputNumber, Message, Radio, Select, Space, Steps, Switch, Tag, TimePicker } from '@arco-design/web-react';
import { IconArrowLeft, IconCheck, IconSave } from '@arco-design/web-react/icon';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import TaskSummary from './TaskSummary';
import { openPrototypeDialog } from '../../utils/prototypeActions';
import { templates } from '../../mocks/data';

const FormItem = Form.Item;
const channels = ['Web 站内信','App Push（预留）'];
const categoryOptions = ['系统公告','交易通知','资产通知','安全通知','奖励通知','活动通知','风控通知'];
const approvedTemplates = templates.filter((template)=>template.translationReadiness==='全部审核通过');

export default function CreateTaskPage() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [audienceType, setAudienceType] = useState('all');
  const [templateId, setTemplateId] = useState(approvedTemplates[0]?.id);
  const [form] = Form.useForm();
  const selectedTemplate = approvedTemplates.find((template)=>template.id===templateId) || approvedTemplates[0];

  const next = async () => {
    if (current === 0) {
      try { await form.validate(['name']); } catch { return; }
    }
    setCurrent((value) => Math.min(value + 1, 3));
  };

  return <section className="page-stack create-task-page">
    <PageHeader eyebrow="CREATE CAMPAIGN" title="新建消息任务" description="所有内容与发送配置在提交审核后锁定，修改将使审批失效。" actions={<><Button icon={<IconSave />} onClick={() => Message.success('草稿已保存在本地原型')}>保存草稿</Button><Button icon={<IconArrowLeft />} onClick={() => navigate('/tasks')}>返回列表</Button></>} />
    <Card bordered={false} className="surface wizard-shell">
      <Steps current={current} lineless labelPlacement="vertical" className="task-steps"><Steps.Step title="基础信息与模板" description="定义任务与内容"/><Steps.Step title="目标用户" description="配置受众与排除"/><Steps.Step title="发送策略" description="时间、频控与降级"/><Steps.Step title="检查并提交" description="风险和审批链"/></Steps>
      <Form form={form} layout="vertical" initialValues={{ nature:'事务', risk:'中', template:approvedTemplates[0]?.id, locales:selectedTemplate?.locales, channels:['Web 站内信'], audienceType:'all', timezone:'Asia/Shanghai', priority:'普通', quiet:'遵守并延迟', dedupe:true, rate:1200 }}>
        {current===0 && <div className="form-section"><h3>任务基础信息</h3><p>内部识别信息不会展示给终端用户。</p><Grid.Row gutter={20}>
          <Grid.Col xs={24} md={12}><FormItem label="任务名称" field="name" required rules={[{required:true,message:'请输入任务名称'}]}><Input placeholder="例如：夏季交易赛召回" maxLength={100} showWordLimit /></FormItem></Grid.Col>
          <Grid.Col xs={24} md={12}><FormItem label="业务线" field="business" required><Select placeholder="选择业务线"><Select.Option value="growth">增长运营</Select.Option><Select.Option value="wallet">资金平台</Select.Option><Select.Option value="risk">风险控制</Select.Option></Select></FormItem></Grid.Col>
          <Grid.Col xs={24} md={8}><FormItem label="消息分类" field="category" required><Select placeholder="选择分类">{categoryOptions.map((item)=><Select.Option key={item} value={item}>{item}</Select.Option>)}</Select></FormItem></Grid.Col>
          <Grid.Col xs={24} md={8}><FormItem label="消息性质" field="nature"><Radio.Group type="button"><Radio value="事务">事务</Radio><Radio value="营销">营销</Radio></Radio.Group></FormItem></Grid.Col>
          <Grid.Col xs={24} md={8}><FormItem label="风险等级" field="risk"><Select disabled><Select.Option value="中">中 · 系统自动判定</Select.Option></Select></FormItem></Grid.Col>
        </Grid.Row><div className="section-divider"/><h3>模板与渠道</h3><Grid.Row gutter={20}>
          <Grid.Col xs={24} md={12}><FormItem label="消息模板" field="template" required extra="仅显示全部目标语言人工审核通过的模板版本"><Select placeholder="选择翻译审核已通过的模板" showSearch onChange={setTemplateId}>{approvedTemplates.map((template)=><Select.Option key={template.id} value={template.id}>{template.name} · {template.version}</Select.Option>)}</Select></FormItem></Grid.Col>
          <Grid.Col xs={24} md={12}><FormItem label="目标语言" field="locales"><Select mode="multiple" disabled>{selectedTemplate?.locales.map((locale)=><Select.Option key={locale} value={locale}>{locale}</Select.Option>)}</Select></FormItem></Grid.Col>
          <Grid.Col span={24}><div className="task-template-readiness"><div><Tag color="green">翻译审核通过</Tag><strong>{selectedTemplate?.name} · {selectedTemplate?.version}</strong><span className="mono">{selectedTemplate?.translationBatchId}</span></div><p>默认语言 {selectedTemplate?.sourceLocale}；已审核语言 {selectedTemplate?.locales.join('、')}。源文案或译文发生变化后，翻译审核立即失效，模板将从此列表移除。</p></div></Grid.Col>
          <Grid.Col span={24}><FormItem label="发送渠道" field="channels"><Checkbox.Group options={channels}/></FormItem><Alert type="info" content="营销邮件与短信会根据目标地区自动插入退订入口和法定文案。"/></Grid.Col>
        </Grid.Row></div>}
        {current===1 && <div className="form-section"><h3>目标用户</h3><p>发送前会再次校验最新授权、退订和抑制名单。</p><Grid.Row gutter={20}>
          <Grid.Col span={24}><FormItem label="受众方式" field="audienceType"><Radio.Group type="button" onChange={setAudienceType}><Radio value="all">全部用户</Radio><Radio value="uid">指定用户</Radio><Radio value="vip">指定 VIP</Radio><Radio value="agent">指定代理</Radio><Radio value="campaign">活动参与用户</Radio></Radio.Group></FormItem></Grid.Col>
          <Grid.Col xs={24} md={12}>{audienceType==='uid'?<FormItem label="用户 UID" required><Input.TextArea placeholder="每行一个 UID，或上传名单"/></FormItem>:audienceType==='vip'?<FormItem label="VIP 等级" required><Select mode="multiple" placeholder="选择 VIP 等级">{['VIP 1-3','VIP 4-6','VIP 7-9'].map(x=><Select.Option key={x} value={x}>{x}</Select.Option>)}</Select></FormItem>:audienceType==='agent'?<FormItem label="代理范围" required><Input placeholder="输入代理 UID 或选择代理层级"/></FormItem>:audienceType==='campaign'?<FormItem label="活动参与用户" required><Select placeholder="选择活动及参与状态"><Select.Option value="summer-joined">夏季交易赛 · 已报名</Select.Option><Select.Option value="summer-finished">夏季交易赛 · 已完成任务</Select.Option></Select></FormItem>:<FormItem label="全站范围"><Select defaultValue="active"><Select.Option value="active">全部有效用户</Select.Option><Select.Option value="trading">近30天活跃用户</Select.Option></Select></FormItem>}</Grid.Col>
          <Grid.Col xs={24} md={12}><FormItem label="排除分群" field="exclude"><Select mode="multiple" placeholder="可选择多个排除分群"><Select.Option value="eu-optout">EU 营销退订 · 120,480</Select.Option><Select.Option value="risk">高风险账户 · 8,241</Select.Option></Select></FormItem></Grid.Col>
          <Grid.Col xs={24} md={12}><FormItem label="目标国家/地区" field="regions"><Select mode="multiple" placeholder="选择地区"><Select.Option value="SG">Singapore</Select.Option><Select.Option value="EU">EU/EEA</Select.Option><Select.Option value="TR">Türkiye</Select.Option></Select></FormItem></Grid.Col>
          <Grid.Col xs={24} md={12}><FormItem label="用户去重" field="dedupe" triggerPropName="checked"><Switch checkedText="按 UID 去重" uncheckedText="关闭"/></FormItem></Grid.Col>
        </Grid.Row><div className="audience-preview"><div><span>原始分群</span><strong>352,840</strong></div><i>→</i><div><span>合规过滤</span><strong>- 16,420</strong></div><i>→</i><div><span>预计可发送</span><strong>328,400</strong></div><Button onClick={() => openPrototypeDialog('受众计算完成','最新分群快照已计算：原始 352,840 人，合规及偏好过滤后预计可发送 328,400 人。')}>刷新人数</Button></div></div>}
        {current===2 && <div className="form-section"><h3>发送与渠道策略</h3><p>营销消息必须遵守用户本地安静时段与全局频控。</p><Grid.Row gutter={20}>
          <Grid.Col xs={24} md={8}><FormItem label="发送模式" field="scheduleMode"><Select defaultValue="scheduled"><Select.Option value="now">立即发送</Select.Option><Select.Option value="scheduled">指定时间</Select.Option><Select.Option value="local">用户本地时间</Select.Option></Select></FormItem></Grid.Col>
          <Grid.Col xs={24} md={8}><FormItem label="计划发送时间" field="scheduledAt"><DatePicker showTime style={{width:'100%'}}/></FormItem></Grid.Col>
          <Grid.Col xs={24} md={8}><FormItem label="任务时区" field="timezone"><Select><Select.Option value="Asia/Shanghai">Asia/Shanghai · UTC+8</Select.Option><Select.Option value="UTC">UTC</Select.Option></Select></FormItem></Grid.Col>
          <Grid.Col xs={24} md={8}><FormItem label="优先级" field="priority"><Select><Select.Option value="普通">普通</Select.Option><Select.Option value="高">高</Select.Option><Select.Option value="紧急">紧急（需授权）</Select.Option></Select></FormItem></Grid.Col>
          <Grid.Col xs={24} md={8}><FormItem label="安静时段策略" field="quiet"><Select><Select.Option value="遵守并延迟">遵守并延迟</Select.Option><Select.Option value="命中后跳过">命中后跳过</Select.Option></Select></FormItem></Grid.Col>
          <Grid.Col xs={24} md={8}><FormItem label="频控策略" field="frequency"><Select placeholder="选择策略"><Select.Option value="global">全球营销 · 3次/24h</Select.Option><Select.Option value="campaign">活动级 · 1次/7d</Select.Option></Select></FormItem></Grid.Col>
          <Grid.Col xs={24} md={8}><FormItem label="消息有效期" field="expireAt"><DatePicker showTime style={{width:'100%'}} placeholder="到期后停止跳转"/></FormItem></Grid.Col>
          <Grid.Col xs={24} md={8}><FormItem label="发送速率（每秒）" field="rate"><InputNumber min={1} max={5000} style={{width:'100%'}}/></FormItem></Grid.Col>
          <Grid.Col xs={24} md={8}><FormItem label="本地发送时间" field="localTime"><TimePicker style={{width:'100%'}}/></FormItem></Grid.Col>
        </Grid.Row><Space style={{marginBottom:16}}><Tag color="arcoblue">Web 站内信</Tag><Tag color="gray">App Push（预留）</Tag></Space><Alert type="warning" title="风险与有效期检查" content="全站或紧急消息将升级为业务 + 风控双审；超过有效期后不再生成新消息。"/></div>}
        {current===3 && <TaskSummary />}
      </Form>
      <div className="wizard-footer"><Button disabled={current===0} onClick={() => setCurrent(v=>v-1)}>上一步</Button><Space><Button onClick={() => Message.info('测试消息已加入模拟发送队列')}>测试发送</Button>{current<3?<Button type="primary" onClick={next}>下一步</Button>:<Button type="primary" icon={<IconCheck/>} onClick={() => Message.success('任务已提交一级审核')}>提交审核</Button>}</Space></div>
    </Card>
  </section>;
}
