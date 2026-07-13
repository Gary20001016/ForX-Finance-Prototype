import { useState } from 'react';
import { Alert, Button, Card, Checkbox, DatePicker, Form, Grid, Input, InputNumber, Message, Radio, Select, Space, Steps, Switch, Tag, TimePicker } from '@arco-design/web-react';
import { IconArrowLeft, IconCheck, IconSave } from '@arco-design/web-react/icon';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import TaskSummary from './TaskSummary';
import { openPrototypeDialog } from '../../utils/prototypeActions';

const FormItem = Form.Item;
const channels = ['站内信','Push','邮件','短信'];

export default function CreateTaskPage() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [form] = Form.useForm();

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
      <Form form={form} layout="vertical" initialValues={{ nature:'营销', risk:'中', locales:['zh-CN','en-US'], channels:['Push','邮件'], audienceType:'segment', timezone:'Asia/Shanghai', priority:'普通', quiet:'遵守并延迟', relation:'顺序降级', dedupe:true, rate:1200 }}>
        {current===0 && <div className="form-section"><h3>任务基础信息</h3><p>内部识别信息不会展示给终端用户。</p><Grid.Row gutter={20}>
          <Grid.Col xs={24} md={12}><FormItem label="任务名称" field="name" required rules={[{required:true,message:'请输入任务名称'}]}><Input placeholder="例如：夏季交易赛召回" maxLength={100} showWordLimit /></FormItem></Grid.Col>
          <Grid.Col xs={24} md={12}><FormItem label="业务线" field="business" required><Select placeholder="选择业务线"><Select.Option value="growth">增长运营</Select.Option><Select.Option value="wallet">资金平台</Select.Option><Select.Option value="risk">风险控制</Select.Option></Select></FormItem></Grid.Col>
          <Grid.Col xs={24} md={8}><FormItem label="消息分类" field="category" required><Select placeholder="选择分类"><Select.Option value="operation">产品运营</Select.Option><Select.Option value="security">账户安全</Select.Option><Select.Option value="fund">资金通知</Select.Option></Select></FormItem></Grid.Col>
          <Grid.Col xs={24} md={8}><FormItem label="消息性质" field="nature"><Radio.Group type="button"><Radio value="事务">事务</Radio><Radio value="营销">营销</Radio></Radio.Group></FormItem></Grid.Col>
          <Grid.Col xs={24} md={8}><FormItem label="风险等级" field="risk"><Select disabled><Select.Option value="中">中 · 系统自动判定</Select.Option></Select></FormItem></Grid.Col>
        </Grid.Row><div className="section-divider"/><h3>模板与渠道</h3><Grid.Row gutter={20}>
          <Grid.Col xs={24} md={12}><FormItem label="消息模板" field="template" required><Select placeholder="选择已发布模板" showSearch><Select.Option value="summer_trade">夏季交易赛 · v4</Select.Option><Select.Option value="maintenance">系统维护公告 · v8</Select.Option></Select></FormItem></Grid.Col>
          <Grid.Col xs={24} md={12}><FormItem label="目标语言" field="locales"><Select mode="multiple"><Select.Option value="zh-CN">简体中文</Select.Option><Select.Option value="en-US">English</Select.Option><Select.Option value="tr-TR">Türkçe</Select.Option></Select></FormItem></Grid.Col>
          <Grid.Col span={24}><FormItem label="发送渠道" field="channels"><Checkbox.Group options={channels}/></FormItem><Alert type="info" content="营销邮件与短信会根据目标地区自动插入退订入口和法定文案。"/></Grid.Col>
        </Grid.Row></div>}
        {current===1 && <div className="form-section"><h3>目标用户</h3><p>发送前会再次校验最新授权、退订和抑制名单。</p><Grid.Row gutter={20}>
          <Grid.Col span={24}><FormItem label="受众方式" field="audienceType"><Radio.Group type="button"><Radio value="all">全部用户</Radio><Radio value="segment">已有分群</Radio><Radio value="conditions">临时条件</Radio><Radio value="upload">上传名单</Radio></Radio.Group></FormItem></Grid.Col>
          <Grid.Col xs={24} md={12}><FormItem label="目标分群" field="segment" required><Select placeholder="选择分群"><Select.Option value="silent">近30天沉默交易用户 · 328,400</Select.Option><Select.Option value="new">注册后24小时未入金 · 47,280</Select.Option></Select></FormItem></Grid.Col>
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
          <Grid.Col xs={24} md={8}><FormItem label="渠道关系" field="relation"><Select><Select.Option value="顺序降级">顺序降级</Select.Option><Select.Option value="并行发送">并行发送</Select.Option><Select.Option value="用户偏好">按用户偏好</Select.Option></Select></FormItem></Grid.Col>
          <Grid.Col xs={24} md={8}><FormItem label="发送速率（每秒）" field="rate"><InputNumber min={1} max={5000} style={{width:'100%'}}/></FormItem></Grid.Col>
          <Grid.Col xs={24} md={8}><FormItem label="本地发送时间" field="localTime"><TimePicker style={{width:'100%'}}/></FormItem></Grid.Col>
        </Grid.Row><Alert type="warning" title="自动熔断已启用" content="5 分钟窗口内永久失败率 > 5% 或投诉率 > 0.1% 时，系统自动暂停任务。"/></div>}
        {current===3 && <TaskSummary />}
      </Form>
      <div className="wizard-footer"><Button disabled={current===0} onClick={() => setCurrent(v=>v-1)}>上一步</Button><Space><Button onClick={() => Message.info('测试消息已加入模拟发送队列')}>测试发送</Button>{current<3?<Button type="primary" onClick={next}>下一步</Button>:<Button type="primary" icon={<IconCheck/>} onClick={() => Message.success('任务已提交一级审核')}>提交审核</Button>}</Space></div>
    </Card>
  </section>;
}
