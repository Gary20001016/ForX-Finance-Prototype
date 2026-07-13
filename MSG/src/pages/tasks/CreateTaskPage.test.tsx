import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreateTaskPage from './CreateTaskPage';

it('blocks progression until the task name is provided', async () => {
  render(<MemoryRouter><CreateTaskPage /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: '下一步' }));
  expect(await screen.findByText('请输入任务名称')).toBeVisible();
});
