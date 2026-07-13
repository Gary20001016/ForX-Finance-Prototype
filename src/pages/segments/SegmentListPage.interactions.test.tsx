import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SegmentListPage from './SegmentListPage';

it('opens the create segment dialog', async () => {
  render(<SegmentListPage />);
  await userEvent.click(screen.getByRole('button', { name: '新建分群' }));
  expect(await screen.findByText('创建用户分群')).toBeVisible();
});
