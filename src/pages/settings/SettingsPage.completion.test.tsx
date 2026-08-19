import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SettingsPage from './SettingsPage';

it('supports allowlist creation and lifecycle controls', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>,
  );
  await user.click(screen.getByRole('tab', { name:'跳转白名单' }));
  expect(screen.getByRole('button', { name:'新增白名单' })).toBeVisible();
  expect(screen.getByText('生效时间')).toBeVisible();
  expect(screen.getByText('失效时间')).toBeVisible();
});

it('exposes Email provider governance from system settings', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/settings']}>
      <SettingsPage />
    </MemoryRouter>,
  );

  await user.click(screen.getByRole('tab', { name: '渠道配置' }));

  const emailCard = screen.getByText('SendGrid Primary').closest('.arco-card')!;
  await user.click(within(emailCard).getByRole('button', { name: '配置' }));
  expect(screen.getByText('Email 域名与发送流')).toBeVisible();
  expect(screen.getByText('事务发送流')).toBeVisible();
  expect(screen.getByText('SPF 已通过')).toBeVisible();
});
