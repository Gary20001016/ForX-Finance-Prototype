import { render, screen } from '@testing-library/react';
import AnalyticsPage from './AnalyticsPage';

it('展示 V2 阅读点击与风险消息指标', () => {
  render(<AnalyticsPage />);
  for (const metric of ['生成消息数','触达用户数','阅读率','点击率','过期未读']) {
    expect(screen.getAllByText(metric).length).toBeGreaterThan(0);
  }
  expect(screen.getByText('风险消息阅读时效')).toBeVisible();
  expect(screen.getByText('5 分钟阅读率')).toBeVisible();
  expect(screen.getByText('30 分钟阅读率')).toBeVisible();
  expect(screen.getByText('分类表现')).toBeVisible();
  expect(screen.getByText('全部渠道')).toBeVisible();
  expect(screen.getByText('全部客户端')).toBeVisible();
  expect(screen.getByText('站内信（Web + App）')).toBeVisible();
  expect(screen.getAllByText('App Push').length).toBeGreaterThan(0);
  expect(screen.getByText('渠道与访问客户端分开统计')).toBeVisible();
  expect(screen.queryByText('Web 站内信')).not.toBeInTheDocument();
  expect(screen.queryByText('App · 未接入')).not.toBeInTheDocument();
});
