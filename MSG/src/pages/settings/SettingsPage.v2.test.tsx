import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SettingsPage from './SettingsPage';

it('分类字典使用七个 V2 标准分类', () => {
  render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>,
  );
  for (const category of ['系统公告','交易通知','资产通知','安全通知','奖励通知','活动通知','风控通知']) {
    expect(screen.getByText(category)).toBeVisible();
  }
  expect(screen.queryByText('市场营销')).not.toBeInTheDocument();
});
