
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Keychain from 'react-native-keychain';

import { API_BASE_URL } from '../services/api';

type Person = {
  id: string;
  name: string;
  bio: string | null;
};

const COLORS = {
  background: '#E8D8BE',
  card: '#F8F0E3',
  raised: '#EADAC5',
  border: '#BFA88D',
  text: '#50382B',
  muted: '#806A58',
  lavender: '#735641',
  lavenderDark: '#F8F0E3',
  amber: '#735641',
};

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('');
}

export default function FriendsListScreen() {
  const [people, setPeople] = useState<Person[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadPeople = useCallback(async () => {
    try {
      setError('');

      const credentials = await Keychain.getGenericPassword();

      if (!credentials) {
        throw new Error('Please log in again to view people.');
      }

      const token = credentials.password;

      const response = await fetch(
        `${API_BASE_URL}/api/users/discover`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to load people.');
      }

      setPeople(Array.isArray(data.users) ? data.users : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong loading people.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPeople();
  }, [loadPeople]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPeople();
  }, [loadPeople]);

  const filteredPeople = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return people;
    }

    return people.filter(person =>
      `${person.name} ${person.bio ?? ''}`
        .toLowerCase()
        .includes(query),
    );
  }, [people, search]);

  const renderPerson = ({ item }: { item: Person }) => (
    <View style={styles.personRow}>
      <View style={styles.personAvatar}>
        <Text style={styles.personInitials}>
          {getInitials(item.name)}
        </Text>
      </View>

      <View style={styles.personInfo}>
        <Text style={styles.personName} numberOfLines={1}>
          {item.name}
        </Text>

        <Text style={styles.personBio} numberOfLines={1}>
          {item.bio?.trim() || 'A new face in Time Capsule'}
        </Text>
      </View>

      <View style={styles.personArrow}>
        <Text style={styles.arrowText}>›</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" 
      />
      

      <FlatList
        data={filteredPeople}
        keyExtractor={item => item.id}
        renderItem={renderPerson}
        contentContainerStyle={styles.listContainer}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.lavender}
            colors={[COLORS.lavender]}
          />
        }
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.brand}>
                TIME CAPSULE
              </Text>

              <Text style={styles.title}>
                Your Circle
              </Text>

              <Text style={styles.subtitle}>
                Good memories are better together.
              </Text>
            </View>

            <View style={styles.heroCard}>
              <View style={styles.heroTextArea}>
                <Text style={styles.heroEyebrow}>
                  THE PEOPLE BEHIND THE MEMORIES
                </Text>

                <Text style={styles.heroTitle}>
                  Keep your people close.
                </Text>

                <Text style={styles.heroDescription}>
                  Discover familiar faces and new connections
                  to share your favorite moments with.
                </Text>
              </View>

              <Text style={styles.heroDecoration}>
                ✦
              </Text>
            </View>

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>
                Around the Circle
              </Text>

              <Text style={styles.sectionMeta}>
                {people.length} people
              </Text>
            </View>

            {loading && (
  <ActivityIndicator
    color={COLORS.lavender}
    style={styles.loadingIndicator}
  />
)}

{!loading && people.length > 0 && (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.circleScroll}
  >
    {people.slice(0, 8).map(person => (
      <View key={person.id} style={styles.circlePerson}>
        <View style={styles.circleAvatarBorder}>
          <View style={styles.circleAvatar}>
            <Text style={styles.circleInitials}>
              {getInitials(person.name)}
            </Text>
          </View>
        </View>

        <Text
          style={styles.circleName}
          numberOfLines={1}
        >
          {person.name.split(' ')[0]}
        </Text>
      </View>
    ))}
  </ScrollView>
)}

