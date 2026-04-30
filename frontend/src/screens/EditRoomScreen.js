import React, { useState } from 'react';
import { 
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { requestWithFallback } from '../config/api';
const ROOM_TYPES = ['Single', 'Double', 'Dormitory', 'Suite']; 

const EditRoomScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { room } = route.params;

  // Form State initialized with room data
  const [roomNumber, setRoomNumber] = useState(room.roomNumber);
  const [type, setType] = useState(room.type); 
  const [pricePerMonth, setPricePerMonth] = useState(room.pricePerNight ? room.pricePerNight.toString() : ''); 
  const [capacity, setCapacity] = useState(room.capacity ? room.capacity.toString() : '');
  const [description, setDescription] = useState(room.description || '');
  const [selectedPhotos, setSelectedPhotos] = useState([]);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    let valid = true;
    let newErrors = {};

    if (!roomNumber.trim()) { newErrors.roomNumber = 'Room Number is required'; valid = false; }
    if (!pricePerMonth.trim() || isNaN(pricePerMonth) || Number(pricePerMonth) <= 0) { 
        newErrors.pricePerMonth = 'Valid Price is required'; valid = false; 
    }
    if (!capacity.trim() || isNaN(capacity) || Number(capacity) < 1) { 
        newErrors.capacity = 'Capacity must be at least 1'; valid = false; 
    }
    if (!description.trim()) { newErrors.description = 'Description is required'; valid = false; }

    setErrors(newErrors);
    return valid;
  };

  const handlePickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo library access to upload room images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.8,
    });

    if (result.canceled) return;

    const assets = (result.assets || []).slice(0, 5);
    setSelectedPhotos(assets);
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('roomNumber', roomNumber.trim());
    formData.append('type', type);
    formData.append('pricePerNight', String(Number(pricePerMonth)));
    formData.append('capacity', String(Number(capacity)));
    formData.append('description', description.trim());

    selectedPhotos.forEach((asset, index) => {
      const extension = asset.uri.split('.').pop() || 'jpg';
      const name = asset.fileName || `room-photo-${Date.now()}-${index}.${extension}`;
      const typeName = asset.mimeType || `image/${extension === 'jpg' ? 'jpeg' : extension}`;
      formData.append('photos', {
        uri: asset.uri,
        name,
        type: typeName,
      });
    });

    try {
      const response = await requestWithFallback(`/api/rooms/${room._id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json'
        },
        body: formData
      });

      const json = await response.json();
      if (!response.ok) {
        Alert.alert('Error', json.message || `Request failed (${response.status})`);
        return;
      }
      if (json.success) {
        Alert.alert("Success", "Room updated successfully!");
        navigation.navigate('Rooms');
      } else {
        Alert.alert("Error", json.message || "Failed to update room");
      }
    } catch (err) {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Edit Room</Text>
      <Text style={styles.subHeader}>Update details and keep your listing up to date.</Text>

      <View style={styles.formCard}>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Room Number *</Text>
        <TextInput 
          style={[styles.input, errors.roomNumber && styles.inputError]} 
          value={roomNumber} onChangeText={(t) => {setRoomNumber(t); setErrors({...errors, roomNumber: null})}}
        />
        {errors.roomNumber && <Text style={styles.errorText}>{errors.roomNumber}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Room Type *</Text>
        <View style={styles.typeSelector}>
            {ROOM_TYPES.map((t) => (
                <TouchableOpacity 
                    key={t} 
                    style={[styles.typeButton, type === t && styles.typeButtonActive]}
                    onPress={() => setType(t)}
                >
                    <Text style={[styles.typeButtonText, type === t && styles.typeButtonTextActive]}>{t}</Text>
                </TouchableOpacity>
            ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Price / Month ($) *</Text>
        <TextInput 
          style={[styles.input, errors.pricePerMonth && styles.inputError]} 
          value={pricePerMonth} onChangeText={(t) => {setPricePerMonth(t); setErrors({...errors, pricePerMonth: null})}}
          keyboardType="numeric"
        />
        {errors.pricePerMonth && <Text style={styles.errorText}>{errors.pricePerMonth}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Capacity (Persons) *</Text>
        <TextInput 
          style={[styles.input, errors.capacity && styles.inputError]} 
          value={capacity} onChangeText={(t) => {setCapacity(t); setErrors({...errors, capacity: null})}}
          keyboardType="numeric"
        />
        {errors.capacity && <Text style={styles.errorText}>{errors.capacity}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description *</Text>
        <TextInput 
          style={[styles.input, styles.textArea, errors.description && styles.inputError]} 
          value={description} onChangeText={(t) => {setDescription(t); setErrors({...errors, description: null})}}
          multiline numberOfLines={4}
        />
        {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
      </View>

      <View style={styles.imagePickerGroup}>
        <TouchableOpacity style={styles.imagePickerButton} onPress={handlePickImages}>
          <Text style={styles.imagePickerText}>
            {selectedPhotos.length > 0
              ? `${selectedPhotos.length} new image(s) selected`
              : 'Replace photos (optional, up to 5)'}
          </Text>
        </TouchableOpacity>
        {selectedPhotos.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewRow}>
            {selectedPhotos.map((asset, idx) => (
              <Image key={`${asset.uri}-${idx}`} source={{ uri: asset.uri }} style={styles.previewImage} />
            ))}
          </ScrollView>
        ) : null}
      </View>

      <TouchableOpacity 
        style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
        onPress={handleUpdate} 
        disabled={loading}
        activeOpacity={0.9}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Update Room</Text>}
      </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f5fb' },
  content: { padding: 16, paddingBottom: 24 },
  header: { fontSize: 27, fontWeight: '800', color: '#0f172a', marginBottom: 6, marginTop: 4 },
  subHeader: { fontSize: 14, color: '#64748b', marginBottom: 14 },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 7 },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  inputError: { borderColor: '#dc2626', backgroundColor: '#fef2f2' },
  textArea: { height: 100, textAlignVertical: 'top' },
  errorText: { color: '#b91c1c', fontSize: 12, marginTop: 5, fontWeight: '600' },
  typeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeButton: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    marginBottom: 5,
  },
  typeButtonActive: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  typeButtonText: { color: '#334155', fontWeight: '700', fontSize: 12 },
  typeButtonTextActive: { color: '#fff' },
  imagePickerGroup: { alignItems: 'center', marginBottom: 22 },
  imagePickerButton: {
    backgroundColor: '#f8fafc',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    width: '100%',
    alignItems: 'center',
  },
  imagePickerText: { color: '#475569', fontSize: 14, fontWeight: '600' },
  previewRow: { marginTop: 10, gap: 8 },
  previewImage: {
    width: 82,
    height: 82,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginRight: 8,
  },
  submitButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    marginTop: 10,
    shadowColor: '#b45309',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  submitButtonDisabled: { backgroundColor: '#fed7aa' },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default EditRoomScreen;
