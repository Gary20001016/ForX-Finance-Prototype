import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import TaskListPage from './TaskListPage';

it('filters task rows by keyword', async () => {
  render(<MemoryRouter><TaskListPage /></MemoryRouter>);
  await userEvent.type(screen.getByPlaceholderText('搜索任务 ID、名称或创建人'), '提现');
  expect(screen.getByText('提现安全通知')).toBeVisible();
  expect(screen.queryByText('夏季交易赛召回')).not.toBeInTheDocument();
});
