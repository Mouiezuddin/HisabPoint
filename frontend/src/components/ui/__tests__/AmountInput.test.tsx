import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AmountInput } from '../AmountInput';

describe('AmountInput component', () => {
  it('renders input with default label and placeholder', () => {
    render(<AmountInput value="" onChange={() => {}} />);
    expect(screen.getByLabelText(/amount \(₹\)/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0')).toBeInTheDocument();
  });

  it('calls onChange with valid numeric values', () => {
    const handleChange = vi.fn();
    render(<AmountInput value="" onChange={handleChange} />);
    const input = screen.getByPlaceholderText('0');

    fireEvent.change(input, { target: { value: '500.50' } });
    expect(handleChange).toHaveBeenCalledWith('500.50');
  });

  it('rejects invalid non-numeric inputs', () => {
    const handleChange = vi.fn();
    render(<AmountInput value="" onChange={handleChange} />);
    const input = screen.getByPlaceholderText('0');

    fireEvent.change(input, { target: { value: 'abc' } });
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('displays error message and sets aria-invalid when error is present', () => {
    render(<AmountInput value="10" onChange={() => {}} error="Amount must be greater than zero" />);
    expect(screen.getByText('Amount must be greater than zero')).toBeInTheDocument();
    const input = screen.getByPlaceholderText('0');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });
});
