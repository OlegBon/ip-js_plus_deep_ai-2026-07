import { render, screen } from '@testing-library/react';
import Footer from '../Footer';

describe('Footer', () => {
  it('provides an accessible support email link', () => {
    render(<Footer />);

    expect(screen.getByText(/all rights reserved/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'support@bon.kharkov.ua' })).toHaveAttribute(
      'href',
      'mailto:support@bon.kharkov.ua',
    );
  });
});
