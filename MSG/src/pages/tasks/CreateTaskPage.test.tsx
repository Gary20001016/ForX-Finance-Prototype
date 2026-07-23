import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CreateTaskPage from './CreateTaskPage';

it('blocks progression until the task name is provided', async () => {
  render(<MemoryRouter><CreateTaskPage /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: '下一步' }));
  expect(await screen.findByText('请输入任务名称')).toBeVisible();
});

it('keeps the active progress step aligned with the displayed wizard section', async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><CreateTaskPage /></MemoryRouter>);

  await user.type(screen.getByPlaceholderText('例如：夏季交易赛召回'), '进度条测试任务');
  await user.click(screen.getByRole('button', { name: '下一步' }));
  expect(await screen.findByRole('heading', { name: '目标用户' })).toBeVisible();
  expect(screen.queryByText('受众样例')).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '下一步' }));
  expect(await screen.findByRole('heading', { name: '发送策略' })).toBeVisible();

  expect(document.querySelector('.task-steps .arco-steps-item-active')).toHaveTextContent('发送策略');
});
