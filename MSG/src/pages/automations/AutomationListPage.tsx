import { Button, Card, Grid, Progress, Space, Tag } from '@arco-design/web-react';
import { IconPlus, IconSettings } from '@arco-design/web-react/icon';
import PageHeader from '../../components/PageHeader';
import StatusTag from '../../components/StatusTag';
import { openDetailedForm, openPrototypeDialog } from '../../utils/prototypeActions';

const flows=[['新用户首充 7 日旅程','注册完成','18,420','12.8%','v5','审核中'],['沉默交易用户召回','进入沉默分群','86,210','8.4%','v12','发送中'],['VIP 等级提升培育','VIP 等级变更','4,280','31.6%','v3','发送中'],['KYC 未完成提醒','KYC 状态停留 24h','11,720','19.2%','v8','已暂停'],['首次合约交易教育','首次开通合约','6,420','22.4%','v4','草稿'],['高价值用户流失预警','资产下降 ≥ 60%','2,180','—','v2','待审核']];

export default function AutomationListPage(){
  return <section className="page-stack">
    <PageHeader title="自动化流程" description="用事件、条件、等待和分支构建可控的用户生命周期旅程。" actions={<Button type="primary" icon={<IconPlus/>} onClick={() => openDetailedForm('automation','新建自动化流程')}>新建流程</Button>} />
    <Grid.Row gutter={[16,16]}>{flows.map(([name,entry,users,conversion,version,status],i)=><Grid.Col xs={24} md={12} xl={8} key={name}><Card className="automation-card" bordered={false} title={<Space><span className={`flow-dot flow-${i%3}`}/>{name}</Space>} extra={<Button type="text" icon={<IconSettings/>} aria-label={`配置 ${name}`} onClick={() => openDetailedForm('automation',`配置流程 · ${name}`)}/>}><div className="flow-trigger"><span>入口事件</span><strong>{entry}</strong></div><div className="flow-metrics"><div><span>运行用户</span><strong>{users}</strong></div><div><span>转化率</span><strong>{conversion}</strong></div><div><span>版本</span><Tag>{version}</Tag></div></div><Progress percent={i===1?72:i===2?54:i===3?36:18} size="small" showText={false}/><div className="flow-footer"><StatusTag status={status}/><Button type="text" onClick={() => openPrototypeDialog(`运行记录 · ${name}`,`当前运行用户 ${users}，转化率 ${conversion}。可按节点、地区、版本和退出原因查询明细。`)}>查看运行记录</Button></div></Card></Grid.Col>)}</Grid.Row>
  </section>;
}
