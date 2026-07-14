import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import InboxPage from './InboxPage';
import MessageDetailPage from './MessageDetailPage';

const renderInbox = () => render(<MemoryRouter initialEntries={['/inbox']}><Routes><Route path="/inbox" element={<InboxPage />} /><Route path="/inbox/:messageId" element={<MessageDetailPage />} /></Routes></MemoryRouter>);

describe('Web/App 用户消息中心', () => {
  it('展示七个分类并在 Web/App 共享全部已读状态', async () => {
    renderInbox();

    expect(await screen.findByRole('heading', { name: '消息中心' })).toBeVisible();
    expect(screen.getByText('Web / App 共享已读状态')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Web 端' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'App 端' })).toBeVisible();
    for (const category of ['系统公告','交易通知','资产通知','安全通知','奖励通知','活动通知','风控通知']) {
      expect(screen.getByRole('button', { name: category })).toBeVisible();
    }
    expect(screen.getByText(/条未读/)).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: '全部已读' }));
    await userEvent.click(screen.getByRole('button', { name: '确认全部已读' }));
    expect(screen.getByText('0 条未读')).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: 'App 端' }));
    expect(screen.getByText('0 条未读')).toBeVisible();
    expect(screen.getByText('App 消息中心视图')).toBeVisible();
  });

  it('打开紧急消息详情并保留风险提示', async () => {
    renderInbox();

    await userEvent.click(await screen.findByText('BTC/USDT 强平风险预警'));
    expect(await screen.findByRole('heading', { name: 'BTC/USDT 强平风险预警' })).toBeVisible();
    expect(screen.getByText('紧急风险提示')).toBeVisible();
    expect(screen.getByRole('button', { name: '查看仓位' })).toBeVisible();
  });
});
