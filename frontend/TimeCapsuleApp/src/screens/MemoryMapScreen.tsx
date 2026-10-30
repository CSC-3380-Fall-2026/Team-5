import React from 'react';
import {View,Text,StyleSheet, TouchableOpacity,} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function MemoryMapScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        {/* Page heading */}
        <View style={styles.header}>
          <Text style={styles.title}>MEMORY MAP</Text>

          <Text style={styles.subtitle}>
            See where your favorite memories were made.
          </Text>
        </View>

        {/* Placeholder content */}
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>
            No memories on the map yet
          </Text>

          <Text style={styles.emptyText}>
            Locations connected to your memories will appear here.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E8D8BE',
  },

  container: {
    flex: 1,
    backgroundColor: '#E8D8BE',
    padding: 20,
  },

  backButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 8,
  },

  backButtonText: {
    color: '#735641',
    fontSize: 16,
    fontWeight: '700',
  },

  header: {
    alignItems: 'center',
    marginBottom: 28,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#50382B',
    letterSpacing: 2,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 14,
    color: '#806A58',
    marginTop: 6,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  emptyCard: {
    backgroundColor: '#F8F0E3',
    borderWidth: 1,
    borderColor: '#BFA88D',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#50382B',
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 14,
    color: '#806A58',
    textAlign: 'center',
  },
});

export default MemoryMapScreen;