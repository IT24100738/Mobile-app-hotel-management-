import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { requestWithFallback } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

export default function ReviewDetailScreen({ navigation, route }) {
  const { currentUser, isAdmin } = useAuth();
  const { id } = route.params;
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await requestWithFallback(`/api/reviews/${id}`);
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
    Alert.alert('Delete review', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            const res = await requestWithFallback(`/api/reviews/${id}`, { method: 'DELETE' });
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>{item.user?.name || 'User'}</Text>
      <Text style={styles.row}>Rating: {item.rating}/5</Text>
      <Text style={styles.row}>Status: {item.status}</Text>
      <Text style={styles.row}>Room: {item.room?.roomNumber || '-'}</Text>
      <Text style={styles.row}>Experience: {item.experience?.title || '-'}</Text>
      <Text style={styles.body}>{item.comment}</Text>

      {canManage ? (
        <>
          <TouchableOpacity style={styles.edit} onPress={() => navigation.navigate('ReviewForm', { id: item._id })}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.del} onPress={onDelete} disabled={deleting}>
            {deleting ? <ActivityIndicator color="#fff" /> : <Text style={styles.delText}>Delete</Text>}
          </TouchableOpacity>
        </>
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
  body: { fontSize: 15, color: '#475569', lineHeight: 22, marginTop: 8 },
  err: { color: '#b91c1c' },
  edit: { marginTop: 24, backgroundColor: '#ea580c', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  editText: { color: '#fff', fontWeight: '700' },
  del: { marginTop: 12, backgroundColor: '#dc2626', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  delText: { color: '#fff', fontWeight: '700' },
});
