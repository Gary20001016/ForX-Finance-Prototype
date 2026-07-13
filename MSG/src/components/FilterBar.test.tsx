import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterBar from './FilterBar';

it('provides feedback when a page uses the default query action', async () => {
  render(<FilterBar><span>筛选条件</span></FilterBar>);
  await userEvent.click(screen.getByRole('button', { name: '查询' }));
  expect(await screen.findByText('已按当前条件更新结果')).toBeVisible();
});
