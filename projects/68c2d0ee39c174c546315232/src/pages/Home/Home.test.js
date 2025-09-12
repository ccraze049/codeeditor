import { render, screen, fireEvent } from '@testing-library/react';
import Home from './Home';

test('renders home page', () => {
  render(<Home />);
  const titleElement = screen.getByText(/Welcome to/i);
  expect(titleElement).toBeInTheDocument();
});

test('counter increments when increment button is clicked', () => {
  render(<Home />);
  const incrementButton = screen.getByText('Increment');
  const countElement = screen.getByText('Count: 0');
  
  fireEvent.click(incrementButton);
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});

test('counter decrements when decrement button is clicked', () => {
  render(<Home />);
  const decrementButton = screen.getByText('Decrement');
  
  fireEvent.click(decrementButton);
  expect(screen.getByText('Count: -1')).toBeInTheDocument();
});

test('counter resets when reset button is clicked', () => {
  render(<Home />);
  const incrementButton = screen.getByText('Increment');
  const resetButton = screen.getByText('Reset');
  
  fireEvent.click(incrementButton);
  fireEvent.click(incrementButton);
  fireEvent.click(resetButton);
  
  expect(screen.getByText('Count: 0')).toBeInTheDocument();
});