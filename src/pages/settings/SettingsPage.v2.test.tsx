import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SettingsPage from './SettingsPage';

it('前台展示分类使用五个一级分类和受控二级主题', () => {
  render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>,
  );
  for (const category of ['公告','交易','资产','安全与风控','活动与奖励']) {
    expect(screen.getByText(category)).toBeVisible();
  }
  expect(screen.getAllByText('4 个主题')).toHaveLength(3);
  expect(screen.getAllByText('3 个主题')).toHaveLength(2);
  expect(screen.getAllByText('前台展示分类').length).toBeGreaterThan(0);
  expect(screen.queryByText('消息性质')).not.toBeInTheDocument();
  expect(screen.queryByText('系统公告')).not.toBeInTheDocument();
});
