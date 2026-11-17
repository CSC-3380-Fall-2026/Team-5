import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  BackHandler,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { getAuthToken } from '../services/authStorage';
import { API_BASE_URL } from '../services/api';

type Person = {
  id: string;
  name: string;
  isFriend?: boolean;
  relationship?: string;
  lastMessage?: string | null;
  lastSenderId?: string | null;
  lastMessageAt?: string | null;
};
type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
};

async function request(path: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Please log in again.');
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      'Messages are unavailable. Restart the updated backend and try again.',
    );
  }
  if (!response.ok) {
    throw new Error(data.error || 'Unable to load messages.');
  }
  return data;
}
const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : 'Please try again.';
const time = (value: string) =>
  new Date(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

export default function DMScreen({ navigation }: any) {
  const focused = useIsFocused();
  const [inbox, setInbox] = useState<Person[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Person | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [directoryError, setDirectoryError] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const selectedId = useRef<string | null>(null);
  const sendingRef = useRef(false);
  const historyVersion = useRef(0);
  const search = query.trim().toLocaleLowerCase();
  const searching = Boolean(search);

  const loadInbox = useCallback(async () => {
    const [profile, data] = await Promise.all([
      request('/api/users/me'),
      request('/api/dms'),
    ]);
    setUserId(String(profile.user.id));
    setInbox(data.conversations);
  }, []);
  const loadMessages = useCallback(async (id: string) => {
    const version = ++historyVersion.current;
    const data = await request(`/api/dms/${id}`);
    if (selectedId.current === id && version === historyVersion.current) {
      setMessages(data.messages);
    }
  }, []);

  useEffect(() => {
    if (!focused) {
      return;
    }
    let active = true;
    const update = async (initial = false) => {
      if (!initial && AppState.currentState !== 'active') {
        return;
      }
      const id = selectedId.current;
      try {
        if (id) {
          await loadMessages(id);
        } else {
          await loadInbox();
        }
        if (active && selectedId.current === id) {
          setError('');
        }
      } catch (err) {
        if (active && selectedId.current === id) {
          setError(errorMessage(err));
        }
      } finally {
        if (active && initial) {
          setLoading(false);
        }
      }
    };
    void update(true);
    // Simple polling keeps incoming messages fresh without another service.
    const interval = setInterval(() => {
      void update();
    }, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [focused, loadInbox, loadMessages]);

  useEffect(() => {
    if (!searching || selected) {
      return;
    }
    let active = true;
    setDirectoryError('');
    setSearchLoading(true);
    request('/api/friends/users')
      .then(data => {
        if (active) {
          setPeople(data.users);
        }
      })
      .catch(err => {
        if (active) {
          setDirectoryError(errorMessage(err));
        }
      })
      .finally(() => {
        if (active) {
          setSearchLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [searching, selected]);

  const back = useCallback(() => {
    if (selectedId.current) {
      selectedId.current = null;
      setSelected(null);
      setMessages([]);
      setDraft('');
      setError('');
      setLoading(false);
      void loadInbox().catch(err => setError(errorMessage(err)));
    } else {
      navigation.navigate('Home');
    }
  }, [loadInbox, navigation]);
  useEffect(() => {
    if (!focused) {
      return;
    }
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      back();
      return true;
    });
    return () => handler.remove();
  }, [back, focused]);

  const open = async (person: Person) => {
    selectedId.current = person.id;
    setSelected(person);
    setMessages([]);
    setDraft('');
    setError('');
    setLoading(true);
    try {
      await loadMessages(person.id);
    } catch (err) {
      if (selectedId.current === person.id) {
        setError(errorMessage(err));
      }
    } finally {
      if (selectedId.current === person.id) {
        setLoading(false);
      }
    }
  };
  const refresh = async () => {
    setRefreshing(true);
    try {
      if (selectedId.current) {
        await loadMessages(selectedId.current);
      } else {
        await loadInbox();
      }
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setRefreshing(false);
    }
  };
  const send = async () => {
    const content = draft.trim();
    const id = selectedId.current;
    if (!content || !id || sendingRef.current) {
      return;
    }
    sendingRef.current = true;
    setSending(true);
    ++historyVersion.current;
    try {
      const data = await request(`/api/dms/${id}`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      ++historyVersion.current;
      if (selectedId.current === id) {
        setMessages(previous => [
          data.message,
          ...previous.filter(m => m.id !== data.message.id),
        ]);
        setDraft('');
        setError('');
      }
    } catch (err) {
      Alert.alert('Message not sent', errorMessage(err));
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };
  // Inverted list starts at the latest message; history stays in chronological order.
  const newestFirst = [...messages].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() ||
      Number(b.id) - Number(a.id),
  );
  const rows = search
    ? people
        .filter(p => p.name.toLocaleLowerCase().includes(search))
        .map(p => {
          const conversation = inbox.find(c => c.id === p.id);
          return (
            conversation || { ...p, isFriend: p.relationship === 'friends' }
          );
        })
    : inbox;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topbar}>
          <TouchableOpacity
            onPress={back}
            accessibilityLabel={selected ? 'Back to inbox' : 'Back to home'}
            style={styles.back}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.heading}>
            <Text style={styles.eyebrow}>TIME CAPSULE</Text>
            <Text numberOfLines={1} style={styles.title}>
              {selected ? selected.name : 'Messages'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={refresh}
            disabled={refreshing}
            accessibilityLabel="Refresh messages"
            style={styles.refresh}
          >
            {refreshing ? (
              <ActivityIndicator color="#735641" />
            ) : (
              <Text style={styles.refreshText}>↻</Text>
            )}
          </TouchableOpacity>
        </View>
        {!selected && (
          <>
            <Text style={styles.subtitle}>A little hello goes a long way.</Text>
            <View style={styles.searchBox}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search people to start a chat"
                placeholderTextColor="#806A58"
                accessibilityLabel="Search people"
                style={styles.searchInput}
                autoCorrect={false}
              />
              {!!query && (
                <TouchableOpacity
                  onPress={() => setQuery('')}
                  accessibilityLabel="Clear search"
                >
                  <Text style={styles.clear}>×</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.section}>
              {search ? 'PEOPLE' : 'YOUR CONVERSATIONS'}
            </Text>
          </>
        )}
        {!!(error || (!selected && search && directoryError)) && (
          <View style={styles.error}>
            <Text style={styles.errorText}>{error || directoryError}</Text>
            <TouchableOpacity onPress={refresh}>
              <Text style={styles.retry}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}
        {loading || (!selected && searching && searchLoading) ? (
          <ActivityIndicator
            style={styles.loader}
            color="#735641"
            size="large"
          />
        ) : selected ? (
          <FlatList<Message>
            style={styles.list}
            inverted={messages.length > 0}
            data={newestFirst}
            keyExtractor={m => m.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.chatContent}
            refreshing={refreshing}
            onRefresh={refresh}
            ListEmptyComponent={
              <View style={styles.chatEmpty}>
                <View style={styles.largeAvatar}>
                  <Text style={styles.largeInitial}>
                    {selected.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.emptyTitle}>Say hi to {selected.name}</Text>
                <Text style={styles.emptyText}>
                  Every conversation starts with a hello.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const mine = item.senderId === userId;
              return (
                <View style={[styles.messageRow, mine && styles.mineRow]}>
                  <View
                    style={[styles.bubble, mine ? styles.mine : styles.theirs]}
                  >
                    <Text
                      selectable
                      style={[styles.messageText, mine && styles.mineText]}
                    >
                      {item.content}
                    </Text>
                    <Text style={[styles.time, mine && styles.mineTime]}>
                      {time(item.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        ) : (
          <FlatList<Person>
            style={styles.list}
            data={rows}
            keyExtractor={p => p.id}
            keyboardShouldPersistTaps="handled"
            refreshing={refreshing}
            onRefresh={refresh}
            contentContainerStyle={styles.inboxContent}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>
                  {search ? 'No people found' : 'Your next hello starts here'}
                </Text>
                <Text style={styles.emptyText}>
                  {search
                    ? 'Try another name.'
                    : 'Search for anyone to start a chat. Your friends will show up here automatically.'}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.person}
                onPress={() => open(item)}
                accessibilityLabel={`Message ${item.name}`}
              >
                <View style={styles.avatar}>
                  <Text style={styles.initial}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.personInfo}>
                  <View style={styles.nameRow}>
                    <Text numberOfLines={1} style={styles.name}>
                      {item.name}
                    </Text>
                    {item.isFriend && (
                      <Text style={styles.friendBadge}>Friend</Text>
                    )}
                  </View>
                  <Text numberOfLines={1} style={styles.preview}>
                    {item.lastMessage
                      ? `${item.lastSenderId === userId ? 'You: ' : ''}${
                          item.lastMessage
                        }`
                      : `Say hi to ${item.name}`}
                  </Text>
                </View>
                <Text style={styles.rowTime}>
                  {item.lastMessageAt
                    ? new Date(item.lastMessageAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })
                    : '›'}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
        {selected && (
          <View style={styles.composer}>
            <TextInput
              style={styles.messageInput}
              value={draft}
              onChangeText={setDraft}
              placeholder="Send a little hello…"
              placeholderTextColor="#806A58"
              accessibilityLabel="Message"
              multiline
              maxLength={2000}
              editable={!sending}
            />
            <TouchableOpacity
              style={[
                styles.send,
                (!draft.trim() || sending || loading) && styles.disabled,
              ]}
              onPress={send}
              disabled={!draft.trim() || sending || loading}
              accessibilityLabel="Send message"
            >
              {sending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.sendText}>↑</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#E8D8BE' },
  container: { flex: 1 },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
  },
  back: { width: 36, height: 44, justifyContent: 'center' },
  backText: { fontSize: 38, color: '#735641' },
  heading: { flex: 1 },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
    color: '#806A58',
    marginBottom: 3,
  },
  title: { fontSize: 27, fontWeight: '800', color: '#50382B' },
  refresh: { padding: 10 },
  refreshText: { fontSize: 26, color: '#735641' },
  subtitle: {
    color: '#806A58',
    fontSize: 14,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F0E3',
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CDB89C',
    paddingHorizontal: 16,
  },
  searchInput: { flex: 1, color: '#50382B', fontSize: 14, paddingVertical: 14 },
  clear: { fontSize: 24, color: '#735641', padding: 6 },
  section: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '700',
    color: '#806A58',
    marginHorizontal: 24,
    marginTop: 26,
    marginBottom: 12,
  },
  list: { flex: 1 },
  inboxContent: { paddingHorizontal: 20, paddingBottom: 20 },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#D4C1A6',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#C9B194',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  initial: { fontSize: 22, fontWeight: '700', color: '#50382B' },
  personInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 16, fontWeight: '700', color: '#50382B', flexShrink: 1 },
  friendBadge: {
    fontSize: 10,
    color: '#735641',
    backgroundColor: '#F8F0E3',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  preview: { fontSize: 13, color: '#806A58', marginTop: 6 },
  rowTime: { fontSize: 11, color: '#806A58', marginLeft: 12 },
  empty: { padding: 30, marginTop: 30, alignItems: 'center' },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#50382B',
    textAlign: 'center',
    marginBottom: 9,
  },
  emptyText: {
    color: '#806A58',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  chatContent: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 16 },
  chatEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#C9B194',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  largeInitial: { fontSize: 32, fontWeight: '700', color: '#50382B' },
  messageRow: { alignItems: 'flex-start', marginBottom: 10 },
  mineRow: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '82%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  mine: { backgroundColor: '#735641', borderBottomRightRadius: 5 },
  theirs: { backgroundColor: '#F8F0E3', borderBottomLeftRadius: 5 },
  messageText: { fontSize: 15, lineHeight: 22, color: '#50382B' },
  mineText: { color: '#FFF' },
  time: { fontSize: 10, color: '#806A58', textAlign: 'right', marginTop: 5 },
  mineTime: { color: '#E8D8BE' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#D4C1A6',
  },
  messageInput: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: '#F8F0E3',
    color: '#50382B',
    paddingHorizontal: 18,
    paddingVertical: 12,
    maxHeight: 120,
    fontSize: 14,
  },
  send: {
    backgroundColor: '#735641',
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: { fontSize: 27, color: '#FFF', fontWeight: '700' },
  disabled: { opacity: 0.4 },
  error: {
    backgroundColor: '#F8F0E3',
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  errorText: { color: '#A33A32', fontSize: 13 },
  retry: { color: '#735641', fontWeight: '700', marginTop: 8 },
  loader: { flex: 1 },
});
