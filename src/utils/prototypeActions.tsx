import {
  Alert,
  Checkbox,
  DatePicker,
  Form,
  Grid,
  Input,
  InputNumber,
  Message,
  Modal,
  Radio,
  Select,
  Space,
  Switch,
  Tag,
} from '@arco-design/web-react';

export type DetailedFormKind = 'segment' | 'template' | 'automation' | 'event' | 'provider' | 'compliance' | 'category';

const Item = Form.Item;
const Col = Grid.Col;

const select = (items: string[]) => items.map((item) => <Select.Option key={item} value={item}>{item}</Select.Option>);

function SegmentForm() {
  return <>
    <Alert type="info" content="分群保存后先计算精确人数；高风险或全量分群用于任务时会自动升级审核。" />
    <Form layout="vertical" initialValues={{ type:'动态条件', purpose:'营销', owner:'增长运营', refresh:'每小时', timezone:'Asia/Shanghai' }}>
      <Grid.Row gutter={16}><Col span={12}><Item label="分群名称" field="name" required><Input placeholder="例如：近30天沉默交易用户" maxLength={80} showWordLimit /></Item></Col><Col span={12}><Item label="分群类型" field="type" required><Radio.Group type="button"><Radio value="动态条件">动态条件</Radio><Radio value="静态名单">静态名单</Radio><Radio value="组合分群">组合分群</Radio></Radio.Group></Item></Col></Grid.Row>
      <Item label="分群描述" field="description" required><Input.TextArea placeholder="说明业务目的、使用范围及注意事项" maxLength={300} showWordLimit /></Item>
      <Grid.Row gutter={16}><Col span={8}><Item label="业务用途" field="purpose" required><Select>{select(['事务','服务','营销','抑制'])}</Select></Item></Col><Col span={8}><Item label="所有者团队" field="owner" required><Select>{select(['增长运营','生命周期','资产运营','合规','VIP 运营'])}</Select></Item></Col><Col span={8}><Item label="数据刷新" field="refresh" required><Select>{select(['实时','每小时','每日','手动'])}</Select></Item></Col></Grid.Row>
      <div className="condition-builder"><div className="condition-head"><strong>筛选条件</strong><Tag color="arcoblue">AND 条件组</Tag></div><Grid.Row gutter={10}><Col span={8}><Select defaultValue="最近交易时间">{select(['注册时间','KYC 国家','总资产','最近交易时间','近30天交易额','营销授权'])}</Select></Col><Col span={6}><Select defaultValue="距今超过">{select(['等于','不等于','大于','小于','区间','距今超过'])}</Select></Col><Col span={6}><InputNumber defaultValue={30} min={1} style={{width:'100%'}} suffix="天" /></Col><Col span={4}><Select defaultValue="UTC">{select(['UTC','用户时区'])}</Select></Col></Grid.Row><div className="condition-preview">自然语言预览：最近交易时间距今超过 30 天</div></div>
      <Grid.Row gutter={16}><Col span={12}><Item label="数据时区" field="timezone"><Select>{select(['Asia/Shanghai','UTC','Europe/London','America/New_York'])}</Select></Item></Col><Col span={12}><Item label="过期时间" field="expireAt"><DatePicker showTime style={{width:'100%'}} placeholder="可选；过期后不可用于新任务" /></Item></Col></Grid.Row>
      <div className="estimate-strip"><div><span>预估人数</span><strong>328,400</strong></div><div><span>数据时点</span><strong>2026-07-13 10:12 UTC+8</strong></div><div><span>字段权限</span><strong>营销用途可用</strong></div></div>
    </Form>
  </>;
}

