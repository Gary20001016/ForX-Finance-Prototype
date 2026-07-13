import { render } from '@testing-library/react';
import DashboardPage from './DashboardPage';

it('renders one color-coded segment per channel for every day', () => {
  const { container } = render(<DashboardPage />);

  expect(container.querySelectorAll('.bar-segment.channel-inbox')).toHaveLength(7);
  expect(container.querySelectorAll('.bar-segment.channel-push')).toHaveLength(7);
  expect(container.querySelectorAll('.bar-segment.channel-email')).toHaveLength(7);
  expect(container.querySelectorAll('.bar-segment.channel-sms')).toHaveLength(7);
});
