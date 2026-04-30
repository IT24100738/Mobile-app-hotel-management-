import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { requestWithFallback } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

export default function UserDetailScreen({ navigation, route }) {
  const { isAdmin } = useAuth();
  const { id } = route.params;
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await requestWithFallback(`/api/users/${id}`);
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
    Alert.alert('Delete user', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            const res = await requestWithFallback(`/api/users/${id}`, { method: 'DELETE' });
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>{item.name}</Text>
      <Text style={styles.row}>Email: {item.email}</Text>
      <Text style={styles.row}>Phone: {item.phone || '-'}</Text>
      <Text style={styles.row}>Role: {item.role}</Text>

      {isAdmin ? (
        <>
          <TouchableOpacity style={styles.edit} onPress={() => navigation.navigate('UserForm', { id: item._id })}>
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
  err: { color: '#b91c1c' },
  edit: { marginTop: 24, backgroundColor: '#ea580c', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  editText: { color: '#fff', fontWeight: '700' },
  del: { marginTop: 12, backgroundColor: '#dc2626', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  delText: { color: '#fff', fontWeight: '700' },
});
