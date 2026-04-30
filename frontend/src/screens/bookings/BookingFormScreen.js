import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { requestWithFallback } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

const STATUSES = ['pending', 'confirmed', 'checked_in', 'cancelled', 'completed'];

export default function BookingFormScreen({ navigation, route }) {
  const { currentUser, isAdmin } = useAuth();
  const editId = route.params?.id;
  const selectedRoomId = route.params?.roomId;
  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);

  const [userId, setUserId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [status, setStatus] = useState('pending');
  const [notes, setNotes] = useState('');
  const [totalAmount, setTotalAmount] = useState('');

  useEffect(() => {
    if (!editId && selectedRoomId) {
      setRoomId(selectedRoomId);
    }

    if (!editId && currentUser && !isAdmin) {
      setUserId(currentUser._id);
    }
  }, [editId, selectedRoomId, currentUser, isAdmin]);

  useEffect(() => {
    (async () => {
      try {
        const roomRes = await requestWithFallback('/api/rooms');
        const roomJson = await roomRes.json();
        if (roomJson.success) setRooms(roomJson.data || []);
        if (isAdmin) {
          const userRes = await requestWithFallback('/api/users');
          const userJson = await userRes.json();
          if (userJson.success) setUsers(userJson.data || []);
        }
      } catch {
        // ignore
      }
    })();
  }, [isAdmin]);

  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const res = await requestWithFallback(`/api/bookings/${editId}`);
        const json = await res.json();
        if (json.success && json.data) {
          const b = json.data;
          const ownerId = typeof b.user === 'object' ? b.user._id : b.user;
          if (!isAdmin && currentUser?._id && String(ownerId) !== String(currentUser._id)) {
            Alert.alert('Unauthorized', 'You can only edit your own bookings.');
            navigation.goBack();
            return;
          }
          setUserId(typeof b.user === 'object' ? b.user._id : b.user || '');
          setRoomId(typeof b.room === 'object' ? b.room._id : b.room || '');
          setCheckIn(b.checkIn ? String(b.checkIn).slice(0, 10) : '');
          setCheckOut(b.checkOut ? String(b.checkOut).slice(0, 10) : '');
          setStatus(b.status || 'pending');
          setNotes(b.notes || '');
          setTotalAmount(b.totalAmount != null ? String(b.totalAmount) : '');
        }
      } catch {
        Alert.alert('Error', 'Could not load booking');
      } finally {
        setLoading(false);
      }
    })();
  }, [editId]);

  const submit = async () => {
    if ((!isAdmin && !currentUser) || (!isAdmin && !roomId) || !checkIn || !checkOut || (isAdmin && !userId)) {
      Alert.alert('Validation', isAdmin ? 'User, room, check-in and check-out are required.' : 'Room, check-in and check-out are required.');
      return;
    }

    const payload = {
      room: roomId,
      checkIn: new Date(checkIn).toISOString(),
      checkOut: new Date(checkOut).toISOString(),
      status,
      notes: notes.trim(),
      totalAmount: totalAmount ? Number(totalAmount) : 0,
    };

    if (isAdmin) {
      payload.user = userId;
    } else if (currentUser?._id) {
      payload.user = currentUser._id;
    }

    setSaving(true);
    try {
      const res = await requestWithFallback(editId ? `/api/bookings/${editId}` : '/api/bookings', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        Alert.alert('Error', json.message || 'Save failed');
        return;
      }
      Alert.alert('Saved', 'Booking saved.');
      navigation.navigate('BookingsTab', { screen: 'BookingList' });
    } catch {
      Alert.alert('Error', 'Network error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {isAdmin ? (
        <>
          <Text style={styles.label}>User ID *</Text>
          <TextInput style={styles.input} value={userId} onChangeText={setUserId} placeholder="Mongo id" />
          {users.length > 0 ? (
            <View style={styles.row}>
              {users.slice(0, 8).map((u) => (
                <TouchableOpacity key={u._id} style={styles.chip} onPress={() => setUserId(u._id)}>
                  <Text style={styles.chipText}>{u.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </>
      ) : null}

      <Text style={styles.label}>Room ID *</Text>
      <TextInput
        style={styles.input}
        value={roomId}
        onChangeText={setRoomId}
        placeholder="Mongo id"
        editable={isAdmin || !selectedRoomId}
      />
      {rooms.length > 0 ? (
        <View style={styles.row}>
          {rooms.slice(0, 8).map((r) => (
            <TouchableOpacity key={r._id} style={styles.chip} onPress={() => setRoomId(r._id)}>
              <Text style={styles.chipText}>#{r.roomNumber}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <Text style={styles.label}>Check-in * (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} value={checkIn} onChangeText={setCheckIn} placeholder="2026-04-01" />

      <Text style={styles.label}>Check-out * (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} value={checkOut} onChangeText={setCheckOut} placeholder="2026-04-03" />

      {isAdmin ? (
        <>
          <Text style={styles.label}>Status</Text>
          <View style={styles.row}>
            {STATUSES.map((s) => (
              <TouchableOpacity key={s} style={[styles.chip, status === s && styles.chipOn]} onPress={() => setStatus(s)}>
                <Text style={[styles.chipText, status === s && styles.chipTextOn]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Total amount</Text>
          <TextInput style={styles.input} value={totalAmount} onChangeText={setTotalAmount} keyboardType="decimal-pad" />
        </>
      ) : null}

      <Text style={styles.label}>Notes</Text>
      <TextInput style={[styles.input, styles.tall]} value={notes} onChangeText={setNotes} multiline />

      <TouchableOpacity style={styles.save} onPress={submit} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f5fb' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  label: { fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 16 },
  tall: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#e2e8f0' },
  chipOn: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 12, color: '#334155' },
  chipTextOn: { color: '#fff', fontWeight: '600' },
  save: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
