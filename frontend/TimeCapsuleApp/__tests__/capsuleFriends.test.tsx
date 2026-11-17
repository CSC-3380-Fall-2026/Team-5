import React from 'react';
import {render, screen} from '@testing-library/react-native';
import CapsuleCard from '../src/components/CapsuleCard';

jest.setTimeout(15000);
// Check a future and past unlock date so friends remain visible in either lock state.
test.each(['1/1/2099', '1/1/2000'])(
  'shows friend names for a capsule opening on %s',
  async unlockDate => {
    await render(<CapsuleCard capsule={{
      id: '1', name: 'Memories', unlockDate, friends: ['Alex', 'Sam'],
    }} />);
    expect(screen.getByText('Friends: Alex, Sam')).toBeTruthy();
  },
);
// Capsules with no selected friends should show a clear empty message.
test('shows the empty friends message', async () => {
  await render(<CapsuleCard capsule={{
    id: '1', name: 'Memories', unlockDate: '1/1/2099', friends: [],
  }} />);
  expect(screen.getByText('No friends added')).toBeTruthy();
});
