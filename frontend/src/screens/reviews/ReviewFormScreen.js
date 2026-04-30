import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { requestWithFallback } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

const STATUSES = ['Visible', 'Hidden'];

export default function ReviewFormScreen({ navigation, route }) {
  const { currentUser, isAdmin } = useAuth();
  const editId = route.params?.id;
  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);

  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [experiences, setExperiences] = useState([]);

  const [userId, setUserId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [experienceId, setExperienceId] = useState('');
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('Visible');

  useEffect(() => {
    (async () => {
      try {
        const [rRes, xRes] = await Promise.all([
          requestWithFallback('/api/rooms'),
          requestWithFallback('/api/experiences'),
        ]);
        const [rJson, xJson] = await Promise.all([rRes.json(), xRes.json()]);
        if (rJson.success) setRooms(rJson.data || []);
        if (xJson.success) setExperiences(xJson.data || []);
        if (isAdmin) {
          const uRes = await requestWithFallback('/api/users');
          const uJson = await uRes.json();
          if (uJson.success) setUsers(uJson.data || []);
        }
      } catch {
        // ignore
      }
    })();
  }, [isAdmin]);

  useEffect(() => {
    if (!editId && currentUser && !isAdmin) {
      setUserId(currentUser._id);
    }
  }, [editId, currentUser, isAdmin]);

  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const res = await requestWithFallback(`/api/reviews/${editId}`);
        const json = await res.json();
        if (json.success && json.data) {
          const v = json.data;
          const ownerId = typeof v.user === 'object' ? v.user._id : v.user;
          if (!isAdmin && currentUser?._id && String(ownerId) !== String(currentUser._id)) {
            Alert.alert('Unauthorized', 'You can only edit your own reviews.');
            navigation.goBack();
            return;
          }
          setUserId(v.user && typeof v.user === 'object' ? v.user._id : v.user || '');
          setRoomId(v.room && typeof v.room === 'object' ? v.room._id : v.room || '');
          setExperienceId(v.experience && typeof v.experience === 'object' ? v.experience._id : v.experience || '');
          setRating(v.rating != null ? String(v.rating) : '5');
          setComment(v.comment || '');
          setStatus(v.status || 'Visible');
        }
      } catch {
        Alert.alert('Error', 'Could not load');
      } finally {
        setLoading(false);
      }
    })();
  }, [editId]);

  const submit = async () => {
    if ((!isAdmin && !currentUser) || (!isAdmin && !comment.trim()) || (isAdmin && !userId.trim()) || !comment.trim()) {
      Alert.alert('Validation', isAdmin ? 'User and comment are required.' : 'Comment is required.');
      return;
    }

    const payload = {
      user: isAdmin ? userId.trim() : currentUser?._id,
      room: roomId.trim() || null,
      experience: experienceId.trim() || null,
      rating: Number(rating),
      comment: comment.trim(),
      status,
    };

    if (!isAdmin && currentUser?._id) {
      payload.user = currentUser._id;
    }

    setSaving(true);
    try {
      const res = await requestWithFallback(editId ? `/api/reviews/${editId}` : '/api/reviews', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        Alert.alert('Error', json.message || 'Save failed');
        return;
      }
      Alert.alert('Saved', 'Review saved.');
      navigation.goBack();
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
              {users.slice(0, 6).map((u) => (
                <TouchableOpacity key={u._id} style={styles.chip} onPress={() => setUserId(u._id)}>
                  <Text style={styles.chipText}>{u.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </>
      ) : null}

      <Text style={styles.label}>Room ID (optional)</Text>
      <TextInput style={styles.input} value={roomId} onChangeText={setRoomId} />
      {rooms.length > 0 ? (
        <View style={styles.row}>
          {rooms.slice(0, 6).map((r) => (
            <TouchableOpacity key={r._id} style={styles.chip} onPress={() => setRoomId(r._id)}>
              <Text style={styles.chipText}>#{r.roomNumber}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <Text style={styles.label}>Experience ID (optional)</Text>
      <TextInput style={styles.input} value={experienceId} onChangeText={setExperienceId} />
      {experiences.length > 0 ? (
        <View style={styles.row}>
          {experiences.slice(0, 6).map((x) => (
            <TouchableOpacity key={x._id} style={styles.chip} onPress={() => setExperienceId(x._id)}>
              <Text style={styles.chipText}>{x.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <Text style={styles.label}>Rating (1-5)</Text>
      <TextInput style={styles.input} value={rating} onChangeText={setRating} keyboardType="number-pad" />

      <Text style={styles.label}>Comment *</Text>
      <TextInput style={[styles.input, styles.tall]} value={comment} onChangeText={setComment} multiline />

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
        </>
      ) : null}

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
  tall: { minHeight: 90, textAlignVertical: 'top' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#e2e8f0' },
  chipOn: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 12, color: '#334155' },
  chipTextOn: { color: '#fff', fontWeight: '600' },
  save: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
