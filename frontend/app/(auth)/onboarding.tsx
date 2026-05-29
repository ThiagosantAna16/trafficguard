import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Dimensions,
  TouchableOpacity, ListRenderItem,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { Button } from '../../src/components/Button';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    icon: '🚦',
    accent: colors.primary,
    title: 'Saia sempre no\ntempo certo',
    subtitle: 'O TrafficGuard monitora sua rota e te avisa antes de você sair de casa, quando o trânsito está pesado.',
  },
  {
    id: '2',
    icon: '🛣️',
    accent: colors.green,
    title: 'Rotas alternativas\nprontas pra você',
    subtitle: 'Quando há congestionamento, você já recebe as opções mais rápidas — sem precisar improvisar no trânsito.',
  },
  {
    id: '3',
    icon: '🔔',
    accent: colors.amber,
    title: 'Notificação\ninteligente',
    subtitle: 'Defina o horário e a tolerância. A gente só avisa quando realmente importa — nada de notificação à toa.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const slide = slides[currentIndex];

  const goNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(i => i + 1);
    } else {
      router.replace('/(auth)/login');
    }
  };

  const renderItem: ListRenderItem<typeof slides[0]> = ({ item }) => (
    <View style={[styles.slide, { width }]}>
      <View style={[styles.iconCircle, { backgroundColor: `${item.accent}18`, borderColor: `${item.accent}30` }]}>
        <Text style={styles.icon}>{item.icon}</Text>
      </View>
      <Text style={[styles.title, { color: item.accent }]} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Skip */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.skipBtn}>
          <Text style={styles.skipText}>Pular</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        keyExtractor={i => i.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={{ flex: 1 }}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {slides.map((s, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === currentIndex
                ? { backgroundColor: slide.accent, width: 24 }
                : { backgroundColor: colors.border, width: 8 },
            ]}
          />
        ))}
      </View>

      <View style={styles.actions}>
        <Button
          label={currentIndex < slides.length - 1 ? 'Próximo  →' : '🚀  Começar agora'}
          onPress={goNext}
          size="lg"
          style={{ width: '100%' }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.darkBg },
  topBar: { alignItems: 'flex-end', paddingHorizontal: 24, paddingTop: 56 },
  skipBtn: { paddingVertical: 6, paddingHorizontal: 12 },
  skipText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 20,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: 12,
  },
  icon: { fontSize: 64 },
  title: {
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  dot: { height: 8, borderRadius: 4 },
  actions: { paddingHorizontal: 24, paddingBottom: 52 },
});
