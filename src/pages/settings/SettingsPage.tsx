import { Button, Card, Input, Tabs, Tag, Timeline } from '@arco-design/web-react';
import { IconPlus } from '@arco-design/web-react/icon';
import PageHeader from '../../components/PageHeader';
import StatusTag from '../../components/StatusTag';
import { openDetailedForm, openPrototypeDialog } from '../../utils/prototypeActions';

const categories=[['系统公告','普通','普通','30 天'],['交易通知','普通','普通','180 天'],['资产通知','重要','重要','365 天'],['安全通知','重要','重要','365 天'],['奖励通知','普通','普通','90 天'],['活动通知','普通','普通','60 天'],['风控通知','紧急','紧急','365 天']];

export default function SettingsPage(){
  return <section className="page-stack">
    <PageHeader title="系统配置" description="维护七类消息、跳转白名单、保留时间、角色权限和审计日志。"/>
    <Tabs type="card" defaultActiveTab="categories">
      <Tabs.TabPane key="categories" title="消息分类"><Card bordered={false} className="surface" title="分类字典" extra={<Button type="primary" size="small" icon={<IconPlus/>} onClick={() => openDetailedForm('category', '新增消息分类')}>新增分类</Button>}><div className="settings-list">{categories.map(([name,nature,risk,optout])=><div key={name}><strong>{name}</strong><Tag>{nature}</Tag><span>默认风险：{risk}</span><span>{optout}</span><StatusTag status="可用"/><Button type="text" onClick={() => openDetailedForm('category', `编辑分类 · ${name}`)}>编辑</Button></div>)}</div></Card></Tabs.TabPane>
      <Tabs.TabPane key="links" title="跳转白名单"><Card bordered={false} className="surface"><Input.Search placeholder="搜索路径或域名" onSearch={() => openPrototypeDialog('白名单查询结果','已按路径和域名刷新白名单结果。')}/><div className="code-list"><code>nexus://wallet/withdrawal/:id</code><code>nexus://security/devices</code><code>https://www.nexus.example/announcements/*</code></div></Card></Tabs.TabPane>
      <Tabs.TabPane key="roles" title="角色权限"><Card bordered={false} className="surface"><div className="role-matrix"><strong>角色</strong><strong>创建</strong><strong>提交</strong><strong>一级审核</strong><strong>二级审核</strong><strong>导出 PII</strong>{[['内容编辑','✓','✓','—','—','—'],['运营负责人','✓','✓','✓','—','—'],['风控审核','—','—','✓','✓','—'],['审计员','—','—','—','—','授权后']].flatMap(row=>row.map((cell,i)=><span key={`${row[0]}-${i}`}>{cell}</span>))}</div></Card></Tabs.TabPane>
      <Tabs.TabPane key="audit" title="审计日志"><Card bordered={false} className="surface"><Timeline>{['18:03 赵辰申请切换短信供应商 · CH-04','17:58 林夏提交夏季交易赛任务 · MSG-260712-002','17:44 唐宁发布 EU 合规策略 · POL-EU-07','16:32 Gary Ma 导出脱敏发送记录 · EXP-2201'].map(item=><Timeline.Item key={item}>{item}</Timeline.Item>)}</Timeline></Card></Tabs.TabPane>
    </Tabs>
  </section>;
}