function TemplateForm() {
  return <Form layout="vertical" initialValues={{ nature:'营销', risk:'中', defaultLocale:'en-US', channels:['站内信','Push','邮件'], usage:['群发'], owner:'增长运营' }}>
    <Grid.Row gutter={16}><Col span={12}><Item label="模板编码" field="code" required><Input placeholder="snake_case，例如 campaign_launch" /></Item></Col><Col span={12}><Item label="模板名称" field="name" required><Input placeholder="后台识别名称" /></Item></Col></Grid.Row>
    <Item label="模板描述" field="description"><Input.TextArea placeholder="说明使用场景、触发条件和内容限制" /></Item>
    <Grid.Row gutter={16}><Col span={8}><Item label="业务线" field="business" required><Select>{select(['账户','资金','现货','合约','增长运营'])}</Select></Item></Col><Col span={8}><Item label="消息分类" field="category" required><Select>{select(['账户安全','资金通知','交易通知','系统公告','产品运营'])}</Select></Item></Col><Col span={8}><Item label="消息性质" field="nature" required><Select>{select(['强事务','事务','服务','营销'])}</Select></Item></Col></Grid.Row>
    <Grid.Row gutter={16}><Col span={8}><Item label="风险等级" field="risk"><Select>{select(['低','中','高','关键'])}</Select></Item></Col><Col span={8}><Item label="默认语言" field="defaultLocale"><Select>{select(['en-US','zh-CN','zh-TW','ja-JP'])}</Select></Item></Col><Col span={8}><Item label="所有者团队" field="owner"><Select>{select(['增长运营','安全中心','资金平台','资产运营'])}</Select></Item></Col></Grid.Row>
    <Item label="支持渠道" field="channels"><Checkbox.Group options={['站内信','Push','邮件','短信']} /></Item>
    <Item label="使用方式" field="usage"><Checkbox.Group options={['运营群发','事件触发','自动化流程']} /></Item>
    <div className="condition-builder"><div className="condition-head"><strong>标准模板变量</strong><Tag>5 个变量</Tag></div><Space wrap>{['user_nickname · string','amount · decimal','currency · string','symbol · string','occurred_at · datetime'].map(item=><Tag key={item} color="arcoblue">{`{{ ${item} }}`}</Tag>)}</Space></div>
  </Form>;
}

function AutomationForm() {
  return <Form layout="vertical" initialValues={{ goal:'召回', entry:'进入分群', repeat:'冷却期后可重复', priority:'普通', frequency:'全球营销 · 3次/24h' }}>
    <Grid.Row gutter={16}><Col span={12}><Item label="流程名称" field="name" required><Input placeholder="例如：沉默交易用户召回" /></Item></Col><Col span={12}><Item label="业务目标" field="goal" required><Select>{select(['激活','首充转化','交易转化','留存','召回'])}</Select></Item></Col></Grid.Row>
    <Item label="流程描述" field="description"><Input.TextArea placeholder="描述目标用户、触达节奏与预期结果" /></Item>
    <Grid.Row gutter={16}><Col span={8}><Item label="入口方式" field="entry"><Select>{select(['业务事件','进入分群','定时扫描','API'])}</Select></Item></Col><Col span={8}><Item label="重复进入" field="repeat"><Select>{select(['仅一次','冷却期后可重复','不限制'])}</Select></Item></Col><Col span={8}><Item label="冷却期"><InputNumber defaultValue={30} suffix="天" style={{width:'100%'}} /></Item></Col></Grid.Row>
    <Grid.Row gutter={16}><Col span={8}><Item label="转化事件"><Select placeholder="选择转化事件">{select(['deposit.confirmed','spot.order.filled','futures.position.opened'])}</Select></Item></Col><Col span={8}><Item label="归因窗口"><InputNumber defaultValue={7} suffix="天" style={{width:'100%'}} /></Item></Col><Col span={8}><Item label="最大运行时长"><InputNumber defaultValue={30} suffix="天" style={{width:'100%'}} /></Item></Col></Grid.Row>
    <Grid.Row gutter={16}><Col span={12}><Item label="全局频控" field="frequency"><Select>{select(['全球营销 · 3次/24h','活动级 · 1次/7d'])}</Select></Item></Col><Col span={12}><Item label="适用地区"><Select mode="multiple" placeholder="选择地区">{select(['Global','EU/EEA','SG','JP','TR'])}</Select></Item></Col></Grid.Row>
    <div className="flow-mini-map"><span>入口</span><i>→</i><span>等待 24h</span><i>→</i><span>条件分支</span><i>→</i><span>发送消息</span><i>→</i><span>转化检查</span></div>
  </Form>;
}

