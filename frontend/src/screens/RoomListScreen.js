import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { requestWithFallback, getUploadUrl } from '../config/api';
import { useListScreenHeader } from '../hooks/useListScreenHeader';
import { useAuth } from '../context/AuthContext';

const RoomListScreen = ({ navigation }) => {
  const { isAdmin } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const availableCount = rooms.filter((room) => room.status === 'Available').length;

  const fetchRooms = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await requestWithFallback('/api/rooms');
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || `Server error (${response.status})`);
      }

      if (json.success) {
        setRooms(json.data);
      } else {
        setError('Failed to fetch rooms from the server');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRooms();
    }, [fetchRooms])
  );

  useListScreenHeader(navigation, {
    showSignOut: true,
    addRoute: isAdmin ? 'AddRoom' : null,
    addLabel: '+ Add Room',
  });

  const renderRoomItem = ({ item }) => {
    // Handling local image paths from the backend (assuming Multer saved to 'uploads/')
    const imageUrl = item.photos && item.photos.length > 0 
      ? getUploadUrl(item.photos[0])
      : 'https://via.placeholder.com/150?text=No+Image';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('RoomDetail', { roomId: item._id })}
        activeOpacity={0.9}
      >
        <View style={styles.imageWrap}>
          <Image style={styles.image} source={{ uri: imageUrl }} />
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>${item.pricePerNight}/night</Text>
          </View>
        </View>
        <View style={styles.infoContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.roomType}>{item.type} Room</Text>
              <Text style={styles.roomNumber}>#{item.roomNumber}</Text>
            </View>
          <Text style={styles.roomDetails}>Capacity: {item.capacity} guests</Text>
          <View style={styles.statusRow}>
              <Text style={styles.status(item.status)}>{item.status}</Text>
              <Text style={styles.viewHint}>Tap for details</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading rooms...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Could not load rooms</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchRooms}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Find your next stay</Text>
        <Text style={styles.heroSubTitle}>{rooms.length} total rooms • {availableCount} available</Text>
      </View>

      {rooms.length === 0 ? (
        <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🏨</Text>
            <Text style={styles.emptyText}>No rooms available at the moment.</Text>
            <Text style={styles.emptySubText}>Tap “Add Room” to create your first listing.</Text>
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item._id}
          renderItem={renderRoomItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f5fb',
    paddingHorizontal: 24,
  },
  container: {
    flex: 1,
    backgroundColor: '#f2f5fb',
  },
  heroCard: {
    marginTop: 14,
    marginHorizontal: 16,
    marginBottom: 4,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  heroSubTitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  list: {
    padding: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 3,
  },
  imageWrap: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 170,
    resizeMode: 'cover',
  },
  priceBadge: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  priceBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  infoContainer: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roomType: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  roomNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    backgroundColor: '#eff6ff',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  roomDetails: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  status: (status) => ({
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: status === 'Available' ? '#e8f5e9' : (status === 'Occupied' ? '#ffebee' : '#fff3e0'),
    color: status === 'Available' ? '#2e7d32' : (status === 'Occupied' ? '#c62828' : '#e65100'),
  }),
  viewHint: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 12,
  },
  loadingText: {
    marginTop: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  errorTitle: {
    color: '#b91c1c',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  errorText: {
    color: '#7f1d1d',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 11,
    paddingHorizontal: 20,
    backgroundColor: '#2563eb',
    borderRadius: 999,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyEmoji: {
    fontSize: 42,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 17,
    color: '#334155',
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
});

export default RoomListScreen;
