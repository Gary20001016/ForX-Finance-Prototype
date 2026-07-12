import { Button, Input, Progress, Select, Tag, Typography } from '@arco-design/web-react';
import { IconPlus } from '@arco-design/web-react/icon';
import type { TableColumnProps } from '@arco-design/web-react';
import PageHeader from '../../components/PageHeader'; import FilterBar from '../../components/FilterBar'; import ResourceTable from '../../components/ResourceTable'; import StatusTag from '../../components/StatusTag';
import { segments } from '../../mocks/data'; import type { AudienceSegment } from '../../domain/types';

export default function SegmentListPage() {
  const columns: TableColumnProps<AudienceSegment>[] = [
    {title:'分群',width:240,render:(_,r)=><div><Typography.Text className="strong">{r.name}</Typography.Text><div className="mono muted">{r.id}</div></div>},
    {title:'类型 / 用途',width:130,render:(_,r)=><div>{r.type}<div><Tag size="small">{r.purpose}</Tag></div></div>},
    {title:'当前人数',width:150,render:(_,r)=><div className="strong">{r.count.toLocaleString()}<div className={r.change>=0?'metric-change positive':'metric-change negative'}>{r.change>=0?'+':''}{r.change}%</div></div>},
    {title:'规则摘要',dataIndex:'rule',width:300},
    {title:'刷新',width:140,render:(_,r)=><div>{r.refresh}<div className="muted">更新于 {r.updatedAt}</div></div>},
    {title:'数据健康',width:140,render:()=> <Progress percent={98} size="small" />},
    {title:'所有者',dataIndex:'owner',width:120},{title:'状态',width:100,render:(_,r)=><StatusTag status={r.status} />},{title:'操作',fixed:'right',width:84,render:()=> <Button type="text">查看</Button>},
  ];
  return <section className="page-stack"><PageHeader title="用户分群" description="按地区、资产、交易行为和消息偏好构建可审计受众。" actions={<Button type="primary" icon={<IconPlus />}>新建分群</Button>} /><FilterBar><Input.Search placeholder="搜索分群名称或 ID" style={{width:260}}/><Select placeholder="分群类型" style={{width:140}}/><Select placeholder="业务用途" style={{width:140}}/></FilterBar><ResourceTable data={segments} columns={columns} rowKey="id" /></section>;
}
