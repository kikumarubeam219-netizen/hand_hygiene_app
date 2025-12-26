import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, View, TextInput, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface DateRangePickerProps {
  visible: boolean;
  startDate: Date;
  endDate: Date;
  onConfirm: (startDate: Date, endDate: Date) => void;
  onCancel: () => void;
}

export function DateRangePicker({
  visible,
  startDate,
  endDate,
  onConfirm,
  onCancel,
}: DateRangePickerProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [tempStartDate, setTempStartDate] = useState(
    startDate.toISOString().split('T')[0]
  );
  const [tempEndDate, setTempEndDate] = useState(
    endDate.toISOString().split('T')[0]
  );

  const handleConfirm = () => {
    try {
      const start = new Date(tempStartDate);
      const end = new Date(tempEndDate);

      if (start > end) {
        alert('開始日は終了日より前である必要があります');
        return;
      }

      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      onConfirm(start, end);
    } catch (error) {
      alert('日付の形式が正しくありません');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
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
          <ThemedText type="title" style={{ fontSize: 24 }}>
            期間を選択
          </ThemedText>
          <Pressable onPress={onCancel} style={styles.closeButton}>
            <ThemedText type="defaultSemiBold" style={{ fontSize: 18 }}>
              ✕
            </ThemedText>
          </Pressable>
        </View>

        {/* コンテンツ */}
        <View style={styles.content}>
          {/* 開始日 */}
          <View style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.label}>
              開始日
            </ThemedText>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={tempStartDate}
                onChange={(e) => setTempStartDate(e.target.value)}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.card,
                  color: colors.text,
                  fontSize: 14,
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
            ) : (
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  },
                ]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.text + '80'}
                value={tempStartDate}
                onChangeText={setTempStartDate}
              />
            )}
          </View>

          {/* 終了日 */}
          <View style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.label}>
              終了日
            </ThemedText>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={tempEndDate}
                onChange={(e) => setTempEndDate(e.target.value)}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.card,
                  color: colors.text,
                  fontSize: 14,
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
            ) : (
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  },
                ]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.text + '80'}
                value={tempEndDate}
                onChangeText={setTempEndDate}
              />
            )}
          </View>

          {/* プリセット */}
          <View style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.label}>
              クイック選択
            </ThemedText>
            <View style={styles.presetButtons}>
              <Pressable
                onPress={() => {
                  const today = new Date();
                  setTempStartDate(today.toISOString().split('T')[0]);
                  setTempEndDate(today.toISOString().split('T')[0]);
                }}
                style={[styles.presetButton, { borderColor: colors.border }]}
              >
                <ThemedText type="default" style={{ fontSize: 12 }}>
                  今日
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => {
                  const today = new Date();
                  const weekStart = new Date(today);
                  weekStart.setDate(today.getDate() - today.getDay());
                  setTempStartDate(weekStart.toISOString().split('T')[0]);
                  setTempEndDate(today.toISOString().split('T')[0]);
                }}
                style={[styles.presetButton, { borderColor: colors.border }]}
              >
                <ThemedText type="default" style={{ fontSize: 12 }}>
                  今週
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => {
                  const today = new Date();
                  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                  setTempStartDate(monthStart.toISOString().split('T')[0]);
                  setTempEndDate(today.toISOString().split('T')[0]);
                }}
                style={[styles.presetButton, { borderColor: colors.border }]}
              >
                <ThemedText type="default" style={{ fontSize: 12 }}>
                  今月
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>

        {/* ボタン */}
        <View style={styles.footer}>
          <Pressable
            onPress={onCancel}
            style={[styles.button, styles.cancelButton]}
          >
            <ThemedText type="defaultSemiBold">キャンセル</ThemedText>
          </Pressable>
          <Pressable
            onPress={handleConfirm}
            style={[styles.button, styles.confirmButton, { backgroundColor: colors.tint }]}
          >
            <ThemedText type="defaultSemiBold" style={{ color: '#fff' }}>
              確定
            </ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 4,
  },
  presetButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  presetButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  confirmButton: {
    backgroundColor: '#4ECDC4',
  },
});
