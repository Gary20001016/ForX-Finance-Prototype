import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminLayout from './AdminLayout';

it('shows primary navigation and current product context', () => {
  render(
    <MemoryRouter initialEntries={['/tasks']}>
      <AdminLayout />
    </MemoryRouter>,
  );
  expect(screen.getByTestId('nav-/tasks')).toHaveTextContent('消息任务');
  expect(screen.getByText('审核中心')).toBeInTheDocument();
  expect(screen.getByText('PROD · 只读原型')).toBeInTheDocument();
});
