import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsPage from './SettingsPage';

it('supports allowlist creation and lifecycle controls', async () => {
  const user = userEvent.setup();
  render(<SettingsPage />);
  await user.click(screen.getByRole('tab', { name:'跳转白名单' }));
  expect(screen.getByRole('button', { name:'新增白名单' })).toBeVisible();
  expect(screen.getByText('生效时间')).toBeVisible();
  expect(screen.getByText('失效时间')).toBeVisible();
});
