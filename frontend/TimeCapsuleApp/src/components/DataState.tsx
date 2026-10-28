import React from 'react';
import { View, Text, ActivityIndicator, Button, StyleSheet } from 'react-native';

type DataStateProps = Readonly<{
  loading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}>;

function DataState({
  loading = false,
  error = null,
  isEmpty = false,
  emptyTitle = 'Nothing here yet',
  emptyMessage = '',
  onRetry,
  children,
}: DataStateProps) {
  // 1. Loading
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.message}>Loading...</Text>
      </View>
    );
  }

  // 2. Error
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>{error}</Text>
        {onRetry ? <Button title="Try again" onPress={onRetry} /> : null}
      </View>
    );
  }

  // 3. Empty
  if (isEmpty) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>{emptyTitle}</Text>
        {emptyMessage ? <Text style={styles.message}>{emptyMessage}</Text> : null}
      </View>
    );
  }

  // 4. Normal content
  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginVertical: 8,
  },
});

export default DataState;