import { render } from '@testing-library/react';
import DashboardPage from './DashboardPage';

it('renders only first-phase Web and Push channel segments', () => {
  const { container } = render(<DashboardPage />);

  expect(container.querySelectorAll('.bar-segment.channel-inbox')).toHaveLength(7);
  expect(container.querySelectorAll('.bar-segment.channel-push')).toHaveLength(7);
  expect(container.querySelectorAll('.bar-segment.channel-email')).toHaveLength(0);
  expect(container.querySelectorAll('.bar-segment.channel-sms')).toHaveLength(0);
});
