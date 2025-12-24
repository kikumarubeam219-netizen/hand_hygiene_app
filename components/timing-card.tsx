import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';
import { TimingType, TIMING_INFO } from '@/lib/types';
import { TimingColors } from '@/constants/theme';

interface TimingCardProps {
  timing: TimingType;
  onPress: (timing: TimingType) => void;
  count?: number;
}

export function TimingCard({ timing, onPress, count = 0 }: TimingCardProps) {
  const info = TIMING_INFO[timing];
  const color = Object.values(TimingColors)[timing - 1];

  return (
    <Pressable
      onPress={() => onPress(timing)}
      style={({ pressed }) => [
        styles.container,
        { borderColor: color, backgroundColor: `${color}15` },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.header, { borderBottomColor: color }]}>
        <View style={[styles.badge, { backgroundColor: color }]}>
          <ThemedText
            type="defaultSemiBold"
            style={[styles.timingNumber, { color: '#fff' }]}
          >
            {timing}
          </ThemedText>
        </View>
        <ThemedText type="defaultSemiBold" style={styles.title}>
          {info.name}
        </ThemedText>
      </View>

      <View style={styles.content}>
        <ThemedText type="default" style={styles.description}>
          {info.description}
        </ThemedText>
      </View>

      {count > 0 && (
        <View style={[styles.counter, { backgroundColor: color }]}>
          <ThemedText type="defaultSemiBold" style={{ color: '#fff', fontSize: 14 }}>
            {count}回
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 8,
    marginBottom: 8,
    gap: 12,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timingNumber: {
    fontSize: 18,
  },
  title: {
    flex: 1,
    fontSize: 16,
  },
  content: {
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    opacity: 0.7,
    lineHeight: 18,
  },
  counter: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
});
