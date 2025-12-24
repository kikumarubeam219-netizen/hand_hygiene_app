import React, { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, View, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DateRangePicker } from '@/components/date-range-picker';
import { useHygieneStorage } from '@/hooks/use-hygiene-storage';
import { TIMING_INFO, TimingType } from '@/lib/types';
import { TimingColors, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { generateStatisticsCSV, downloadCSV, getCSVFilename } from '@/lib/csv-export';

type PeriodType = 'day' | 'week' | 'month' | 'custom';

export default function StatisticsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const { records, getStatistics } = useHygieneStorage();
  const [period, setPeriod] = useState<PeriodType>('day');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(new Date());
  const [customEndDate, setCustomEndDate] = useState(new Date());

  // 期間を計算
  const getDateRange = (periodType: PeriodType) => {
    if (periodType === 'custom') {
      return { startDate: customStartDate, endDate: customEndDate };
    }

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

  const handleCustomDateRange = (start: Date, end: Date) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
    setPeriod('custom');
    setDatePickerVisible(false);
  };

  const handleExportCSV = () => {
    try {
      const csv = generateStatisticsCSV(records, startDate, endDate);
      const filename = getCSVFilename('statistics', startDate);
      downloadCSV(csv, filename);
      Alert.alert('成功', 'CSVファイルをダウンロードしました');
    } catch (error) {
      console.error('Failed to export CSV:', error);
      Alert.alert('エラー', 'CSVのエクスポートに失敗しました');
    }
  };

  const { startDate, endDate } = getDateRange(period);
  const stats = useMemo(() => getStatistics(startDate, endDate), [period, records, customStartDate, customEndDate]);

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
    } else if (period === 'month') {
      return new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
    } else {
      return `${customStartDate.toLocaleDateString('ja-JP')} ～ ${customEndDate.toLocaleDateString('ja-JP')}`;
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
        <Pressable
          onPress={() => setDatePickerVisible(true)}
          style={[
            styles.periodButton,
            period === 'custom' && [
              styles.periodButtonActive,
              { backgroundColor: colors.tint },
            ],
            { borderColor: colors.border },
          ]}
        >
          <ThemedText
            type="defaultSemiBold"
            style={{
              color: period === 'custom' ? '#fff' : colors.text,
              fontSize: 11,
            }}
          >
            期間指定
          </ThemedText>
        </Pressable>
      </View>

      {/* 期間表示とCSV出力 */}
      <View style={styles.periodDisplay}>
        <View style={{ flex: 1 }}>
          <ThemedText type="default" style={{ opacity: 0.7 }}>
            {getPeriodLabel()}
          </ThemedText>
        </View>
        <Pressable
          onPress={handleExportCSV}
          style={[
            styles.exportButton,
            { backgroundColor: colors.tint },
          ]}
        >
          <ThemedText type="defaultSemiBold" style={{ color: '#fff', fontSize: 12 }}>
            CSV出力
          </ThemedText>
        </Pressable>
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

      {/* 日付範囲ピッカー */}
      <DateRangePicker
        visible={datePickerVisible}
        startDate={customStartDate}
        endDate={customEndDate}
        onConfirm={handleCustomDateRange}
        onCancel={() => setDatePickerVisible(false)}
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
  periodSelector: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  periodButton: {
    flex: 1,
    minWidth: '20%',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  exportButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
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
