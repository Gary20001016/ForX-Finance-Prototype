import { render, screen } from '@testing-library/react';
import PageHeader from './PageHeader';

it('does not render a decorative English eyebrow by default', () => {
  render(<PageHeader title="消息任务" description="管理消息任务" />);
  expect(screen.getByRole('heading',{name:'消息任务'})).toBeVisible();
  expect(screen.queryByText('MESSAGE OPERATIONS')).not.toBeInTheDocument();
});
