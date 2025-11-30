import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PRIMARY_ORANGE = '#F57C00';
const BG_COLOR = '#F5F5F5';

export default function WelcomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top || 20, paddingBottom: insets.bottom || 20 },
      ]}
    >
      {/* Logo area */}
      <View style={styles.logoWrapper}>
        {/* Simple wing-like icon using text – you can replace with Image later */}
        <Text style={styles.logoIcon}>🪽</Text>

        <Text style={styles.brandText}>
          <Text style={styles.brandAngel}>Angel</Text>
          <Text style={styles.brandTouch}>Touch.</Text>
        </Text>
      </View>

      {/* Buttons */}
      <View style={styles.bottomArea}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.primaryButtonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.secondaryButtonText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 40,
    color: PRIMARY_ORANGE,
    marginBottom: 8,
  },
  brandText: {
    fontSize: 28,
    fontWeight: '700',
  },
  brandAngel: {
    color: PRIMARY_ORANGE,
  },
  brandTouch: {
    color: '#222222',
  },
  bottomArea: {
    width: '100%',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: PRIMARY_ORANGE,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PRIMARY_ORANGE,
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    color: PRIMARY_ORANGE,
    fontSize: 16,
    fontWeight: '600',
  },
});
