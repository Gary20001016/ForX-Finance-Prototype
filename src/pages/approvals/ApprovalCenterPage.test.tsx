import { render, screen, within } from '@testing-library/react';
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

it('supports an explicitly selected reviewer identity in demo mode', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/approvals?simulateReviewer=reviewer-zh-01']}>
      <ApprovalCenterPage currentAdminId="admin-01" />
    </MemoryRouter>,
  );

  expect(screen.getByText(/演示模式：当前以审核人「王璐」身份处理工单/)).toBeVisible();
  await user.click(screen.getByRole('tab', { name: /全部工单/ }));
  const row = screen.getByText('全站风控系统升级公告').closest('tr');
  expect(row).not.toBeNull();
  expect(within(row!).getByRole('button', { name: '审核' })).toBeVisible();
});
