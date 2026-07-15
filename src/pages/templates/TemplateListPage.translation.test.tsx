import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import TemplateListPage from './TemplateListPage';

it('shows external translation progress and publishing gate', async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><TemplateListPage /></MemoryRouter>);

  expect(screen.getByRole('columnheader', { name:'多语言流程' })).toBeVisible();
  await user.click(screen.getAllByRole('button', { name:'多语言流程' })[0]);

  expect(screen.getByText('外部异步机翻')).toBeVisible();
  expect(screen.getAllByText(/已通过/).length).toBeGreaterThan(0);
  expect(screen.getByText(/发布门禁/)).toBeVisible();
  expect(screen.getAllByText(/MT-/).length).toBeGreaterThan(0);
});
