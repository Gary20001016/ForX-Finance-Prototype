import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CreateTaskPage from './CreateTaskPage';

it('authors a temporary multilingual Web and Push message and previews entered content', async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><CreateTaskPage /></MemoryRouter>);
  await user.type(screen.getByPlaceholderText('例如：夏季交易赛召回'), '临时安全提醒');
  await user.click(screen.getByText('临时消息'));
  expect(screen.getByLabelText('Web 标题')).toBeVisible();
  expect(screen.getByLabelText('Push 标题')).toBeVisible();
  expect(screen.getByText('创建外部机翻任务')).toBeVisible();
});
