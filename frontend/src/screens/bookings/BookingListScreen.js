import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { requestWithFallback } from '../../config/api';
import { useListScreenHeader } from '../../hooks/useListScreenHeader';
import { useAuth } from '../../context/AuthContext';

export default function BookingListScreen({ navigation }) {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useListScreenHeader(navigation, { addRoute: 'BookingForm', addLabel: '+ Add' });

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await requestWithFallback('/api/bookings');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
      if (json.success) setItems(json.data || []);
      else setError('Failed to load bookings');
    } catch (e) {
      setError(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2563eb" size="large" />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>{error}</Text>
        <TouchableOpacity style={styles.retry} onPress={load}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{isAdmin ? 'Booking Timeline' : 'My Bookings'}</Text>
        <Text style={styles.heroSub}>{items.length} {isAdmin ? 'active records' : 'bookings'}</Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('BookingDetail', { id: item._id })}
          >
            <Text style={styles.title}>{item.user?.name || 'Customer booking'}</Text>
            <Text style={styles.sub}>
              {item.room?.roomNumber ? `Room ${item.room.roomNumber}` : 'Room'} · {item.status}
            </Text>
            <Text style={styles.meta}>
              {new Date(item.checkIn).toLocaleDateString()} →{' '}
              {new Date(item.checkOut).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No bookings yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f4ee' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f4ee' },
  hero: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 6,
    borderRadius: 16,
    backgroundColor: '#ecfeff',
    borderWidth: 1,
    borderColor: '#a5f3fc',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#155e75' },
  heroSub: { marginTop: 4, color: '#0e7490', fontWeight: '600' },
  list: { padding: 16, paddingTop: 8 },
  card: {
    backgroundColor: '#fffdf8',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3e8d7',
  },
  title: { fontSize: 17, fontWeight: '700', color: '#1f2937' },
  sub: { fontSize: 14, color: '#57534e', marginTop: 4 },
  meta: { fontSize: 13, color: '#0f766e', marginTop: 6, fontWeight: '700' },
  err: { color: '#b91c1c', marginBottom: 12 },
  retry: { backgroundColor: '#0f766e', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#78716c', marginTop: 40 },
});
