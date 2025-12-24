import React, { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, View, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DateRangePicker } from '@/components/date-range-picker';
import { PieChart } from '@/components/pie-chart';
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

  // タイミング別実施率を計算
  const getTimingCompletionRate = (timing: TimingType) => {
    const timingRecords = records.filter(
      (r) => r.timing === timing && r.timestamp >= startDate.getTime() && r.timestamp <= endDate.getTime()
    );
    if (timingRecords.length === 0) return 0;
    const completedCount = timingRecords.filter((r) => r.action !== 'no_action').length;
    return Math.round((completedCount / timingRecords.length) * 100);
  };

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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 期間選択 */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            期間選択
          </ThemedText>

          <View style={styles.periodButtons}>
            {(['day', 'week', 'month'] as const).map((p) => (
              <Pressable
                key={p}
                onPress={() => setPeriod(p)}
                style={[
                  styles.periodButton,
                  {
                    backgroundColor: period === p ? colors.tint : colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <ThemedText
                  type="defaultSemiBold"
                  style={{
                    color: period === p ? '#fff' : colors.text,
                    fontSize: 12,
                  }}
                >
                  {p === 'day' ? '今日' : p === 'week' ? '今週' : '今月'}
                </ThemedText>
              </Pressable>
            ))}

            <Pressable
              onPress={() => setDatePickerVisible(true)}
              style={[
                styles.periodButton,
                {
                  backgroundColor: period === 'custom' ? colors.tint : colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <ThemedText
                type="defaultSemiBold"
                style={{
                  color: period === 'custom' ? '#fff' : colors.text,
                  fontSize: 12,
                }}
              >
                期間指定
              </ThemedText>
            </Pressable>
          </View>

          <ThemedText type="default" style={styles.periodLabel}>
            {getPeriodLabel()}
          </ThemedText>
        </View>

        {/* 日付ピッカー */}
        {datePickerVisible && (
          <DateRangePicker
            visible={datePickerVisible}
            startDate={customStartDate}
            endDate={customEndDate}
            onConfirm={handleCustomDateRange}
            onCancel={() => setDatePickerVisible(false)}
          />
        )}

        {/* 総実施数 */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            実施数
          </ThemedText>

          <View
            style={[
              styles.statsCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.statRow}>
              <ThemedText type="default">総実施数</ThemedText>
              <ThemedText type="title" style={{ fontSize: 24, color: colors.tint }}>
                {stats.total}
              </ThemedText>
            </View>

            <View style={[styles.statRow, { borderTopColor: colors.border, borderTopWidth: 1, paddingTop: 12 }]}>
              <ThemedText type="default">実施率</ThemedText>
              <ThemedText type="title" style={{ fontSize: 24, color: colors.tint }}>
                {stats.total > 0
                  ? Math.round(
                      ((stats.byAction.hand_sanitizer + stats.byAction.hand_wash) / stats.total) * 100
                    )
                  : 0}
                %
              </ThemedText>
            </View>
          </View>
        </View>

        {/* 実施内容別の円グラフ */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            実施内容別実施率
          </ThemedText>

          {stats.total > 0 ? (
            <View style={styles.chartContainer}>
              <PieChart
                data={[
                  { label: '手指消毒', value: stats.byAction.hand_sanitizer, color: '#FF6B6B' },
                  { label: '手洗い', value: stats.byAction.hand_wash, color: '#4ECDC4' },
                  { label: '実施なし', value: stats.byAction.no_action, color: '#E0E0E0' },
                ]}
              />
            </View>
          ) : (
            <ThemedText type="default" style={styles.emptyText}>
              この期間のデータはありません
            </ThemedText>
          )}
        </View>

        {/* タイミング別実施率 */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            タイミング別実施率
          </ThemedText>

          <View style={styles.timingRatesContainer}>
            {([1, 2, 3, 4, 5] as const).map((timing) => {
              const rate = getTimingCompletionRate(timing);
              const timingInfo = TIMING_INFO[timing];
              const timingColor = TimingColors[timing];

              return (
                <View
                  key={timing}
                  style={[
                    styles.timingRateCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.timingRateHeader}>
                    <View
                      style={[
                        styles.timingDot,
                        { backgroundColor: timingColor },
                      ]}
                    />
                    <View style={styles.timingInfo}>
                      <ThemedText type="defaultSemiBold" style={{ fontSize: 13 }}>
                        {timing}. {timingInfo.name}
                      </ThemedText>
                      <ThemedText type="default" style={{ fontSize: 11, opacity: 0.7 }}>
                        {timingInfo.description}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.rateBar}>
                    <View
                      style={[
                        styles.rateBarFill,
                        {
                          width: `${rate}%`,
                          backgroundColor: timingColor,
                        },
                      ]}
                    />
                  </View>

                  <ThemedText type="defaultSemiBold" style={{ fontSize: 14, color: timingColor }}>
                    {rate}%
                  </ThemedText>
                </View>
              );
            })}
          </View>
        </View>

        {/* タイミング別実施数 */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            タイミング別実施数
          </ThemedText>

          <View
            style={[
              styles.statsCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {([1, 2, 3, 4, 5] as const).map((timing, index) => (
              <View
                key={timing}
                style={[
                  styles.statRow,
                  index > 0 && { borderTopColor: colors.border, borderTopWidth: 1, paddingTop: 12 },
                ]}
              >
                <ThemedText type="default">
                  {timing}. {TIMING_INFO[timing].name}
                </ThemedText>
                <ThemedText type="defaultSemiBold">
                  {stats.byTiming[timing] || 0}件
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* CSV出力 */}
        <View style={styles.section}>
          <Pressable
            onPress={handleExportCSV}
            style={[
              styles.button,
              { backgroundColor: '#95E1D3' },
            ]}
          >
            <ThemedText type="defaultSemiBold" style={{ color: '#fff' }}>
              CSVをダウンロード
            </ThemedText>
          </Pressable>
        </View>
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
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 18,
  },
  periodButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 36,
  },
  periodLabel: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: 8,
  },
  statsCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  chartContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.6,
    paddingVertical: 24,
  },
  timingRatesContainer: {
    gap: 12,
  },
  timingRateCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  timingRateHeader: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  timingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  timingInfo: {
    flex: 1,
  },
  rateBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  rateBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
});
