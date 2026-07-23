import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ApprovalCenterPage from './ApprovalCenterPage';

it('flags approval items created by the current administrator', async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><ApprovalCenterPage currentAdminId="admin-01" /></MemoryRouter>);
  await user.click(screen.getByRole('tab', { name: /全部工单/ }));
  const row = screen.getByText('全站风控系统升级公告').closest('tr')!;
  await user.click(row.querySelector('button')!);
  expect(screen.getByText(/不可审核本人创建的内容/)).toBeVisible();
});
