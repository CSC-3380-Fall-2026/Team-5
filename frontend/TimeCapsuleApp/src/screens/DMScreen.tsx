
import React, { useCallback, useEffect, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAuthToken } from '../services/authStorage';
import { API_BASE_URL } from '../services/api';

type Friend = {
  id: string;
  name: string;
  bio?: string | null;
};

type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
};

function DMScreen({ navigation }: any) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Make authenticated requests to the backend.
  const apiRequest = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const token = await getAuthToken();

      if (!token) {
        throw new Error('Please log in again.');
      }

      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed.');
      }

      return data;
    },
    []
  );

  // Load the logged-in user's ID and accepted friends.
  const loadFriends = useCallback(async () => {
    try {
      setError('');

      const [profileData, friendsData] = await Promise.all([
        apiRequest('/api/users/me'),
        apiRequest('/api/dms/friends'),
      ]);

      setCurrentUserId(String(profileData.user.id));
      setFriends(friendsData.friends || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load friends.'
      );
    }
  }, [apiRequest]);

  // Load conversation history for a selected friend.
  const loadMessages = useCallback(
    async (friendId: string) => {
      try {
        setError('');

        const data = await apiRequest(`/api/dms/${friendId}`);
        setMessages(data.messages || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Unable to load messages.'
        );
      }
    },
    [apiRequest]
  );

  // Load friends when the screen opens.
  useEffect(() => {
    let active = true;

    const initialize = async () => {
      setLoading(true);

      try {
        const [profileData, friendsData] = await Promise.all([
          apiRequest('/api/users/me'),
          apiRequest('/api/dms/friends'),
        ]);

        if (active) {
          setCurrentUserId(String(profileData.user.id));
          setFriends(friendsData.friends || []);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : 'Unable to load friends.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    initialize();

    return () => {
      active = false;
    };
  }, [apiRequest]);

  const openConversation = async (friend: Friend) => {
    setSelectedFriend(friend);
    setMessages([]);
    setMessageText('');
    setLoading(true);

    try {
      await loadMessages(friend.id);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);

    try {
      if (selectedFriend) {
        await loadMessages(selectedFriend.id);
      } else {
        await loadFriends();
      }
    } finally {
      setRefreshing(false);
    }
  };

  const sendMessage = async () => {
    const content = messageText.trim();

    if (!content || !selectedFriend || sending) return;

    setSending(true);

    try {
      const data = await apiRequest(
        `/api/dms/${selectedFriend.id}`,
        {
          method: 'POST',
          body: JSON.stringify({ content }),
        }
      );

      setMessages(previous => [...previous, data.message]);
      setMessageText('');
      setError('');
    } catch (err) {
      Alert.alert(
        'Message not sent',
        err instanceof Error ? err.message : 'Please try again.'
      );
    } finally {
      setSending(false);
    }
  };

  const goBack = () => {
    if (selectedFriend) {
      setSelectedFriend(null);
      setMessages([]);
      setError('');
      loadFriends();
    } else {
      navigation.navigate('Home');
    }
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <TouchableOpacity
      style={styles.friendCard}
      onPress={() => openConversation(item)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>

      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.name}</Text>
        <Text style={styles.friendSubtitle}>
          Tap to open conversation
        </Text>
      </View>

      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.senderId === currentUserId;

    return (
      <View
        style={[
          styles.messageRow,
          isMine ? styles.myMessageRow : styles.theirMessageRow,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMine ? styles.myBubble : styles.theirBubble,
          ]}
        >
          <Text
            style={[
              styles.messageContent,
              isMine ? styles.myMessageText : styles.theirMessageText,
            ]}
          >
            {item.content}
          </Text>

          <Text
            style={[
              styles.messageTime,
              isMine ? styles.myTime : styles.theirTime,
            ]}
          >
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  let content;

  if (loading) {
    content = (
      <ActivityIndicator
        size="large"
        color="#735641"
        style={styles.loader}
      />
    );
  } else if (selectedFriend) {
    content = (
      <>
        <FlatList
          style={styles.list}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptyText}>
                Say hello to {selectedFriend.name}!
              </Text>
            </View>
          }
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.messageInput}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            placeholderTextColor="#806A58"
            multiline
            maxLength={2000}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!messageText.trim() || sending) && styles.disabledButton,
            ]}
            onPress={sendMessage}
            disabled={!messageText.trim() || sending}
          >
            <Text style={styles.sendText}>{sending ? '...' : 'Send'}</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  } else {
    content = (
      <FlatList
        style={styles.list}
        data={friends}
        keyExtractor={item => item.id}
        renderItem={renderFriend}
        contentContainerStyle={styles.friendsContent}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptyText}>
              Accept a friend request to start messaging.
            </Text>
          </View>
        }
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={goBack}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>
            {selectedFriend
              ? selectedFriend.name.toUpperCase()
              : 'DIRECT MESSAGES'}
          </Text>

          <Text style={styles.subtitle}>
            {selectedFriend
              ? 'Your private conversation'
              : 'Stay connected with your friends.'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={refresh}
          disabled={refreshing}
        >
          <Text style={styles.refreshText}>
            {refreshing ? 'Refreshing...' : '↻ Refresh'}
          </Text>
        </TouchableOpacity>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {content}
      </KeyboardAvoidingView>
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
    marginBottom: 20,
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
  refreshButton: {
    alignSelf: 'flex-end',
    marginBottom: 14,
    padding: 6,
  },
  refreshText: {
    color: '#735641',
    fontSize: 14,
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  friendsContent: {
    paddingBottom: 20,
  },
  friendCard: {
    backgroundColor: '#F8F0E3',
    borderWidth: 1,
    borderColor: '#BFA88D',
    borderRadius: 14,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#BFA88D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#50382B',
    fontSize: 20,
    fontWeight: '800',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#50382B',
  },
  friendSubtitle: {
    fontSize: 12,
    color: '#806A58',
    marginTop: 4,
  },
  arrow: {
    fontSize: 28,
    color: '#735641',
  },
  messagesContent: {
    paddingBottom: 18,
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  theirMessageRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '82%',
    padding: 12,
    borderRadius: 14,
  },
  myBubble: {
    backgroundColor: '#735641',
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: '#F8F0E3',
    borderWidth: 1,
    borderColor: '#BFA88D',
    borderBottomLeftRadius: 4,
  },
  messageContent: {
    fontSize: 15,
    lineHeight: 21,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  theirMessageText: {
    color: '#50382B',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 6,
    textAlign: 'right',
  },
  myTime: {
    color: '#E8D8BE',
  },
  theirTime: {
    color: '#806A58',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#BFA88D',
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#F8F0E3',
    borderWidth: 1,
    borderColor: '#BFA88D',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#50382B',
    maxHeight: 110,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#735641',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  disabledButton: {
    opacity: 0.5,
  },
  sendText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#F8F0E3',
    borderWidth: 1,
    borderColor: '#BFA88D',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    marginTop: 12,
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
  errorCard: {
    backgroundColor: '#F8F0E3',
    borderWidth: 1,
    borderColor: '#B96B60',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#A33A32',
    fontSize: 13,
  },
  loader: {
    marginTop: 40,
  },
});

export default DMScreen;
