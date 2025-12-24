import { useState } from 'react';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TimingCard } from '@/components/timing-card';
import { RecordModal } from '@/components/record-modal';
import { useHygieneStorage } from '@/hooks/use-hygiene-storage';
import { TimingType, ActionType } from '@/lib/types';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const { records, addRecord, loading } = useHygieneStorage();
  const [selectedTiming, setSelectedTiming] = useState<TimingType | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // 今日の記録をカウント
  const getTodayCount = (timing: TimingType) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return records.filter(
      (r) =>
        r.timing === timing &&
        r.timestamp >= today.getTime() &&
        r.timestamp < tomorrow.getTime()
    ).length;
  };

  const handleTimingPress = (timing: TimingType) => {
    setSelectedTiming(timing);
    setModalVisible(true);
  };

  const handleSaveRecord = async (action: ActionType, notes?: string) => {
    if (!selectedTiming) return;
    try {
      await addRecord(selectedTiming, action, notes);
    } catch (error) {
      console.error('Failed to save record:', error);
    }
  };

  return (
    <ThemedView
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 20),
          paddingBottom: Math.max(insets.bottom, 20),
          paddingLeft: Math.max(insets.left, 20),
          paddingRight: Math.max(insets.right, 20),
        },
      ]}
    >
      {/* ヘッダー */}
      <View style={styles.header}>
        <ThemedText type="title" style={{ fontSize: 28 }}>
          手指衛生
        </ThemedText>
        <ThemedText type="default" style={{ opacity: 0.7, marginTop: 4 }}>
          5つのタイミングを記録
        </ThemedText>
      </View>

      {/* 本日の実施数 */}
      <View
        style={[
          styles.statsContainer,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <ThemedText type="defaultSemiBold" style={{ fontSize: 14, opacity: 0.7 }}>
          本日の実施数
        </ThemedText>
        <ThemedText type="title" style={{ fontSize: 32, marginTop: 4 }}>
          {records.filter((r) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return r.timestamp >= today.getTime() && r.timestamp < tomorrow.getTime();
          }).length}
          <ThemedText type="default" style={{ fontSize: 16 }}>
            回
          </ThemedText>
        </ThemedText>
      </View>

      {/* タイミングカード */}
      <ScrollView style={styles.cardsContainer} showsVerticalScrollIndicator={false}>
        {([1, 2, 3, 4, 5] as TimingType[]).map((timing) => (
          <TimingCard
            key={timing}
            timing={timing}
            onPress={handleTimingPress}
            count={getTodayCount(timing)}
          />
        ))}
      </ScrollView>

      {/* 記録モーダル */}
      <RecordModal
        visible={modalVisible}
        timing={selectedTiming}
        onClose={() => {
          setModalVisible(false);
          setSelectedTiming(null);
        }}
        onSave={handleSaveRecord}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 20,
  },
  statsContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  cardsContainer: {
    flex: 1,
  },
});
