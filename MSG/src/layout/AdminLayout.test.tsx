import { render, screen } from '@testing-library/react';
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
