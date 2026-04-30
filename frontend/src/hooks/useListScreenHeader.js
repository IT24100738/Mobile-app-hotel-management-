import { useLayoutEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

/**
 * @param {boolean} options.showSignOut - default false (use Rooms tab to sign out)
 */
export function useListScreenHeader(navigation, options = {}) {
  const { logout } = useAuth();
  const { addRoute, addLabel = '+ Add', showSignOut = false } = options;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.row}>
          {showSignOut ? (
            <TouchableOpacity onPress={logout} hitSlop={8} style={styles.textBtn}>
              <Text style={styles.muted}>Sign out</Text>
            </TouchableOpacity>
          ) : null}
          {addRoute ? (
            <TouchableOpacity style={styles.primary} onPress={() => navigation.navigate(addRoute)}>
              <Text style={styles.primaryText}>{addLabel}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ),
    });
  }, [navigation, logout, addRoute, addLabel, showSignOut]);
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginRight: 8, gap: 8 },
  textBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#ffedd5',
  },
  muted: { color: '#9a3412', fontWeight: '700', fontSize: 12 },
  primary: {
    backgroundColor: '#0f766e',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    shadowColor: '#042f2e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
