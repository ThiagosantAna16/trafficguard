import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../src/stores/authStore';
import { colors } from '../src/theme/colors';

export default function Index() {
  const { firebaseUid, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.darkBg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return firebaseUid
    ? <Redirect href="/(app)" />
    : <Redirect href="/(auth)/onboarding" />;
}
