import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ApprovalCenterPage from './ApprovalCenterPage';

it('reviews machine translation beside the source copy', async () => {
  const user = userEvent.setup();
  render(<ApprovalCenterPage />);

  await user.click(screen.getByRole('tab', { name:/翻译审核/ }));
  await user.click(screen.getAllByText('审核翻译')[0]);

  expect(screen.getByText('默认语言源文案')).toBeVisible();
  expect(screen.getByText('机器翻译与人工修订')).toBeVisible();
  expect(screen.getAllByText(/外部任务 ID/).length).toBeGreaterThan(0);
  expect(screen.getByRole('button', { name: '修订并通过' })).toBeEnabled();
  expect(screen.getByRole('button', { name: '驳回重翻' })).toBeEnabled();
});
