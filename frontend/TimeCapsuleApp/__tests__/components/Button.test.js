import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import AppButton from '../../src/components/AppButton';

describe('AppButton', () => {
  test('renders its title', async () => {
    await render(<AppButton title="Unlock Time Capsule" />);
    expect(screen.getByText('Unlock Time Capsule')).toBeTruthy();
  });

  test('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    await render(<AppButton title="Upload Memory" onPress={onPress} />);
    await fireEvent.press(screen.getByText('Upload Memory'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    await render(<AppButton title="Upload Memory" onPress={onPress} disabled />);
    await fireEvent.press(screen.getByText('Upload Memory'));
    expect(onPress).not.toHaveBeenCalled();
  });
});