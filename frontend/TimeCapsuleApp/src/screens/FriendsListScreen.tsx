
import React, { useCallback, useMemo, useRef, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { getAuthToken } from '../services/authStorage';

import { API_BASE_URL } from '../services/api';

type Person = {
  id: string;
  name: string;
  bio: string | null;
  relationship: 'none' | 'incoming' | 'outgoing' | 'friends';
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

// An older running backend returns an HTML 404 page for the new friend routes.
async function readFriendResponse(response: Response) {
  if (response.status === 404) {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('The running server does not have the Friends feature. Restart the backend, then tap Try again.');
    }
  }
  try {
    return await response.json();
  } catch {
    throw new Error('The server returned an unexpected response. Check that the app is connected to the Time Capsule backend.');
  }
}

export default function FriendsListScreen() {
  const [people, setPeople] = useState<Person[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [busyIds, setBusyIds] = useState<string[]>([]);
  const pendingActions = useRef(new Set<string>());

  const loadPeople = useCallback(async () => {
    try {
      setError('');

      // Use the same keychain service as login so the saved token can be found.
      const token = await getAuthToken();

      if (!token) {
        throw new Error('Please log in again to view people.');
      }

      const response = await fetch(
        `${API_BASE_URL}/api/friends/users`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
      );

      const data = await readFriendResponse(response);

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

  // Refresh incoming requests and friendships whenever the directory is reopened.
  useFocusEffect(useCallback(() => {
    loadPeople();
  }, [loadPeople]));

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

  // Keep failed requests retryable and only update a row after the server confirms it.
  async function updateFriend(person: Person, action?: 'accept' | 'decline') {
    if (pendingActions.current.has(person.id)) return;
    pendingActions.current.add(person.id);
    setBusyIds(ids => [...ids, person.id]);
    setError('');
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Please log in again to send friend requests.');
      const response = await fetch(
        API_BASE_URL + '/api/friends/requests/' + person.id,
        {
          method: action ? 'PATCH' : 'POST',
          headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json',
          },
          ...(action ? {body: JSON.stringify({action})} : {}),
        },
      );
      const data = await readFriendResponse(response);
      if (!response.ok) throw new Error(data.error || 'Unable to update friend request.');
      setPeople(current => current.map(user => user.id === person.id
        ? {...user, relationship: data.relationship} : user));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update friend request.');
    } finally {
      pendingActions.current.delete(person.id);
      setBusyIds(ids => ids.filter(id => id !== person.id));
    }
  }

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

      {/* Request state comes from MySQL, so it survives refreshes and app restarts. */}
      <View style={styles.friendActions}>
        {item.relationship === 'incoming' ? (
          <>
            <Text style={styles.personBio}>Wants to be friends</Text>
            <TouchableOpacity
              style={styles.requestButton}
              accessibilityLabel={'Accept request from ' + item.name}
              disabled={busyIds.includes(item.id)}
              onPress={() => updateFriend(item, 'accept')}>
              <Text style={styles.requestText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel={'Decline request from ' + item.name}
              disabled={busyIds.includes(item.id)}
              onPress={() => updateFriend(item, 'decline')}>
              <Text style={styles.retryText}>Decline</Text>
            </TouchableOpacity>
          </>
        ) : item.relationship === 'outgoing' || item.relationship === 'friends' ? (
          <Text style={styles.personBio}>
            {item.relationship === 'friends' ? 'Friends' : 'Request sent'}
          </Text>
        ) : (
          <TouchableOpacity
            style={styles.requestButton}
            accessibilityLabel={'Send friend request to ' + item.name}
            disabled={busyIds.includes(item.id)}
            onPress={() => updateFriend(item)}>
            <Text style={styles.requestText}>
              {busyIds.includes(item.id) ? 'Sending...' : 'Add friend'}
            </Text>
          </TouchableOpacity>
        )}
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
  friendActions: {
    alignItems: 'center',
    marginLeft: 8,
    gap: 8,
    maxWidth: 130,
  },
  requestButton: {
    backgroundColor: COLORS.lavender,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  requestText: {
    color: '#FFF5E8',
    fontWeight: '700',
    fontSize: 12,
  },
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
