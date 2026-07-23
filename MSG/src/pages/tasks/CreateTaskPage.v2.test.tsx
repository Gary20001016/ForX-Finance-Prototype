import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CreateTaskPage from './CreateTaskPage';

it('支持 V2 五类人工消息受众、消息有效期和正式 App Push 渠道', async () => {
  render(<MemoryRouter><CreateTaskPage /></MemoryRouter>);
  await userEvent.type(screen.getByPlaceholderText('例如：夏季交易赛召回'), '重要风险通知');
  await userEvent.click(screen.getByRole('button', { name:'下一步' }));

  for (const audience of ['全部用户','指定用户','指定 VIP','指定代理','活动参与用户']) {
    expect(screen.getByText(audience)).toBeVisible();
  }

  await userEvent.click(screen.getByRole('button', { name:'下一步' }));
  expect(screen.getByText('消息有效期')).toBeVisible();
  expect(screen.getAllByText('站内信（Web + App）').length).toBeGreaterThan(0);
  expect(screen.getAllByText('App Push').length).toBeGreaterThan(0);
  expect(screen.getByText('App 站内信预览')).toBeVisible();
  expect(screen.queryByText(/App Push（预留）/)).not.toBeInTheDocument();
  expect(screen.queryByText('发送速率（每秒）')).not.toBeInTheDocument();
  expect(screen.queryByText('用户去重')).not.toBeInTheDocument();

});
