import { render, screen } from '@testing-library/react';
import DeliveryPage from './DeliveryPage';

it('shows masked destinations and failure inspection controls', () => {
  render(<DeliveryPage />);
  expect(screen.getAllByText(/\*\*\*/).length).toBeGreaterThan(0);
  expect(screen.getByText('查看失败原因')).toBeVisible();
  expect(screen.getAllByText('站内信').length).toBeGreaterThan(0);
  expect(screen.getByText(/Web 与 App 共用消息实例/)).toBeVisible();
  expect(screen.queryByText('Web 站内信')).not.toBeInTheDocument();
});