function EventForm() {
  return <Form layout="vertical" initialValues={{ version:'1.0.0', priority:'高', failure:'重试 + 死信 + 告警' }}>
    <Grid.Row gutter={16}><Col span={12}><Item label="事件编码" field="code" required><Input placeholder="snake_case，例如 deposit.confirmed" /></Item></Col><Col span={12}><Item label="事件名称" field="name" required><Input placeholder="中文业务名称" /></Item></Col></Grid.Row>
    <Grid.Row gutter={16}><Col span={8}><Item label="业务线"><Select>{select(['账户','资金','现货','合约','KYC'])}</Select></Item></Col><Col span={8}><Item label="事件版本" field="version"><Input /></Item></Col><Col span={8}><Item label="默认优先级" field="priority"><Select>{select(['普通','高','紧急'])}</Select></Item></Col></Grid.Row>
    <Grid.Row gutter={16}><Col span={12}><Item label="调用方" required><Select mode="multiple">{select(['wallet-gateway','risk-engine','account-service','futures-risk'])}</Select></Item></Col><Col span={12}><Item label="绑定模板"><Select placeholder="选择已发布模板">{select(['withdraw_success v12','deposit_success v9','login_risk v16'])}</Select></Item></Col></Grid.Row>
    <Grid.Row gutter={16}><Col span={12}><Item label="幂等键表达式"><Input placeholder="event_code + business_id + status" /></Item></Col><Col span={6}><Item label="事件 TTL"><InputNumber defaultValue={300} suffix="秒" style={{width:'100%'}} /></Item></Col><Col span={6}><Item label="每用户限速"><InputNumber defaultValue={10} suffix="次/分钟" style={{width:'100%'}} /></Item></Col></Grid.Row>
    <Item label="事件 Schema" required><Input.TextArea autoSize={{minRows:5,maxRows:8}} defaultValue={'{\n  "user_id": "string",\n  "business_id": "string",\n  "amount": "decimal",\n  "occurred_at": "datetime"\n}'} /></Item>
    <Item label="失败策略" field="failure"><Select>{select(['重试 + 死信 + 告警','只记录死信','立即告警'])}</Select></Item>
  </Form>;
}

function ProviderForm() {
  return <Form layout="vertical" initialValues={{ environment:'生产', priority:1, timeout:3000, status:true }}>
    <Alert type="warning" content="凭证只保存密钥管理系统引用，页面不会读取或展示明文。" />
    <Grid.Row gutter={16}><Col span={12}><Item label="供应商名称" required><Input placeholder="例如：Twilio SMS Primary" /></Item></Col><Col span={12}><Item label="供应商编码" required><Input placeholder="twilio_sms_primary" /></Item></Col></Grid.Row>
    <Grid.Row gutter={16}><Col span={8}><Item label="渠道" required><Select>{select(['站内信','Push','邮件','短信'])}</Select></Item></Col><Col span={8}><Item label="环境" field="environment"><Select>{select(['测试','生产'])}</Select></Item></Col><Col span={8}><Item label="适用地区"><Select mode="multiple">{select(['Global','EU','SG','JP','TR'])}</Select></Item></Col></Grid.Row>
    <Item label="API Endpoint" required><Input placeholder="https://api.provider.com/v2/messages" /></Item>
    <Grid.Row gutter={16}><Col span={12}><Item label="凭证引用" required><Input.Password placeholder="kms://prod/provider/credential" visibilityToggle={false} /></Item></Col><Col span={12}><Item label="回调验签方式"><Select>{select(['HMAC-SHA256','RSA-SHA256','IP 白名单'])}</Select></Item></Col></Grid.Row>
    <Item label="回调地址"><Input placeholder="https://callback.nexus.example/delivery" /></Item>
    <Grid.Row gutter={16}><Col span={6}><Item label="路由优先级" field="priority"><InputNumber min={1} max={10} /></Item></Col><Col span={6}><Item label="QPS"><InputNumber defaultValue={500} /></Item></Col><Col span={6}><Item label="超时（ms）" field="timeout"><InputNumber min={500} /></Item></Col><Col span={6}><Item label="启用状态" field="status" triggerPropName="checked"><Switch /></Item></Col></Grid.Row>
  </Form>;
}

