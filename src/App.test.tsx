import { render, screen } from '@testing-library/react';
import App from './App';

it('renders the message center product name', () => {
  render(<App />);
  expect(screen.getByText('消息中心')).toBeInTheDocument();
});
