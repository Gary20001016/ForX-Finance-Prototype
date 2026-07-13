import type { ReactNode } from 'react';
import { Card, Statistic } from '@arco-design/web-react';
import { IconArrowFall, IconArrowRise } from '@arco-design/web-react/icon';

export default function MetricCard({ title, value, suffix, change, positive = true, icon }: { title: string; value: string | number; suffix?: string; change: string; positive?: boolean; icon?: ReactNode }) {
  return (
    <Card className="metric-card" bordered={false}>
      <div className="metric-head"><span>{title}</span><span className="metric-icon">{icon}</span></div>
      <Statistic value={value} suffix={suffix} />
      <div className={`metric-change ${positive ? 'positive' : 'negative'}`}>{positive ? <IconArrowRise /> : <IconArrowFall />}{change}<span> 较昨日</span></div>
    </Card>
  );
}
