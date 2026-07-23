import { render, screen } from '@testing-library/react';
import DashboardPage from './DashboardPage';

it('renders one sent and delivered bar for every trend day', () => {
  const { container } = render(<DashboardPage />);

  expect(container.querySelectorAll('.dashboard-trend-bar.sent')).toHaveLength(7);
  expect(container.querySelectorAll('.dashboard-trend-bar.delivered')).toHaveLength(7);
});

it('combines the essential operational analytics into the workbench', () => {
  render(<DashboardPage />);

  ['发送量', '送达率', '阅读率', '发送失败', '待审核', '风险超时未读'].forEach(
    (title) => expect(screen.getAllByText(title)[0]).toBeVisible(),
  );
  expect(screen.getByText('发送与送达趋势')).toBeVisible();
  expect(screen.getByText('需要处理')).toBeVisible();
});

it('removes nonessential workbench modules', () => {
  render(<DashboardPage />);

  expect(screen.queryByText('实时动态')).not.toBeInTheDocument();
  expect(screen.queryByText('渠道健康')).not.toBeInTheDocument();
  expect(screen.queryByText('进行中的关键任务')).not.toBeInTheDocument();
});
