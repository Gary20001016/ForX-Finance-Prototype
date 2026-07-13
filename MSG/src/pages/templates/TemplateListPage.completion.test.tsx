import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import TemplateListPage from './TemplateListPage';

it('opens a complete template content editor', async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><TemplateListPage /></MemoryRouter>);
  await user.click(screen.getByRole('button', { name:'新建模板' }));
  expect(screen.getByLabelText('Web 标题')).toBeVisible();
  expect(screen.getByLabelText('Push Deep Link')).toBeVisible();
  expect(screen.getByText('提交外部机翻')).toBeVisible();
});
