import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminLayout from './AdminLayout';

it('shows primary navigation and current product context', () => {
  Object.defineProperty(window, 'innerWidth', { value: 1440, configurable: true });
  render(
    <MemoryRouter initialEntries={['/tasks']}>
      <AdminLayout />
    </MemoryRouter>,
  );
  expect(screen.getByTestId('nav-/tasks')).toHaveTextContent('人工消息任务');
  expect(screen.getByTestId('nav-/automation')).toHaveTextContent('事件通知规则');
  expect(screen.getByTestId('nav-/triggers')).toHaveTextContent('触发记录');
  expect(screen.getByText('审核中心')).toBeInTheDocument();
  expect(screen.getByText('演示环境')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '用户消息中心' })).toBeInTheDocument();
  expect(screen.getByText('App Push 正常')).toBeInTheDocument();
  expect(screen.queryByText('Push 已预留')).not.toBeInTheDocument();
});

it('selects the event template entry and shows the complete breadcrumb', () => {
  Object.defineProperty(window, 'innerWidth', { value: 1440, configurable: true });
  render(
    <MemoryRouter initialEntries={['/templates?scope=event']}>
      <AdminLayout />
    </MemoryRouter>,
  );

  expect(screen.getByTestId('nav-/templates?scope=event')).toHaveTextContent(
    '事件消息模板',
  );
  expect(screen.getByTestId('nav-/templates?scope=event')).toHaveClass(
    'arco-menu-selected',
  );
  expect(screen.getAllByText('事件通知').length).toBeGreaterThan(0);
  expect(screen.getAllByText('事件消息模板').length).toBeGreaterThan(0);
});

it('collapses grouped navigation into Arco popup mode on narrow screens', async () => {
  Object.defineProperty(window, 'innerWidth', { value: 900, configurable: true });
  const { container } = render(
    <MemoryRouter initialEntries={['/tasks']}>
      <AdminLayout />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(container.querySelector('.admin-menu')).toHaveClass('arco-menu-collapse');
  });
});

it('shows audience management as a selected top-level item with a flat breadcrumb', () => {
  Object.defineProperty(window, 'innerWidth', { value: 1440, configurable: true });
  render(
    <MemoryRouter initialEntries={['/segments']}>
      <AdminLayout />
    </MemoryRouter>,
  );

  expect(screen.getByTestId('nav-/segments')).toHaveClass('arco-menu-selected');
  expect(screen.getAllByText('用户与受众')).toHaveLength(2);
  expect(
    screen.queryByText('人工消息', { selector: '.arco-breadcrumb-item' }),
  ).not.toBeInTheDocument();
});
