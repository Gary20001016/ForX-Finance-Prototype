import { render, screen } from '@testing-library/react';
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
  expect(screen.getByText('提现成功通知')).toBeVisible();
  expect(screen.queryByText('夏季交易赛')).not.toBeInTheDocument();
  expect(screen.queryByText('网络维护公告')).not.toBeInTheDocument();
  expect(
    screen.getByRole('columnheader', { name: '关联通知规则' }),
  ).toBeVisible();
  expect(
    screen.queryByRole('columnheader', { name: '使用任务' }),
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
