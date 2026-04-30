import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ActivityIndicator, Image, TouchableOpacity, Alert, ScrollView
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { requestWithFallback, getUploadUrl } from '../config/api';
import { useAuth } from '../context/AuthContext';

const RoomDetailScreen = () => {
  const { isAdmin } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const { roomId } = route.params;

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchRoomDetails();
  }, [roomId]);

  const fetchRoomDetails = async () => {
    try {
      setLoading(true);
      const response = await requestWithFallback(`/api/rooms/${roomId}`);
      const json = await response.json();

      if (!response.ok) {
        setError(json.message || `Request failed (${response.status})`);
        return;
      }

      if (json.success) {
        setRoom(json.data);
      } else {
        setError('Failed to fetch room details');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this room?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              setDeleting(true);
              const response = await requestWithFallback(`/api/rooms/${roomId}`, {
                  method: 'DELETE',
                  headers: { 'Accept': 'application/json' }
              });
              const json = await response.json();

              if (!response.ok) {
                Alert.alert('Error', json.message || `Request failed (${response.status})`);
                return;
              }

              if (json.success) {
                Alert.alert("Deleted", "Room has been deleted successfully");
                navigation.goBack();
              } else {
                Alert.alert("Error", json.message || "Failed to delete room");
              }
            } catch (err) {
              Alert.alert("Error", "Network error. Please try again.");
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1976d2" /></View>;
  if (error) return <View style={styles.center}><Text style={styles.errorTitle}>Could not load room</Text><Text style={styles.errorText}>{error}</Text></View>;
  if (!room) return <View style={styles.center}><Text style={styles.errorText}>Room not found</Text></View>;

  const imageUrl = room.photos && room.photos.length > 0 
      ? getUploadUrl(room.photos[0])
      : 'https://via.placeholder.com/400?text=No+Photo';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.heroWrap}>
        <Image source={{ uri: imageUrl }} style={styles.headerImage} />
        <View style={styles.imageOverlay} />
      </View>
      
      <View style={styles.contentCard}>
        <View style={styles.titleRow}>
            <Text style={styles.roomNumber}>Room {room.roomNumber}</Text>
            <Text style={styles.status(room.status)}>{room.status}</Text>
        </View>

        <Text style={styles.typeText}>{room.type} Room</Text>
        <Text style={styles.priceText}>${room.pricePerNight} <Text style={styles.subText}>/ night</Text></Text> 
        
        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Room Details</Text>
        <View style={styles.detailCard}>
          <Text style={styles.detailText}>Capacity: {room.capacity} guests</Text>
          <Text style={styles.detailText}>Type: {room.type}</Text>
        </View>

        <Text style={styles.sectionTitle}>Description</Text>
        <View style={styles.detailCard}>
          <Text style={styles.descriptionText}>{room.description}</Text>
        </View>

        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => navigation.navigate('BookingsTab', {
            screen: 'BookingForm',
            params: { roomId: room._id },
          })}
          activeOpacity={0.9}
        >
          <Text style={styles.bookButtonText}>Book Room</Text>
        </TouchableOpacity>

        {isAdmin ? (
          <View style={styles.actionContainer}>
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={() => navigation.navigate('EditRoom', { room })}
              activeOpacity={0.9}
            >
              <Text style={styles.editButtonText}>Edit Room</Text>
            </TouchableOpacity>
              
            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={handleDelete}
              disabled={deleting}
              activeOpacity={0.9}
            >
              {deleting ? <ActivityIndicator color="#fff" /> : <Text style={styles.deleteButtonText}>Delete Room</Text>}
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </ScrollView>
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
  heroWrap: {
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: 260,
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    backgroundColor: 'rgba(15, 23, 42, 0.18)',
  },
  contentCard: {
    marginTop: -22,
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  roomNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  status: (status) => ({
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: status === 'Available' ? '#e8f5e9' : (status === 'Occupied' ? '#ffebee' : '#fff3e0'),
    color: status === 'Available' ? '#2e7d32' : (status === 'Occupied' ? '#c62828' : '#e65100')
  }),
  typeText: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 6,
    fontWeight: '600',
  },
  priceText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1d4ed8',
    marginBottom: 12,
  },
  subText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 2,
    color: '#1e293b',
  },
  detailCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 14,
  },
  detailText: {
    fontSize: 15,
    color: '#334155',
    marginBottom: 6,
    fontWeight: '500',
  },
  descriptionText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  bookButton: {
    marginTop: 4,
    backgroundColor: '#0f766e',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  errorTitle: {
    color: '#b91c1c',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorText: {
    color: '#7f1d1d',
    fontSize: 15,
    textAlign: 'center',
  },
  actionContainer: {
    marginTop: 18,
    gap: 10,
  },
  editButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default RoomDetailScreen;
