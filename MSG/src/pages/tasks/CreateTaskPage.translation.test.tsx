import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreateTaskPage from './CreateTaskPage';

it('only offers translation-approved template versions', () => {
  render(<MemoryRouter><CreateTaskPage /></MemoryRouter>);

  expect(screen.getByText('仅显示全部目标语言人工审核通过的模板版本')).toBeVisible();
  expect(screen.getByText('翻译审核通过')).toBeVisible();
  expect(screen.queryByText('夏季交易赛 · v4')).not.toBeInTheDocument();
});
