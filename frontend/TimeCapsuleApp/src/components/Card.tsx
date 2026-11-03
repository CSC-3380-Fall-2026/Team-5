import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';

type CardProps = Readonly<{
  children: ReactNode;
}>;

function Card({ children }: CardProps) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
  padding: 16,
  borderRadius: 14,
  backgroundColor: '#FFF9F0',
  borderWidth: 1,
  borderColor: '#BFA88D',
  marginBottom: 14,
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowRadius: 4,
  elevation: 1,
},
});

export default Card;