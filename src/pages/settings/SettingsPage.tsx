import { Button, Card, Input, Tabs, Tag, Timeline } from '@arco-design/web-react';
import { IconPlus } from '@arco-design/web-react/icon';
import PageHeader from '../../components/PageHeader';
import StatusTag from '../../components/StatusTag';
import { openDetailedForm, openPrototypeDialog } from '../../utils/prototypeActions';

const categories=[['账户安全','强事务','关键','不可退订'],['资金通知','强事务','关键','不可退订'],['交易通知','事务','高','部分允许'],['系统公告','服务','中','按地区'],['产品运营','营销','中','允许退订'],['市场营销','营销','低','允许退订']];

export default function SettingsPage(){
  return <section className="page-stack">
    <PageHeader title="系统配置" description="维护分类、跳转白名单、内容规则、角色权限和审计日志。"/>
    <Tabs type="card" defaultActiveTab="categories">
      <Tabs.TabPane key="categories" title="消息分类"><Card bordered={false} className="surface" title="分类字典" extra={<Button type="primary" size="small" icon={<IconPlus/>} onClick={() => openDetailedForm('category', '新增消息分类')}>新增分类</Button>}><div className="settings-list">{categories.map(([name,nature,risk,optout])=><div key={name}><strong>{name}</strong><Tag>{nature}</Tag><span>默认风险：{risk}</span><span>{optout}</span><StatusTag status="可用"/><Button type="text" onClick={() => openDetailedForm('category', `编辑分类 · ${name}`)}>编辑</Button></div>)}</div></Card></Tabs.TabPane>
      <Tabs.TabPane key="links" title="跳转白名单"><Card bordered={false} className="surface"><Input.Search placeholder="搜索路径或域名" onSearch={() => openPrototypeDialog('白名单查询结果','已按路径和域名刷新白名单结果。')}/><div className="code-list"><code>nexus://wallet/withdrawal/:id</code><code>nexus://security/devices</code><code>https://www.nexus.example/announcements/*</code></div></Card></Tabs.TabPane>
      <Tabs.TabPane key="content" title="敏感词与规则"><Card bordered={false} className="surface"><div className="rule-grid">{[['收益承诺','阻止发送','营销 · 全球'],['高风险产品词','升级审核','受限地区'],['外部短链','阻止发送','全部消息'],['紧急措辞','提示','运营消息']].map(row=><div key={row[0]}><strong>{row[0]}</strong><Tag color={row[1]==='阻止发送'?'red':'orange'}>{row[1]}</Tag><span>{row[2]}</span></div>)}</div></Card></Tabs.TabPane>
      <Tabs.TabPane key="roles" title="角色权限"><Card bordered={false} className="surface"><div className="role-matrix"><strong>角色</strong><strong>创建</strong><strong>提交</strong><strong>一级审核</strong><strong>二级审核</strong><strong>导出 PII</strong>{[['内容编辑','✓','✓','—','—','—'],['运营负责人','✓','✓','✓','—','—'],['风控审核','—','—','✓','✓','—'],['审计员','—','—','—','—','授权后']].flatMap(row=>row.map((cell,i)=><span key={`${row[0]}-${i}`}>{cell}</span>))}</div></Card></Tabs.TabPane>
      <Tabs.TabPane key="audit" title="审计日志"><Card bordered={false} className="surface"><Timeline>{['18:03 赵辰申请切换短信供应商 · CH-04','17:58 林夏提交夏季交易赛任务 · MSG-260712-002','17:44 唐宁发布 EU 合规策略 · POL-EU-07','16:32 Gary Ma 导出脱敏发送记录 · EXP-2201'].map(item=><Timeline.Item key={item}>{item}</Timeline.Item>)}</Timeline></Card></Tabs.TabPane>
    </Tabs>
  </section>;
}
