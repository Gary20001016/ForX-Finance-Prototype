import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CreateTaskPage from './CreateTaskPage';

it('支持 V2 五类人工消息受众和消息有效期', async () => {
  render(<MemoryRouter><CreateTaskPage /></MemoryRouter>);
  await userEvent.type(screen.getByPlaceholderText('例如：夏季交易赛召回'), '重要风险通知');
  await userEvent.click(screen.getByRole('button', { name:'下一步' }));

  for (const audience of ['全部用户','指定用户','指定 VIP','指定代理','活动参与用户']) {
    expect(screen.getByText(audience)).toBeVisible();
  }

  await userEvent.click(screen.getByRole('button', { name:'下一步' }));
  expect(screen.getByText('消息有效期')).toBeVisible();
  expect(screen.getByText('Web 站内信')).toBeVisible();
  expect(screen.getByText('App Push（预留）')).toBeVisible();
});
