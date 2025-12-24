import React, { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useHygieneStorage } from '@/hooks/use-hygiene-storage';
import { TIMING_INFO, TimingType, ACTION_LABELS, HygieneRecord } from '@/lib/types';
import { TimingColors, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type FilterPeriod = 'today' | 'week' | 'month';

export default function ChecklistScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const { records, deleteRecord } = useHygieneStorage();
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('today');

  // フィルタリング
  const filteredRecords = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (filterPeriod === 'week') {
      const dayOfWeek = startDate.getDay();
      startDate.setDate(startDate.getDate() - dayOfWeek);
    } else if (filterPeriod === 'month') {
      startDate.setDate(1);
    }

    return records.filter((r) => r.timestamp >= startDate.getTime());
  }, [records, filterPeriod]);

  // 日付別にグループ化
  const groupedRecords = useMemo(() => {
    const groups: Record<string, HygieneRecord[]> = {};

    filteredRecords.forEach((record) => {
      const date = new Date(record.timestamp);
      const dateKey = date.toLocaleDateString('ja-JP');

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(record);
    });

    // 日付でソート（新しい順）
    return Object.entries(groups)
      .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
      .reduce((acc, [date, recs]) => {
        acc[date] = recs.sort((a, b) => b.timestamp - a.timestamp);
        return acc;
      }, {} as Record<string, HygieneRecord[]>);
  }, [filteredRecords]);

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord(id);
    } catch (error) {
      console.error('Failed to delete record:', error);
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
          チェックシート
        </ThemedText>
      </View>

      {/* フィルター */}
      <View style={styles.filterSelector}>
        {(['today', 'week', 'month'] as FilterPeriod[]).map((period) => (
          <Pressable
            key={period}
            onPress={() => setFilterPeriod(period)}
            style={[
              styles.filterButton,
              filterPeriod === period && [
                styles.filterButtonActive,
                { backgroundColor: colors.tint },
              ],
              { borderColor: colors.border },
            ]}
          >
            <ThemedText
              type="defaultSemiBold"
              style={{
                color: filterPeriod === period ? '#fff' : colors.text,
                fontSize: 12,
              }}
            >
              {period === 'today' ? '今日' : period === 'week' ? '今週' : '今月'}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {Object.entries(groupedRecords).length === 0 ? (
          <View style={styles.emptyContainer}>
            <ThemedText type="default" style={{ opacity: 0.6, textAlign: 'center' }}>
              記録がありません
            </ThemedText>
          </View>
        ) : (
          Object.entries(groupedRecords).map(([dateKey, dayRecords]) => (
            <View key={dateKey} style={styles.dateSection}>
              <ThemedText type="subtitle" style={styles.dateHeader}>
                {dateKey}
              </ThemedText>

              {dayRecords.map((record) => {
                const timing = TIMING_INFO[record.timing];
                const color = Object.values(TimingColors)[record.timing - 1];

                return (
                  <View
                    key={record.id}
                    style={[
                      styles.recordCard,
                      { backgroundColor: `${color}15`, borderColor: color },
                    ]}
                  >
                    <View style={styles.recordHeader}>
                      <View style={[styles.recordBadge, { backgroundColor: color }]}>
                        <ThemedText
                          type="defaultSemiBold"
                          style={{ color: '#fff', fontSize: 14 }}
                        >
                          {record.timing}
                        </ThemedText>
                      </View>

                      <View style={styles.recordInfo}>
                        <ThemedText type="defaultSemiBold">{timing.name}</ThemedText>
                        <ThemedText
                          type="default"
                          style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}
                        >
                          {new Date(record.timestamp).toLocaleTimeString('ja-JP', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </ThemedText>
                      </View>

                      <Pressable
                        onPress={() => handleDelete(record.id)}
                        style={styles.deleteButton}
                      >
                        <ThemedText
                          type="default"
                          style={{ color: colors.error, fontSize: 18 }}
                        >
                          ✕
                        </ThemedText>
                      </Pressable>
                    </View>

                    <View style={styles.recordContent}>
                      <View style={styles.actionBadge}>
                        <ThemedText
                          type="defaultSemiBold"
                          style={{ fontSize: 12, color: color }}
                        >
                          {ACTION_LABELS[record.action]}
                        </ThemedText>
                      </View>

                      {record.notes && (
                        <View style={styles.notesContainer}>
                          <ThemedText type="default" style={{ fontSize: 12, opacity: 0.7 }}>
                            {record.notes}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ))
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
  filterSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    borderWidth: 0,
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  dateSection: {
    marginBottom: 20,
  },
  dateHeader: {
    marginBottom: 12,
    fontSize: 16,
  },
  recordCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  recordBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordInfo: {
    flex: 1,
  },
  deleteButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordContent: {
    marginLeft: 48,
    gap: 8,
  },
  actionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  notesContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
