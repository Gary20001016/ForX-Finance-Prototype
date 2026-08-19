import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import TemplateListPage from './TemplateListPage';

it('shows only event templates from the event entry', () => {
  render(
    <MemoryRouter initialEntries={['/templates?scope=event']}>
      <TemplateListPage />
    </MemoryRouter>,
  );

  expect(screen.getByRole('heading', { name: '事件消息模板' })).toBeVisible();
  expect(
    screen.queryByRole('columnheader', { name: '版本' }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: '适用场景' })).toBeVisible();
  expect(screen.getByRole('columnheader', { name: '系统事件' })).toBeVisible();
  expect(screen.getByRole('columnheader', { name: '所有者团队' })).toBeVisible();
  expect(screen.getByText('提现成功通知')).toBeVisible();
  expect(screen.getByText('withdrawal.succeeded')).toBeVisible();
  expect(screen.getAllByText('资产运营').length).toBeGreaterThan(0);
  expect(screen.queryByText('夏季交易赛')).not.toBeInTheDocument();
  expect(screen.queryByText('网络维护公告')).not.toBeInTheDocument();
  expect(
    screen.getByRole('columnheader', { name: '关联通知规则' }),
  ).toBeVisible();
  expect(
    screen.queryByRole('columnheader', { name: '使用任务' }),
  ).not.toBeInTheDocument();
});

it('keeps published event templates read-only while drafts remain editable', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/templates?scope=event']}>
      <TemplateListPage />
    </MemoryRouter>,
  );

  const publishedRow = screen.getByText('提现成功通知').closest('tr')!;
  expect(
    within(publishedRow).getByRole('button', { name: '查看详情' }),
  ).toBeVisible();
  expect(
    within(publishedRow).queryByRole('button', { name: '编辑' }),
  ).not.toBeInTheDocument();

  const draftRow = screen.getByText('强平风险预警').closest('tr')!;
  expect(
    within(draftRow).getByRole('button', { name: '编辑' }),
  ).toBeVisible();

  await user.click(
    within(publishedRow).getByRole('button', { name: '查看详情' }),
  );
  expect(
    screen.getByText('查看模板 · 提现成功通知'),
  ).toBeVisible();
  expect(
    screen.queryByRole('button', { name: '保存草稿' }),
  ).not.toBeInTheDocument();
});

it('keeps Push delivery controls only in event templates', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/templates?scope=event']}>
      <TemplateListPage />
    </MemoryRouter>,
  );

  await user.click(screen.getByRole('button', { name: '新建事件消息模板' }));
  expect(screen.getByText('所有者团队', { selector: 'label' })).toBeVisible();
  expect(screen.getByText('优先级', { selector: 'label' })).toBeVisible();
  expect(screen.getByText('折叠键', { selector: 'label' })).toBeVisible();
});

it('shows manual and shared templates and defaults new templates to manual', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/templates?scope=manual']}>
      <TemplateListPage />
    </MemoryRouter>,
  );

  expect(screen.getByRole('heading', { name: '人工消息模板' })).toBeVisible();
  expect(screen.getByText('网络维护公告')).toBeVisible();
  expect(screen.getByText('夏季交易赛')).toBeVisible();
  expect(screen.queryByText('提现成功通知')).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '新建人工消息模板' }));
  expect(screen.getByText('适用场景', { selector: 'label' })).toBeVisible();
  expect(screen.getByText('人工消息', { selector: '.arco-select-view-value' })).toBeVisible();
  expect(screen.queryByText('所有者团队', { selector: 'label' })).not.toBeInTheDocument();
  expect(screen.queryByText('优先级', { selector: 'label' })).not.toBeInTheDocument();
  expect(screen.queryByText('折叠键', { selector: 'label' })).not.toBeInTheDocument();
});

it('keeps the artificial template list focused on artificial usage and publish time', () => {
  render(
    <MemoryRouter initialEntries={['/templates?scope=manual']}>
      <TemplateListPage />
    </MemoryRouter>,
  );

  expect(
    screen.queryByRole('columnheader', { name: '适用场景' }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: '发布时间' })).toBeVisible();
  expect(
    screen.queryByRole('columnheader', { name: '更新时间' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: /人工 .*事件/ }),
  ).not.toBeInTheDocument();
  expect(
    screen.getAllByRole('button', { name: /\d+ 个任务/ }).length,
  ).toBeGreaterThan(0);
  expect(screen.getByText('07-16 10:30')).toBeVisible();
  expect(screen.queryByText('07-13 11:42')).not.toBeInTheDocument();
});

it('offers Email in the template channel filter', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/templates?scope=manual']}>
      <TemplateListPage />
    </MemoryRouter>,
  );

  await user.click(screen.getByRole('combobox', { name: '模板渠道筛选' }));
  expect(await screen.findByText('Email')).toBeVisible();
});

it('opens the seeded HTML Email preview from the manual template list', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/templates?scope=manual']}>
      <TemplateListPage />
    </MemoryRouter>,
  );

  const row = screen.getByText('夏季 VIP 专属礼遇邮件').closest('tr');
  expect(row).not.toBeNull();
  expect(within(row!).getByText('邮件')).toBeVisible();
  await user.click(within(row!).getByRole('button', { name: '查看详情' }));

  expect(screen.getByLabelText('Email 渠道预览')).toBeVisible();
  expect(screen.getByLabelText('Email HTML 桌面预览')).toBeVisible();
  expect(screen.getByTitle('zh-CN HTML 邮件预览')).toBeVisible();
  expect(
    screen.queryByText('查看站内信正文 Markdown 源码'),
  ).not.toBeInTheDocument();
});

it('shows the seeded text Email template in the event template list', () => {
  render(
    <MemoryRouter initialEntries={['/templates?scope=event']}>
      <TemplateListPage />
    </MemoryRouter>,
  );

  const row = screen.getByText('充值到账 Email 通知').closest('tr');
  expect(row).not.toBeNull();
  expect(within(row!).getByText('邮件')).toBeVisible();
  expect(within(row!).getByText('deposit.credited')).toBeVisible();
});
