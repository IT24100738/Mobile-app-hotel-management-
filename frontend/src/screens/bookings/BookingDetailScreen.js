import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { requestWithFallback } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

export default function BookingDetailScreen({ navigation, route }) {
  const { currentUser, isAdmin } = useAuth();
  const { id } = route.params;
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await requestWithFallback(`/api/bookings/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
        if (json.success) setItem(json.data);
        else setErr('Not found');
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const onDelete = () => {
    Alert.alert('Delete booking', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            const res = await requestWithFallback(`/api/bookings/${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (!res.ok) {
              Alert.alert('Error', json.message || 'Failed');
              return;
            }
            navigation.goBack();
          } catch {
            Alert.alert('Error', 'Network error');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color="#2563eb" size="large" /></View>;
  if (err || !item) return <View style={styles.center}><Text style={styles.err}>{err || 'Not found'}</Text></View>;

  const itemOwnerId = item.user?._id || item.user;
  const canManage = isAdmin || (currentUser && itemOwnerId && String(currentUser._id) === String(itemOwnerId));
  const canEditBooking = canManage && (isAdmin || item.status !== 'completed');
  const canPayBooking = !isAdmin && canManage && item.status !== 'cancelled';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>{item.user?.name || 'Customer booking'}</Text>
      <Text style={styles.row}>Customer email: {item.user?.email || '-'}</Text>
      <Text style={styles.row}>Room: {item.room?.roomNumber || item.room?._id || '-'}</Text>
      <Text style={styles.row}>Status: {item.status}</Text>
      <Text style={styles.row}>Check-in: {new Date(item.checkIn).toLocaleString()}</Text>
      <Text style={styles.row}>Check-out: {new Date(item.checkOut).toLocaleString()}</Text>
      <Text style={styles.row}>Total: ${item.totalAmount ?? 0}</Text>
      {item.notes ? <Text style={styles.row}>Notes: {item.notes}</Text> : null}

      {canEditBooking ? (
        <>
          <TouchableOpacity style={styles.edit} onPress={() => navigation.navigate('BookingForm', { id: item._id })}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.del} onPress={onDelete} disabled={deleting}>
            {deleting ? <ActivityIndicator color="#fff" /> : <Text style={styles.delText}>Delete</Text>}
          </TouchableOpacity>
        </>
      ) : null}
      {canManage && !isAdmin && item.status === 'completed' ? (
        <Text style={styles.lockNote}>Completed bookings are locked.</Text>
      ) : null}
      {canPayBooking ? (
        <TouchableOpacity
          style={styles.payButton}
          onPress={() => navigation.navigate('PaymentsTab', { screen: 'PaymentForm', params: { bookingId: item._id } })}
        >
          <Text style={styles.payButtonText}>Pay for this Booking</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f5fb' },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  h1: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 16 },
  row: { fontSize: 15, color: '#334155', marginBottom: 8 },
  err: { color: '#b91c1c' },
  lockNote: { marginTop: 18, color: '#b45309', fontWeight: '700' },
  payButton: {
    marginTop: 16,
    backgroundColor: '#0f766e',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  payButtonText: { color: '#fff', fontWeight: '800' },
  edit: { marginTop: 24, backgroundColor: '#ea580c', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  editText: { color: '#fff', fontWeight: '700' },
  del: { marginTop: 12, backgroundColor: '#dc2626', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  delText: { color: '#fff', fontWeight: '700' },
});
