import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import DataState from '../../src/components/DataState';

describe('DataState', () => {
  test('shows a loading message while loading', async () => {
    await render(<DataState loading><Text>Content</Text></DataState>);
    expect(screen.getByText('Loading...')).toBeTruthy();
    expect(screen.queryByText('Content')).toBeNull();
  });

  test('shows the error message', async () => {
    await render(<DataState error="Network down"><Text>Content</Text></DataState>);
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Network down')).toBeTruthy();
    expect(screen.queryByText('Content')).toBeNull();
  });

  test('calls onRetry when "Try again" is pressed', async () => {
    const onRetry = jest.fn();
    await render(
      <DataState error="Network down" onRetry={onRetry}><Text>Content</Text></DataState>
    );
    await fireEvent.press(screen.getByText('Try again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test('shows the empty message', async () => {
    await render(
      <DataState isEmpty emptyTitle="No capsules yet" emptyMessage="Create one!">
        <Text>Content</Text>
      </DataState>
    );
    expect(screen.getByText('No capsules yet')).toBeTruthy();
    expect(screen.getByText('Create one!')).toBeTruthy();
    expect(screen.queryByText('Content')).toBeNull();
  });

  test('shows the content when nothing is wrong', async () => {
    await render(<DataState><Text>Content</Text></DataState>);
    expect(screen.getByText('Content')).toBeTruthy();
  });

  test('loading takes priority over error and empty', async () => {
    await render(<DataState loading error="Oops" isEmpty><Text>Content</Text></DataState>);
    expect(screen.getByText('Loading...')).toBeTruthy();
    expect(screen.queryByText('Something went wrong')).toBeNull();
  });
});