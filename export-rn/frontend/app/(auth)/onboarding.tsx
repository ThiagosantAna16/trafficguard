import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Dimensions,
  TouchableOpacity, ListRenderItem, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';
import { Button } from '../../src/components/Button';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Saia sempre\nno tempo certo',
    subtitle: 'O TrafficGuard acompanha sua rota e avisa antes de você sair de casa, quando o trânsito está pesado.',
  },
  {
    id: '2',
    title: 'Rotas alternativas\nprontas pra você',
    subtitle: 'Quando há congestionamento, você já recebe as opções mais rápidas — sem precisar improvisar no trânsito.',
  },
  {
    id: '3',
    title: 'Notificação\nsob medida',
    subtitle: 'Defina o horário e a tolerância. Só avisamos quando realmente importa.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

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
      <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Image source={require('../../assets/logo-mark.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.pageCount}>{String(currentIndex + 1).padStart(2, '0')} / 03</Text>
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

      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === currentIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>

      <View style={styles.actions}>
        <Button
          label={currentIndex < slides.length - 1 ? 'Continuar' : 'Começar agora'}
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 56,
  },
  logo: { width: 40, height: 40 },
  pageCount: { fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted },
  slide: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 22,
  },
  title: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 34,
    color: colors.textPrimary,
    lineHeight: 42,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 15.5,
    color: colors.textSecondary,
    lineHeight: 24,
    maxWidth: 300,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: { height: 2, borderRadius: 0 },
  dotActive: { width: 28, backgroundColor: colors.accent },
  dotInactive: { width: 14, backgroundColor: colors.border },
  actions: { paddingHorizontal: 32, paddingBottom: 52 },
});
