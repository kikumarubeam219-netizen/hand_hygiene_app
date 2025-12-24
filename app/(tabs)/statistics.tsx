import React, { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useHygieneStorage } from '@/hooks/use-hygiene-storage';
import { TIMING_INFO, TimingType } from '@/lib/types';
import { TimingColors, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type PeriodType = 'day' | 'week' | 'month';

export default function StatisticsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const { records, getStatistics } = useHygieneStorage();
  const [period, setPeriod] = useState<PeriodType>('day');

  // 期間を計算
  const getDateRange = (periodType: PeriodType) => {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (periodType === 'week') {
      const dayOfWeek = startDate.getDay();
      startDate.setDate(startDate.getDate() - dayOfWeek);
    } else if (periodType === 'month') {
      startDate.setDate(1);
    }

    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange(period);
  const stats = useMemo(() => getStatistics(startDate, endDate), [period, records]);

  // 期間ラベルを取得
  const getPeriodLabel = () => {
    if (period === 'day') {
      return new Date().toLocaleDateString('ja-JP');
    } else if (period === 'week') {
      const start = new Date();
      start.setDate(start.getDate() - start.getDay());
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${start.toLocaleDateString('ja-JP')} ～ ${end.toLocaleDateString('ja-JP')}`;
    } else {
      return new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
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
          統計
        </ThemedText>
      </View>

      {/* 期間選択 */}
      <View style={styles.periodSelector}>
        {(['day', 'week', 'month'] as PeriodType[]).map((p) => (
          <Pressable
            key={p}
            onPress={() => setPeriod(p)}
            style={[
              styles.periodButton,
              period === p && [
                styles.periodButtonActive,
                { backgroundColor: colors.tint },
              ],
              { borderColor: colors.border },
            ]}
          >
            <ThemedText
              type="defaultSemiBold"
              style={{
                color: period === p ? '#fff' : colors.text,
              }}
            >
              {p === 'day' ? '日' : p === 'week' ? '週' : '月'}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {/* 期間表示 */}
      <View style={styles.periodDisplay}>
        <ThemedText type="default" style={{ opacity: 0.7 }}>
          {getPeriodLabel()}
        </ThemedText>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 合計実施数 */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <ThemedText type="subtitle">合計実施数</ThemedText>
          <ThemedText type="title" style={{ fontSize: 40, marginTop: 8 }}>
            {stats.total}
            <ThemedText type="default" style={{ fontSize: 16 }}>回</ThemedText>
          </ThemedText>
        </View>

        {/* タイミング別統計 */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            タイミング別実施数
          </ThemedText>

          {([1, 2, 3, 4, 5] as TimingType[]).map((timing) => {
            const count = stats.byTiming[timing];
            const color = Object.values(TimingColors)[timing - 1];
            const info = TIMING_INFO[timing];

            return (
              <View key={timing} style={styles.statRow}>
                <View style={[styles.statBadge, { backgroundColor: color }]}>
                  <ThemedText
                    type="defaultSemiBold"
                    style={{ color: '#fff', fontSize: 12 }}
                  >
                    {timing}
                  </ThemedText>
                </View>
                <View style={styles.statInfo}>
                  <ThemedText type="default">{info.name}</ThemedText>
                  <ThemedText type="default" style={{ opacity: 0.6, fontSize: 12 }}>
                    {info.description}
                  </ThemedText>
                </View>
                <ThemedText type="defaultSemiBold" style={{ fontSize: 18 }}>
                  {count}
                </ThemedText>
              </View>
            );
          })}
        </View>

        {/* アクション別統計 */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            実施内容別
          </ThemedText>

          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.actionRow}>
              <ThemedText type="default">手指消毒</ThemedText>
              <ThemedText type="defaultSemiBold">
                {stats.byAction.hand_sanitizer}回
              </ThemedText>
            </View>
            <View
              style={[
                styles.actionRow,
                { borderTopColor: colors.border, borderTopWidth: 1, paddingTop: 12 },
              ]}
            >
              <ThemedText type="default">手洗い</ThemedText>
              <ThemedText type="defaultSemiBold">
                {stats.byAction.hand_wash}回
              </ThemedText>
            </View>
            <View
              style={[
                styles.actionRow,
                { borderTopColor: colors.border, borderTopWidth: 1, paddingTop: 12 },
              ]}
            >
              <ThemedText type="default">実施なし</ThemedText>
              <ThemedText type="defaultSemiBold">
                {stats.byAction.no_action}回
              </ThemedText>
            </View>
          </View>
        </View>

        {/* 実施率 */}
        {stats.total > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              実施率
            </ThemedText>

            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.rateRow}>
                <ThemedText type="default">手指消毒率</ThemedText>
                <ThemedText type="defaultSemiBold">
                  {Math.round(
                    (stats.byAction.hand_sanitizer / stats.total) * 100
                  )}%
                </ThemedText>
              </View>
              <View
                style={[
                  styles.rateRow,
                  { borderTopColor: colors.border, borderTopWidth: 1, paddingTop: 12 },
                ]}
              >
                <ThemedText type="default">手洗い率</ThemedText>
                <ThemedText type="defaultSemiBold">
                  {Math.round((stats.byAction.hand_wash / stats.total) * 100)}%
                </ThemedText>
              </View>
              <View
                style={[
                  styles.rateRow,
                  { borderTopColor: colors.border, borderTopWidth: 1, paddingTop: 12 },
                ]}
              >
                <ThemedText type="default">実施率</ThemedText>
                <ThemedText type="defaultSemiBold">
                  {Math.round(
                    ((stats.byAction.hand_sanitizer + stats.byAction.hand_wash) /
                      stats.total) *
                      100
                  )}%
                </ThemedText>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
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
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodButtonActive: {
    borderWidth: 0,
  },
  periodDisplay: {
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  content: {
    flex: 1,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 18,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  statBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
});
