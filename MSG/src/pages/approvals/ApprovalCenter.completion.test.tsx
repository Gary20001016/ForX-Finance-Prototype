import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ApprovalCenterPage from './ApprovalCenterPage';

it('shows object-bound Web and Push previews in approval', async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><ApprovalCenterPage currentAdminId="reviewer-02" /></MemoryRouter>);
  await user.click(screen.getAllByText('审核')[0]);
  expect(screen.getByText('Web 站内信预览')).toBeVisible();
  expect(screen.getByText('App Push 预览')).toBeVisible();
  await user.click(screen.getByRole('tab', { name:'受众与合规' }));
  expect(screen.getByText('受众样例')).toBeVisible();
});
