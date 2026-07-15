import { render, screen } from '@testing-library/react';
import DeliveryPage from './DeliveryPage';

it('shows masked destinations and failure inspection controls', () => {
  render(<DeliveryPage />);
  expect(screen.getByRole('heading', { name: '渠道发送记录' })).toBeVisible();
  expect(screen.getByText('关联触发')).toBeVisible();
  expect(screen.getAllByText(/\*\*\*/).length).toBeGreaterThan(0);
  expect(screen.getByText('查看失败原因')).toBeVisible();
  expect(screen.getAllByText('站内信').length).toBeGreaterThan(0);
  expect(screen.getByText(/Web 与 App 共用消息实例/)).toBeVisible();
  expect(screen.queryByText('Web 站内信')).not.toBeInTheDocument();
});
