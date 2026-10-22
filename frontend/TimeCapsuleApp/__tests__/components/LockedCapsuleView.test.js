import React from 'react';
import { render, screen } from '@testing-library/react-native';
import LockedCapsuleView from '../../src/components/LockedCapsuleView';

test('shows the locked message and unlock date', async () => {
  await render(<LockedCapsuleView unlockDate="2099-01-01" />);
  expect(screen.getByText('🔒 This capsule is locked')).toBeTruthy();
  expect(screen.getByText('Opens on 2099-01-01')).toBeTruthy();
});