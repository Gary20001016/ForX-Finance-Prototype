import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CreateTaskPage from './CreateTaskPage';

it('blocks progression until the task name is provided', async () => {
  render(<MemoryRouter><CreateTaskPage /></MemoryRouter>);
  await userEvent.click(screen.getByRole('button', { name: '下一步' }));
  expect(await screen.findByText('请输入任务名称')).toBeVisible();
});
