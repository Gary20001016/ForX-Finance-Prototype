import { render, screen } from '@testing-library/react';
import ApprovalCenterPage from './ApprovalCenterPage';

it('flags approval items created by the current administrator', () => {
  render(<ApprovalCenterPage currentAdminId="admin-01" />);
  expect(screen.getByText('不可审核本人创建的任务')).toBeVisible();
});