{!loading && people.length === 0 && (
  <Text style={styles.emptyCircleText}>
    People will appear here as they join.
  </Text>
)}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.circleScroll}
              >
                {people.slice(0, 8).map(person => (
                  <View
                    key={person.id}
                    style={styles.circlePerson}
                  >
                    <View style={styles.circleAvatarBorder}>
                      <View style={styles.circleAvatar}>
                        <Text style={styles.circleInitials}>
                          {getInitials(person.name)}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={styles.circleName}
                      numberOfLines={1}
                    >
                      {person.name.split(' ')[0]}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            {!loading && people.length === 0 && (
              <Text style={styles.emptyCircleText}>
                People will appear here as they join.
              </Text>
            )}

            <View style={styles.directoryHeading}>
              <Text style={styles.sectionTitle}>
                Discover People
              </Text>

              <Text style={styles.directorySubtitle}>
                Find someone to make memories with.
              </Text>
            </View>

            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>⌕</Text>

              <TextInput
                style={styles.searchInput}
                placeholder="Search people..."
                placeholderTextColor={COLORS.muted}
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />

              {search.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearch('')}
                  accessibilityLabel="Clear search"
                >
                  <Text style={styles.clearSearch}>×</Text>
                </TouchableOpacity>
              )}
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>
                  {error}
                </Text>

                <TouchableOpacity onPress={loadPeople}>
                  <Text style={styles.retryText}>
                    Try again
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.resultsHeading}>
                <Text style={styles.resultsText}>
                  {filteredPeople.length} RESULTS
                </Text>

                <Text style={styles.resultsHint}>
                  REGISTERED MEMBERS
                </Text>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>✦</Text>

              <Text style={styles.emptyTitle}>
                No people found
              </Text>

              <Text style={styles.emptyDescription}>
                {search
                  ? 'Try searching for a different name.'
                  : 'No other members have joined yet.'}
              </Text>
            </View>
          ) : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: StatusBar.currentHeight ?? 0,
  },

  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },

  header: {
    paddingTop: 24,
    paddingBottom: 24,
  },

  brand: {
    color: COLORS.amber,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 22,
  },

  title: {
    color: COLORS.text,
    fontSize: 39,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 6,
  },

  subtitle: {
    color: COLORS.muted,
    fontSize: 15,
  },

  heroCard: {
    backgroundColor: COLORS.lavenderDark,
    borderColor: '#735641',
    borderWidth: 1,
    borderRadius: 24,
    padding: 22,
    minHeight: 170,
    marginBottom: 30,
    overflow: 'hidden',
    flexDirection: 'row',
  },

  heroTextArea: {
    flex: 1,
    zIndex: 1,
  },

  heroEyebrow: {
    color: COLORS.lavender,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
  },

  heroTitle: {
    color: COLORS.text,
    fontSize: 25,
    fontWeight: '800',
    maxWidth: 230,
    marginBottom: 9,
  },

  heroDescription: {
    color: '#806A58',
    fontSize: 12,
    lineHeight: 19,
    maxWidth: 230,
  },

  heroDecoration: {
    color: '#735641',
    fontSize: 100,
    position: 'absolute',
    right: -5,
    bottom: -20,
  },

  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },

  sectionMeta: {
    color: COLORS.lavender,
    fontSize: 12,
    fontWeight: '700',
  },

  loadingIndicator: {
    marginVertical: 30,
  },

  circleScroll: {
    paddingBottom: 24,
    gap: 16,
  },

  circlePerson: {
    width: 68,
    alignItems: 'center',
  },

  circleAvatarBorder: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    borderColor: COLORS.lavender,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 9,
  },

  circleAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.raised,
    justifyContent: 'center',
    alignItems: 'center',
  },

  circleInitials: {
    color: '#FFF5E8',
    fontSize: 18,
    fontWeight: '800',
  },

  circleName: {
    color: COLORS.text,
    fontSize: 12,
    textAlign: 'center',
    width: 72,
  },

  emptyCircleText: {
    color: COLORS.muted,
    fontSize: 13,
    marginBottom: 25,
  },

  directoryHeading: {
    marginTop: 5,
    marginBottom: 18,
  },

  directorySubtitle: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 5,
  },

  searchContainer: {
    height: 54,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 22,
  },

  searchIcon: {
    color: COLORS.lavender,
    fontSize: 28,
    marginRight: 10,
  },

  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    paddingVertical: 0,
  },

  clearSearch: {
    color: COLORS.muted,
    fontSize: 24,
    paddingHorizontal: 5,
  },

  resultsHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 13,
  },

  resultsText: {
    color: COLORS.lavender,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
  },

  resultsHint: {
    color: COLORS.muted,
    fontSize: 10,
    letterSpacing: 1,
  },

  personRow: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  personAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#735641',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },

  personInitials: {
    color: '#FFF5E8',
    fontSize: 17,
    fontWeight: '800',
  },

  personInfo: {
    flex: 1,
  },

  personName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 5,
  },

  personBio: {
    color: COLORS.muted,
    fontSize: 12,
  },

  personArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.raised,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  arrowText: {
    color: COLORS.lavender,
    fontSize: 25,
    marginTop: -4,
  },

  errorBox: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#F8F0E3',
    marginBottom: 18,
  },

  errorText: {
    color: '#8A3D32',
    fontSize: 13,
    marginBottom: 10,
  },

  retryText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 45,
  },

  emptyIcon: {
    color: COLORS.lavender,
    fontSize: 35,
    marginBottom: 12,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },

  emptyDescription: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: 'center',
  },
});
