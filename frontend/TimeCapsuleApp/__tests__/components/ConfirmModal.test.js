import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import ConfirmModal from '../../src/components/ConfirmModal';

describe('ConfirmModal', () => {
  test('is hidden until the trigger is pressed', async () => {
    await render(<ConfirmModal onConfirm={jest.fn()} />);
    expect(screen.queryByText('Open this time capsule?')).toBeNull();
    await fireEvent.press(screen.getByText('Open Capsule'));
    expect(screen.getByText('Open this time capsule?')).toBeTruthy();
  });

  test('Confirm calls onConfirm and closes the modal', async () => {
    const onConfirm = jest.fn();
    await render(<ConfirmModal onConfirm={onConfirm} />);
    await fireEvent.press(screen.getByText('Open Capsule'));
    await fireEvent.press(screen.getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Open this time capsule?')).toBeNull();
  });

  test('Cancel closes without calling onConfirm', async () => {
    const onConfirm = jest.fn();
    await render(<ConfirmModal onConfirm={onConfirm} />);
    await fireEvent.press(screen.getByText('Open Capsule'));
    await fireEvent.press(screen.getByText('Cancel'));
    expect(onConfirm).not.toHaveBeenCalled();
  });
});