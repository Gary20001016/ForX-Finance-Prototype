import { render, screen } from '@testing-library/react';
import CompliancePage from './CompliancePage';

it('shows the compliance conflict priority', () => {
  render(<CompliancePage />);
  expect(screen.getByText(/法律禁止.*用户退订.*黑名单/)).toBeVisible();
});
