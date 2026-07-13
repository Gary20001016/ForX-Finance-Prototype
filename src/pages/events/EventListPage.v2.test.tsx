import { render, screen } from '@testing-library/react';
import EventListPage from './EventListPage';

it('展示 V2 八个系统事件', () => {
  render(<EventListPage />);
  expect(screen.getByRole('heading', { name:'系统事件' })).toBeVisible();
  for (const event of ['充值到账','提现成功','提现失败','订单成交','合约强平预警','体验金到账','积分到账','返佣到账']) {
    expect(screen.getByText(event)).toBeVisible();
  }
});
