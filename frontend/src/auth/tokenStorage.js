import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'wmt_auth_token';

export async function getStoredToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setStoredToken(token) {
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}

export async function clearStoredToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}
