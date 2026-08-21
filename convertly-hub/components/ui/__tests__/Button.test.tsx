import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('renders a button with the given text', () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });

    expect(button).toBeInTheDocument();
  });

  it('applies the correct variant class', () => {
    render(<Button variant="secondary">Click me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });

    expect(button).toHaveClass('border-border');
  });

  it('disables the button when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });

    expect(button).toBeDisabled();
  });
});
