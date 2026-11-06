import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import LoginForm from '../../src/components/LoginForm';

describe('LoginForm validation', () => {
  const fill = async (email, password) => {
    await fireEvent.changeText(screen.getByPlaceholderText('Email'), email);
    await fireEvent.changeText(screen.getByPlaceholderText('Password'), password);
    await fireEvent.press(screen.getByText('Log In'));
  };

  test('shows an error for an invalid email', async () => {
    const onSubmit = jest.fn();
    await render(<LoginForm onSubmit={onSubmit} />);
    await fill('not-an-email', 'password123');
    expect(screen.getByText('Enter a valid email')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('shows an error for a short password', async () => {
    const onSubmit = jest.fn();
    await render(<LoginForm onSubmit={onSubmit} />);
    await fill('test@lsu.edu', 'short');
    expect(screen.getByText('Password must be at least 8 characters')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('submits valid input', async () => {
    const onSubmit = jest.fn();
    await render(<LoginForm onSubmit={onSubmit} />);
    await fill('test@lsu.edu', 'password123');
    expect(onSubmit).toHaveBeenCalledWith('test@lsu.edu', 'password123');
    expect(screen.queryByText('Enter a valid email')).toBeNull();
  });
});