function ComplianceForm() {
  return <Form layout="vertical" initialValues={{ nature:['营销'], channels:['Push','邮件','短信'], consent:'单渠道明确授权', doubleOptIn:false, action:'延迟至可发送时间' }}>
    <Grid.Row gutter={16}><Col span={12}><Item label="策略名称" required><Input placeholder="例如：EEA 营销触达" /></Item></Col><Col span={12}><Item label="策略版本"><Input defaultValue="v1" disabled /></Item></Col></Grid.Row>
    <Grid.Row gutter={16}><Col span={12}><Item label="国家/地区" required><Select mode="multiple">{select(['EU/EEA','SG','JP','TR','US'])}</Select></Item></Col><Col span={12}><Item label="消息性质" field="nature"><Select mode="multiple">{select(['强事务','事务','服务','营销'])}</Select></Item></Col></Grid.Row>
    <Item label="允许渠道" field="channels"><Checkbox.Group options={['站内信','Push','邮件','短信']} /></Item>
    <Grid.Row gutter={16}><Col span={12}><Item label="授权类型" field="consent"><Select>{select(['无需授权','营销统一授权','单渠道明确授权'])}</Select></Item></Col><Col span={12}><Item label="双重确认" field="doubleOptIn" triggerPropName="checked"><Switch checkedText="启用" /></Item></Col></Grid.Row>
    <Grid.Row gutter={16}><Col span={8}><Item label="安静时段开始"><Input defaultValue="21:00" /></Item></Col><Col span={8}><Item label="安静时段结束"><Input defaultValue="08:00" /></Item></Col><Col span={8}><Item label="命中后动作" field="action"><Select>{select(['延迟至可发送时间','跳过发送'])}</Select></Item></Col></Grid.Row>
    <Item label="必须文案"><Input.TextArea placeholder="输入当地法律声明、风险提示或退订文案" /></Item>
    <Grid.Row gutter={16}><Col span={12}><Item label="记录保留期"><InputNumber defaultValue={730} suffix="天" style={{width:'100%'}} /></Item></Col><Col span={12}><Item label="生效时间"><DatePicker showTime style={{width:'100%'}} /></Item></Col></Grid.Row>
  </Form>;
}

function CategoryForm() {
  return <Form layout="vertical" initialValues={{ nature:'事务', risk:'中', channels:['站内信','Push'], optOut:'部分允许', status:true }}>
    <Grid.Row gutter={16}><Col span={12}><Item label="分类编码" required><Input placeholder="例如：trade_notification" /></Item></Col><Col span={12}><Item label="分类名称" required><Input placeholder="中文展示名称" /></Item></Col></Grid.Row>
    <Grid.Row gutter={16}><Col span={8}><Item label="父分类"><Select allowClear>{select(['账户','资金','交易','运营'])}</Select></Item></Col><Col span={8}><Item label="消息性质" field="nature"><Select>{select(['强事务','事务','服务','营销'])}</Select></Item></Col><Col span={8}><Item label="默认风险" field="risk"><Select>{select(['低','中','高','关键'])}</Select></Item></Col></Grid.Row>
    <Item label="默认渠道" field="channels"><Checkbox.Group options={['站内信','Push','邮件','短信']} /></Item>
    <Grid.Row gutter={16}><Col span={8}><Item label="退订规则" field="optOut"><Select>{select(['不可退订','部分允许','允许退订','按地区'])}</Select></Item></Col><Col span={8}><Item label="默认保留期"><InputNumber defaultValue={365} suffix="天" /></Item></Col><Col span={8}><Item label="启用状态" field="status" triggerPropName="checked"><Switch /></Item></Col></Grid.Row>
    <Item label="审批流程"><Select>{select(['普通单审','业务 + 合规','一级 + 二级 + 风控'])}</Select></Item>
  </Form>;
}

const forms: Record<DetailedFormKind, () => JSX.Element> = {
  segment: SegmentForm,
  template: TemplateForm,
  automation: AutomationForm,
  event: EventForm,
  provider: ProviderForm,
  compliance: ComplianceForm,
  category: CategoryForm,
};

export function openDetailedForm(kind: DetailedFormKind, title: string) {
  const Content = forms[kind];
  Modal.confirm({
    title,
    style: { width: 820 },
    content: <div className="detailed-form-modal"><Content /></div>,
    okText: '保存草稿',
    cancelText: '取消',
    onOk: () => { Message.success(`${title}草稿已保存`); },
  });
}

export function openPrototypeDialog(title: string, content: string) {
  Modal.info({ title, content, okText: '知道了' });
}

export function confirmPrototypeAction(title: string, content: string, successText: string) {
  Modal.confirm({
    title,
    content,
    okText: '确认',
    cancelText: '取消',
    onOk: () => { Message.success(successText); },
  });
}
