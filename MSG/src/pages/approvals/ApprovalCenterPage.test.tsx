import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ApprovalCenterPage from './ApprovalCenterPage';

it('flags approval items created by the current administrator', () => {
  render(<MemoryRouter><ApprovalCenterPage currentAdminId="admin-01" /></MemoryRouter>);
  expect(screen.getByText('不可审核本人创建的任务')).toBeVisible();
});
